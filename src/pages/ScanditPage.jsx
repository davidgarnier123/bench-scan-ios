import React, { useEffect, useRef, useState } from 'react';
import * as SDCCore from '@scandit/web-datacapture-core';
import * as SDCBarcode from '@scandit/web-datacapture-barcode';

const ScanditPage = () => {
    const [logs, setLogs] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [lastResult, setLastResult] = useState(null);

    const contextRef = useRef(null);
    const barcodeCaptureRef = useRef(null);
    const viewRef = useRef(null);
    const containerRef = useRef(null);
    const cameraRef = useRef(null);

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
            addLog(`Cleanup error: ${err.message}`);
        }
    };

    const startScanner = async () => {
        if (isScanning || !LICENSE_KEY) return;
        setIsScanning(true);
        setLastResult(null);

        try {
            await cleanupScanner();

            addLog("Initializing Scandit BarcodeCapture...");

            // 1. Create Context
            const context = await SDCCore.DataCaptureContext.forLicenseKey(LICENSE_KEY, {
                libraryLocation: "https://cdn.jsdelivr.net/npm/@scandit/web-datacapture-barcode@6/build/engine/",
                moduleLoaders: [SDCBarcode.barcodeCaptureLoader()]
            });
            contextRef.current = context;
            addLog("✓ Context created");

            // 2. Configure Camera
            const camera = SDCCore.Camera.default;
            if (!camera) throw new Error("No camera found");

            context.setFrameSource(camera);
            cameraRef.current = camera;

            const cameraSettings = SDCBarcode.BarcodeCapture.recommendedCameraSettings;
            await camera.applySettings(cameraSettings);
            await camera.switchToDesiredState(SDCCore.FrameSourceState.On);
            addLog("✓ Camera started");

            // 3. Configure Barcode Capture Settings
            const settings = new SDCBarcode.BarcodeCaptureSettings();
            settings.enableSymbologies([
                SDCBarcode.Symbology.Code128,
                SDCBarcode.Symbology.EAN13UPCA,
                SDCBarcode.Symbology.EAN8,
                SDCBarcode.Symbology.QR
            ]);

            // 4. Create Barcode Capture Mode
            const barcodeCapture = await SDCBarcode.BarcodeCapture.forSettings(settings);
            await barcodeCapture.setEnabled(true);
            barcodeCaptureRef.current = barcodeCapture;

            // 5. Add Listener
            barcodeCapture.addListener({
                didScan: (mode, session) => {
                    const barcode = session.newlyRecognizedBarcodes[0];
                    if (barcode) {
                        const data = barcode.data;
                        setLastResult(data);
                        addLog(`✓ SCANNED: ${data}`);
                        if (navigator.vibrate) navigator.vibrate(200);
                    }
                }
            });

            // 6. Add Mode to Context
            await context.addMode(barcodeCapture);

            // 7. Create Data Capture View
            if (!containerRef.current) throw new Error("Container not found");

            const view = await SDCCore.DataCaptureView.forContext(context);
            view.connectToElement(containerRef.current);
            viewRef.current = view;

            // Add overlay
            const overlay = await SDCBarcode.BarcodeCaptureOverlay.withBarcodeCaptureForView(
                barcodeCapture,
                view
            );
            overlay.viewfinder = new SDCCore.RectangularViewfinder();

            addLog("✓ Scanner running in continuous mode");

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
                        style={{
                            width: '100%',
                            height: '500px',
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
