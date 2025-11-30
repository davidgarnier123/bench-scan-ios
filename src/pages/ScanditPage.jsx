import React, { useEffect, useRef, useState } from 'react';
import * as SDCCore from '@scandit/web-datacapture-core';
import * as SDCBarcode from '@scandit/web-datacapture-barcode';

const ScanditPage = () => {
    const [logs, setLogs] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const contextRef = useRef(null);
    const sparkScanRef = useRef(null);
    const viewRef = useRef(null);
    const containerRef = useRef(null);

    // Récupération de la clé depuis la variable d'environnement
    const LICENSE_KEY = import.meta.env.VITE_SCANDIT_LICENSE_KEY;

    const addLog = (msg) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
    };

    const cleanupScanner = async () => {
        try {
            if (sparkScanRef.current) {
                await sparkScanRef.current.setEnabled(false);
                sparkScanRef.current = null;
            }
            if (viewRef.current) {
                viewRef.current.dispose();
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
        if (isScanning || !LICENSE_KEY) return;
        setIsScanning(true);
        setLastResult(null);

        try {
            await cleanupScanner();

            addLog("Creating DataCaptureContext with license...");
            // Create context with license key - this is the correct way
            const context = await SDCCore.DataCaptureContext.forLicenseKey(LICENSE_KEY);
            contextRef.current = context;
            addLog("✓ Context created successfully");

            addLog("Configuring camera...");
            const camera = SDCCore.Camera.default;
            const cameraSettings = SDCBarcode.SparkScan.recommendedCameraSettings;
            await camera.applySettings(cameraSettings);
            await context.setFrameSource(camera);
            addLog("✓ Camera configured");

            addLog("Setting up SparkScan...");
            const settings = new SDCBarcode.SparkScanSettings();

            // Enable CODE_128 by default
            settings.enableSymbologies([
                SDCBarcode.Symbology.Code128,
                SDCBarcode.Symbology.EAN13UPCA,
                SDCBarcode.Symbology.EAN8,
                SDCBarcode.Symbology.QR
            ]);

            // Configure CODE_128 settings
            const code128Settings = settings.settingsForSymbology(SDCBarcode.Symbology.Code128);
            code128Settings.activeSymbolCounts = [7, 8, 9, 10, 11, 12, 13, 14, 15];

            // Create SparkScan mode
            const sparkScan = await SDCBarcode.SparkScan.forSettings(settings);
            sparkScanRef.current = sparkScan;

            // Add listener for scan events
            sparkScan.addListener({
                didScan: async (sparkScan, session) => {
                    const barcode = session.newlyRecognizedBarcodes[0];
                    if (barcode) {
                        const result = barcode.data;
                        setLastResult(result);
                        addLog(`✓ SCANNED: ${result} [${barcode.symbology}]`);
                        if (navigator.vibrate) navigator.vibrate(200);
                    }
                }
            });

            addLog("Creating SparkScan view...");
            // Create SparkScan view with pre-built UI
            const sparkScanView = await SDCBarcode.SparkScanView.forContext(
                context,
                sparkScan,
                {
                    previewSizeControlVisible: true,
                    torchButtonVisible: true,
                    scanningBehaviorButtonVisible: true,
                    handModeButtonVisible: true,
                    barcodeCountButtonVisible: false,
                    fastFindButtonVisible: false,
                    targetModeButtonVisible: true,
                    soundEnabled: true,
                    hapticEnabled: true,
                    hardwareTriggerEnabled: true,
                    visualFeedbackEnabled: true
                }
            );

            viewRef.current = sparkScanView;

            if (containerRef.current) {
                // Clear container
                containerRef.current.innerHTML = '';
                // Attach view to container
                containerRef.current.appendChild(sparkScanView.htmlElement);
            }

            addLog("Starting camera...");
            await camera.switchToDesiredState(SDCCore.FrameSourceState.On);
            await sparkScan.setEnabled(true);

            addLog("✓ SparkScan ready!");
            setIsInitialized(true);

        } catch (err) {
            addLog(`✗ START ERROR: ${err.message}`);
            console.error("Full error:", err);
            setIsScanning(false);
            await cleanupScanner();
        }
    };

    const stopScanner = async () => {
        addLog("Stopping scanner...");
        await cleanupScanner();
        setIsScanning(false);
        setIsInitialized(false);
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
        }
        addLog("Scanner stopped.");
    };

    useEffect(() => {
        if (LICENSE_KEY) {
            addLog("✓ License key loaded from environment");
        } else {
            addLog("✗ No license key found in environment variables");
        }

        return () => {
            cleanupScanner();
        };
    }, []);

    return (
        <div className="card">
            <h2>Test Scandit SDK (SparkScan)</h2>

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

            {LICENSE_KEY && (
                <>
                    <div style={{
                        background: '#dbeafe',
                        border: '1px solid #3b82f6',
                        color: '#1e40af',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        textAlign: 'left'
                    }}>
                        <strong>ℹ️ SparkScan</strong>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                            Interface pré-construite de Scandit avec UI optimisée pour le scanning de codes-barres.
                            Inclut : feedback visuel/audio/haptique, contrôles caméra, mode ciblage, et plus.
                        </p>
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        marginBottom: '1rem',
                        justifyContent: 'center'
                    }}>
                        {!isScanning ? (
                            <button onClick={startScanner} style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                                🚀 Start SparkScan
                            </button>
                        ) : (
                            <button onClick={stopScanner} style={{ backgroundColor: '#dc2626', padding: '1rem 2rem', fontSize: '1.1rem' }}>
                                ⛔ Stop Scanner
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
                            ✓ SCANNED: {lastResult}
                        </div>
                    )}

                    <div
                        ref={containerRef}
                        className="scanner-box"
                        style={{
                            width: '100%',
                            maxWidth: '800px',
                            minHeight: '500px',
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
                                textAlign: 'center',
                                padding: '2rem'
                            }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
                                <div>Cliquez sur "Start SparkScan" pour commencer</div>
                            </div>
                        )}
                    </div>
                </>
            )}

            <div className="log-container" style={{ marginTop: '1rem', maxHeight: '300px', overflow: 'auto' }}>
                <h3>Logs:</h3>
                {logs.map((log, i) => (
                    <div key={i} style={{
                        fontSize: '0.85rem',
                        padding: '0.25rem',
                        borderBottom: '1px solid #333'
                    }}>
                        {log}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ScanditPage;
