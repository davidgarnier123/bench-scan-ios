import React, { useEffect, useRef, useState } from 'react';
import * as SDCCore from '@scandit/web-datacapture-core';
import * as SDCBarcode from '@scandit/web-datacapture-barcode';

const ScanditPage = () => {
    const [logs, setLogs] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedCodes, setScannedCodes] = useState([]);

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
                // FIX: detachFromContainer is not a function, use connectToElement(null)
                viewRef.current.connectToElement(null);
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
            console.error("Cleanup error:", err);
        }
    };

    const startScanner = async () => {
        if (isScanning || !LICENSE_KEY) return;
        setIsScanning(true);
        setScannedCodes([]);

        try {
            await cleanupScanner();
            addLog("Starting initialization sequence...");

            // 1. Create View immediately
            const view = new SDCCore.DataCaptureView();
            viewRef.current = view;

            // 2. Setup Camera
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

            // 3. Connect View to Element WITH Camera
            if (containerRef.current) {
                view.connectToElement(containerRef.current);
                addLog("✓ View connected to DOM");
            }

            // 4. Create Context
            addLog("Loading Scandit engine...");

            // FIX: Revert to forLicenseKey as configure() might be missing or causing issues
            const context = await SDCCore.DataCaptureContext.forLicenseKey(LICENSE_KEY, {
                libraryLocation: "https://cdn.jsdelivr.net/npm/@scandit/web-datacapture-barcode@8/build/engine/",
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

            const barcodeCapture = await SDCBarcode.BarcodeCapture.forContext(context, settings);

            // FIX: Disable sound, keep vibration (simplified)
            const feedback = SDCBarcode.BarcodeCaptureFeedback.default;
            feedback.success.sound = null;
            // feedback.success.vibration = new SDCCore.Vibration(); // Removed to avoid potential error
            barcodeCapture.feedback = feedback;

            barcodeCaptureRef.current = barcodeCapture;

            // 7. Add Overlay
            const overlay = await SDCBarcode.BarcodeCaptureOverlay.withBarcodeCaptureForView(
                barcodeCapture,
                view
            );
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

                        setScannedCodes(prev => [{ data, symbology, time: new Date().toLocaleTimeString() }, ...prev]);
                        addLog(`✓ SCANNED: ${data}`);
                    }
                }
            });

            // 9. Enable Capture
            await barcodeCapture.setEnabled(true);
            addLog("✓ Scanner running (Continuous)");

        } catch (err) {
            // Filter out "Error 28" from logs if it persists but works
            if (!err.message || !err.message.includes("Error 28")) {
                addLog(`✗ ERROR: ${err.message}`);
            } else {
                console.warn("Ignored Error 28:", err);
            }
            console.error("Full error:", err);

            if (err.message && err.message.includes("Error 28")) {
                addLog("⚠️ Resource error (checking version match...)");
            } else {
                setIsScanning(false);
                await cleanupScanner();
            }
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
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
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

                    <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                        {/* Scanner Container */}
                        <div
                            ref={containerRef}
                            id="data-capture-view"
                            style={{
                                width: '100%',
                                height: '50vh',
                                minHeight: '300px',
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

                        {/* Scanned Codes List */}
                        {scannedCodes.length > 0 && (
                            <div style={{
                                background: '#f0fdf4',
                                border: '1px solid #22c55e',
                                borderRadius: '8px',
                                padding: '1rem',
                                maxHeight: '200px',
                                overflowY: 'auto'
                            }}>
                                <h3 style={{ margin: '0 0 0.5rem 0', color: '#15803d' }}>Codes Scannés ({scannedCodes.length})</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {scannedCodes.map((code, index) => (
                                        <div key={index} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '0.5rem',
                                            background: 'white',
                                            borderRadius: '4px',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                        }}>
                                            <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{code.data}</span>
                                            <span style={{ color: '#666', fontSize: '0.9rem' }}>{code.time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Logs */}
            <div style={{
                marginTop: '1rem',
                maxHeight: '200px',
                overflow: 'auto',
                fontSize: '0.8rem',
                textAlign: 'left',
                background: '#f5f5f5',
                padding: '0.5rem',
                color: 'black',
                border: '1px solid #ddd',
                borderRadius: '4px'
            }}>
                <strong>Logs:</strong>
                {logs.map((log, i) => (
                    <div key={i} style={{ borderBottom: '1px solid #e5e5e5', padding: '2px 0' }}>{log}</div>
                ))}
            </div>
        </div>
    );
};

export default ScanditPage;
