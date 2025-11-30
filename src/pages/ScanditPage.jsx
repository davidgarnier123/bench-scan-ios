import React, { useEffect, useRef, useState } from 'react';
import * as SDCCore from '@scandit/web-datacapture-core';
import * as SDCBarcode from '@scandit/web-datacapture-barcode';

const ScanditPage = () => {
    const [logs, setLogs] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const [isLicenseValid, setIsLicenseValid] = useState(false);

    // Settings State
    const [enabledSymbologies, setEnabledSymbologies] = useState(['CODE_128']);
    const [scanAreaHeight, setScanAreaHeight] = useState(0.3);
    const [scanAreaWidth, setScanAreaWidth] = useState(0.8);
    const [cameraResolution, setCameraResolution] = useState('HD');

    const contextRef = useRef(null);
    const cameraRef = useRef(null);
    const barcodeTrackingRef = useRef(null);
    const viewRef = useRef(null);
    const containerRef = useRef(null);

    // Récupération de la clé depuis la variable d'environnement
    const LICENSE_KEY = import.meta.env.VITE_SCANDIT_LICENSE_KEY;

    const addLog = (msg) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
    };

    const initializeLicense = async (key) => {
        try {
            addLog("Initializing Scandit license...");
            await SDCCore.configure({
                licenseKey: key,
                libraryLocation: "https://cdn.jsdelivr.net/npm/@scandit/web-datacapture-barcode@latest/build/engine/",
                moduleLoaders: [SDCBarcode.barcodeCaptureLoader()]
            });
            setIsLicenseValid(true);
            addLog("✓ License configured successfully");
        } catch (err) {
            addLog(`✗ License error: ${err.message}`);
            setIsLicenseValid(false);
        }
    };

    const cleanupScanner = async () => {
        try {
            if (barcodeTrackingRef.current) {
                await barcodeTrackingRef.current.setEnabled(false);
                barcodeTrackingRef.current = null;
            }
            if (cameraRef.current) {
                await cameraRef.current.switchToDesiredState(SDCCore.FrameSourceState.Off);
                cameraRef.current = null;
            }
            if (viewRef.current && containerRef.current) {
                viewRef.current.detachFromElement();
                viewRef.current = null;
            }
            if (contextRef.current) {
                await contextRef.current.dispose();
                contextRef.current = null;
            }
        } catch (err) {
            addLog(`Cleanup error: ${err.message}`);
        }
    };

    const startScanner = async () => {
        if (isScanning || !isLicenseValid) return;
        setIsScanning(true);
        setLastResult(null);

        try {
            await cleanupScanner();

            addLog("Creating DataCaptureContext...");
            const context = await SDCCore.DataCaptureContext.create();
            contextRef.current = context;

            addLog("Configuring camera...");
            const camera = SDCCore.Camera.default;
            cameraRef.current = camera;

            // Configure camera resolution
            const cameraSettings = SDCBarcode.BarcodeCapture.recommendedCameraSettings;
            if (cameraResolution === 'HD') {
                cameraSettings.preferredResolution = SDCCore.VideoResolution.HD;
            } else if (cameraResolution === 'FHD') {
                cameraSettings.preferredResolution = SDCCore.VideoResolution.FullHD;
            } else if (cameraResolution === 'UHD') {
                cameraSettings.preferredResolution = SDCCore.VideoResolution.UHD4K;
            }

            await camera.applySettings(cameraSettings);
            await context.setFrameSource(camera);

            addLog("Setting up barcode capture...");
            const settings = new SDCBarcode.BarcodeCaptureSettings();

            // Enable selected symbologies
            const symbologyMap = {
                'CODE_128': SDCBarcode.Symbology.Code128,
                'QR': SDCBarcode.Symbology.QR,
                'EAN13': SDCBarcode.Symbology.EAN13UPCA,
                'EAN8': SDCBarcode.Symbology.EAN8,
                'CODE39': SDCBarcode.Symbology.Code39,
                'CODE93': SDCBarcode.Symbology.Code93,
                'DATAMATRIX': SDCBarcode.Symbology.DataMatrix,
            };

            enabledSymbologies.forEach(sym => {
                if (symbologyMap[sym]) {
                    settings.enableSymbology(symbologyMap[sym], true);
                }
            });

            // Configure scan area
            settings.locationSelection = SDCCore.RectangularLocationSelection.withSize(
                new SDCCore.SizeWithUnit(
                    new SDCCore.NumberWithUnit(scanAreaWidth, SDCCore.MeasureUnit.Fraction),
                    new SDCCore.NumberWithUnit(scanAreaHeight, SDCCore.MeasureUnit.Fraction)
                )
            );

            const barcodeCapture = await SDCBarcode.BarcodeCapture.forContext(context, settings);
            barcodeTrackingRef.current = barcodeCapture;

            // Set up barcode capture listener
            barcodeCapture.addListener({
                didScan: async (barcodeCapture, session) => {
                    const barcode = session.newlyRecognizedBarcodes[0];
                    if (barcode) {
                        const result = barcode.data;
                        setLastResult(result);
                        addLog(`✓ SCANNED: ${result} [${barcode.symbology}]`);
                        if (navigator.vibrate) navigator.vibrate(200);

                        // Pause briefly to show result
                        await barcodeCapture.setEnabled(false);
                        setTimeout(async () => {
                            if (barcodeTrackingRef.current) {
                                await barcodeCapture.setEnabled(true);
                            }
                        }, 1000);
                    }
                }
            });

            // Create and attach view
            addLog("Creating DataCaptureView...");
            const view = await SDCCore.DataCaptureView.forContext(context);
            viewRef.current = view;

            if (containerRef.current) {
                await view.connectToElement(containerRef.current);

                // Add overlay
                const overlay = await SDCBarcode.BarcodeCaptureOverlay.withBarcodeCaptureForView(
                    barcodeCapture,
                    view
                );
                overlay.viewfinder = new SDCCore.RectangularViewfinder(
                    SDCCore.RectangularViewfinderStyle.Square,
                    SDCCore.RectangularViewfinderLineStyle.Light
                );
            }

            addLog("Starting camera...");
            await barcodeCapture.setEnabled(true);
            await camera.switchToDesiredState(SDCCore.FrameSourceState.On);

            addLog("✓ Scanner ready!");

        } catch (err) {
            addLog(`✗ START ERROR: ${err.message}`);
            console.error(err);
            setIsScanning(false);
            await cleanupScanner();
        }
    };

    const stopScanner = async () => {
        addLog("Stopping scanner...");
        await cleanupScanner();
        setIsScanning(false);
        addLog("Scanner stopped.");
    };

    useEffect(() => {
        // Initialiser automatiquement avec la clé d'environnement si disponible
        if (LICENSE_KEY) {
            addLog("License key loaded from environment");
            initializeLicense(LICENSE_KEY);
        } else {
            addLog("⚠ No license key found in environment variables");
        }

        return () => {
            cleanupScanner();
        };
    }, []);

    return (
        <div className="card">
            <h2>Test Scandit SDK</h2>

            {!LICENSE_KEY && (
                <div style={{
                    background: '#fee2e2',
                    border: '1px solid #dc2626',
                    color: '#991b1b',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    textAlign: 'left'
                }}>
                    <strong>❌ Configuration Error</strong>
                    <p style={{ margin: '0.5rem 0 0 0' }}>
                        La variable d'environnement <code>VITE_SCANDIT_LICENSE_KEY</code> n'est pas définie.
                        <br />
                        Créez un fichier <code>.env</code> à la racine du projet avec votre clé Scandit.
                    </p>
                </div>
            )}

            {LICENSE_KEY && !isLicenseValid && (
                <div style={{
                    background: '#fef3c7',
                    border: '1px solid #fbbf24',
                    color: '#92400e',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    textAlign: 'left'
                }}>
                    <strong>⚠ License Initialization</strong>
                    <p style={{ margin: '0.5rem 0 0 0' }}>
                        Initialisation de la licence en cours...
                    </p>
                </div>
            )}

            {isLicenseValid && (
                <>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        marginBottom: '1rem',
                        textAlign: 'left',
                        maxWidth: '400px',
                        margin: '0 auto 1rem auto'
                    }}>
                        {/* Camera Resolution */}
                        <div>
                            <label>Resolution: </label>
                            <select
                                value={cameraResolution}
                                onChange={(e) => setCameraResolution(e.target.value)}
                                disabled={isScanning}
                            >
                                <option value="SD">SD (480p)</option>
                                <option value="HD">HD (720p)</option>
                                <option value="FHD">Full HD (1080p)</option>
                                <option value="UHD">4K UHD</option>
                            </select>
                        </div>

                        {/* Symbologies */}
                        <div>
                            <label>Barcode Types:</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                {['CODE_128', 'QR', 'EAN13', 'EAN8', 'CODE39', 'CODE93', 'DATAMATRIX'].map(sym => (
                                    <label key={sym} style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={enabledSymbologies.includes(sym)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setEnabledSymbologies([...enabledSymbologies, sym]);
                                                } else {
                                                    setEnabledSymbologies(enabledSymbologies.filter(s => s !== sym));
                                                }
                                            }}
                                            disabled={isScanning}
                                            style={{ marginRight: '0.25rem' }}
                                        />
                                        {sym}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Scan Area Width */}
                        <div>
                            <label>Scan Area Width: {Math.round(scanAreaWidth * 100)}%</label>
                            <input
                                type="range"
                                min="0.3"
                                max="1"
                                step="0.1"
                                value={scanAreaWidth}
                                onChange={(e) => setScanAreaWidth(parseFloat(e.target.value))}
                                disabled={isScanning}
                                style={{ width: '100%' }}
                            />
                        </div>

                        {/* Scan Area Height */}
                        <div>
                            <label>Scan Area Height: {Math.round(scanAreaHeight * 100)}%</label>
                            <input
                                type="range"
                                min="0.1"
                                max="0.5"
                                step="0.05"
                                value={scanAreaHeight}
                                onChange={(e) => setScanAreaHeight(parseFloat(e.target.value))}
                                disabled={isScanning}
                                style={{ width: '100%' }}
                            />
                        </div>

                        {!isScanning ? (
                            <button onClick={startScanner} style={{ width: '100%', marginTop: '1rem' }}>
                                Start Camera
                            </button>
                        ) : (
                            <button onClick={stopScanner} style={{ backgroundColor: '#dc2626', width: '100%', marginTop: '1rem' }}>
                                Stop Camera
                            </button>
                        )}
                    </div>

                    {lastResult && (
                        <div style={{
                            background: '#22c55e',
                            color: 'white',
                            padding: '1rem',
                            borderRadius: '8px',
                            marginBottom: '1rem',
                            fontSize: '1.2rem',
                            fontWeight: 'bold'
                        }}>
                            ✓ FOUND: {lastResult}
                        </div>
                    )}

                    <div
                        ref={containerRef}
                        className="scanner-box"
                        style={{
                            width: '100%',
                            maxWidth: '600px',
                            height: '400px',
                            margin: '0 auto',
                            backgroundColor: '#000',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            position: 'relative'
                        }}
                    >
                        {!isScanning && (
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                color: '#666',
                                textAlign: 'center'
                            }}>
                                Camera preview will appear here
                            </div>
                        )}
                    </div>
                </>
            )}

            <div className="log-container" style={{ marginTop: '1rem' }}>
                <h3>Logs:</h3>
                {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
        </div>
    );
};

export default ScanditPage;
