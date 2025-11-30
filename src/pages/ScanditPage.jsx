import React, { useEffect, useRef, useState } from 'react';
import * as SDCCore from '@scandit/web-datacapture-core';
import * as SDCBarcode from '@scandit/web-datacapture-barcode';

const ScanditPage = () => {
    const [logs, setLogs] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [lastResult, setLastResult] = useState(null);

    const viewRef = useRef(null);
    const contextRef = useRef(null);
    const cameraRef = useRef(null);
    const barcodeCaptureRef = useRef(null);
    const containerRef = useRef(null);

    const LICENSE_KEY = import.meta.env.VITE_SCANDIT_LICENSE_KEY;

    const addLog = (msg) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
    };

    const cleanupScanner = async () => {
        try {
            if (viewRef.current) {
                viewRef.current.detachFromContainer();
                viewRef.current = null;
            }
            if (barcodeCaptureRef.current) {
                await barcodeCaptureRef.current.setEnabled(false);
                barcodeCaptureRef.current = null;
            }
            if (cameraRef.current) {
                await cameraRef.current.switchToDesiredState(SDCCore.FrameSourceState.Off);
                cameraRef.current = null;
            }
            if (contextRef.current) {
                await contextRef.current.dispose();
                contextRef.current = null;
            }
        } catch (err) {
            console.error(err);
        }
    };

    const startScanner = async () => {
        if (isScanning || !LICENSE_KEY) return;
        setIsScanning(true);
        setLastResult(null);

        try {
            await cleanupScanner();
            addLog("Starting initialization sequence...");

            // 1. Create View immediately
            const view = new SDCCore.DataCaptureView();
            viewRef.current = view;

            // 2. Setup Camera (Best Guess)
            addLog("Selecting camera...");
            const camera = SDCCore.Camera.pickBestGuess();
            if (!camera) throw new Error("No camera found");
            cameraRef.current = camera;

            // Apply settings
            const cameraSettings = SDCBarcode.BarcodeCapture.recommendedCameraSettings;
            await camera.applySettings(cameraSettings);

            // Turn camera ON immediately
            addLog("Starting camera stream...");
            await camera.switchToDesiredState(SDCCore.FrameSourceState.On);

            // 3. Connect View to Element WITH Camera (Crucial step from your example)
            if (containerRef.current) {
                view.connectToElement(containerRef.current);
                addLog("✓ View connected to DOM");
            }

            // 4. Create Context
            addLog("Loading Scandit engine...");
            const context = await SDCCore.DataCaptureContext.forLicenseKey(LICENSE_KEY, {
                libraryLocation: "https://cdn.jsdelivr.net/npm/@scandit/web-datacapture-barcode@6/build/engine/",
                moduleLoaders: [SDCBarcode.barcodeCaptureLoader()]
            });
            contextRef.current = context;
            addLog("✓ Engine loaded");

            // 5. Link everything
            await view.setContext(context);
            await context.setFrameSource(camera);

            // 6. Configure Barcode Capture
            const settings = new SDCBarcode.BarcodeCaptureSettings();
            settings.enableSymbologies([
                SDCBarcode.Symbology.Code128,
                SDCBarcode.Symbology.EAN13UPCA,
                SDCBarcode.Symbology.EAN8,
                SDCBarcode.Symbology.QR
            ]);

            // Setup Code 128 specific settings if needed (from your example)
            const code128Settings = settings.settingsForSymbology(SDCBarcode.Symbology.Code128);
            code128Settings.activeSymbolCounts = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

            const barcodeCapture = await SDCBarcode.BarcodeCapture.forContext(context, settings);
            barcodeCaptureRef.current = barcodeCapture;

            // 7. Add Overlay
            const overlay = await SDCBarcode.BarcodeCaptureOverlay.withBarcodeCaptureForView(
                barcodeCapture,
                view
            );
            // Add viewfinder (Square or Rectangular)
            overlay.viewfinder = new SDCCore.RectangularViewfinder(
                SDCCore.RectangularViewfinderStyle.Square,
                SDCCore.RectangularViewfinderLineStyle.Light
            );

            // 8. Add Listener (Continuous Mode)
            barcodeCapture.addListener({
                didScan: async (mode, session) => {
                    const barcode = session.newlyRecognizedBarcodes[0];
                    if (barcode) {
                        const data = barcode.data;
                        const symbology = barcode.symbology;

                        setLastResult(data);
                        addLog(`✓ SCANNED: ${data} (${symbology})`);

                        if (navigator.vibrate) navigator.vibrate(200);

                        // NOTE: We do NOT disable the scanner here to allow continuous scanning
                        // If you wanted "Tap to scan next", you would disable it here.
                    }
                }
            });

            // 9. Enable Capture
            await barcodeCapture.setEnabled(true);
            addLog("✓ Scanner running (Continuous)");

        } catch (err) {
            addLog(`✗ ERROR: ${err.message}`);
            console.error("Full error:", err);
            setIsScanning(false);
            await cleanupScanner();
        }
    };

    const stopScanner = async () => {
        addLog("Stopping scanner...");
        await cleanupScanner();
        setIsScanning(false);
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
        }
        addLog("Scanner stopped.");
    };

    useEffect(() => {
        return () => {
            cleanupScanner();
        };
    }, []);

    return (
        <div className="card">
            <h2>Test Scandit SDK (Continuous)</h2>

            {!LICENSE_KEY && (
                <div style={{
                    background: '#fee2e2',
                    border: '1px solid #dc2626',
                    color: '#991b1b',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                }}>
                    <strong>❌ Erreur Configuration</strong>
                    <p>Clé de licence manquante dans .env</p>
                </div>
            )}

            {LICENSE_KEY && (
                <>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', justifyContent: 'center' }}>
                        {!isScanning ? (
                            <button onClick={startScanner} style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                                🎥 Démarrer Caméra
                            </button>
                        ) : (
                            <button onClick={stopScanner} style={{ backgroundColor: '#dc2626', padding: '1rem 2rem', fontSize: '1.1rem' }}>
                                ⏹ Arrêter
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
                            fontWeight: 'bold',
                            textAlign: 'center'
                        }}>
                            ✓ {lastResult}
                        </div>
                    )}

                    <div
                        ref={containerRef}
                        id="data-capture-view"
                        style={{
                            width: '100%',
                            height: '60vh',
                            minHeight: '400px',
                            margin: '0 auto',
                            backgroundColor: '#000',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            position: 'relative',
                            border: '2px solid #333'
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
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📷</div>
                                <div>Mode Continu</div>
                            </div>
                        )}
                    </div>
                </>
            )}

            <div style={{ marginTop: '1rem', maxHeight: '200px', overflow: 'auto', fontSize: '0.8rem', textAlign: 'left', background: '#f5f5f5', padding: '0.5rem' }}>
                <strong>Logs:</strong>
                {logs.map((log, i) => (
                    <div key={i} style={{ borderBottom: '1px solid #ddd' }}>{log}</div>
                ))}
            </div>
        </div>
    );
};

export default ScanditPage;
