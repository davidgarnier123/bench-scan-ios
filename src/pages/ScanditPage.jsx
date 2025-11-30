import React, { useEffect, useRef, useState } from 'react';
import * as SDCCore from '@scandit/web-datacapture-core';
import * as SDCBarcode from '@scandit/web-datacapture-barcode';

const ScanditPage = () => {
    const [logs, setLogs] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [lastResult, setLastResult] = useState(null);

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
            if (viewRef.current) {
                viewRef.current.dispose();
                viewRef.current = null;
            }
            if (sparkScanRef.current) {
                sparkScanRef.current = null;
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

            addLog("Creating DataCaptureContext...");
            const context = await SDCCore.DataCaptureContext.forLicenseKey(LICENSE_KEY, {
                libraryLocation: "https://cdn.jsdelivr.net/npm/@scandit/web-datacapture-barcode@6/build/engine/",
                moduleLoaders: [SDCBarcode.barcodeCaptureLoader()]
            });
            contextRef.current = context;
            addLog("✓ Context created");

            addLog("Setting up SparkScan...");
            const settings = new SDCBarcode.SparkScanSettings();

            // Enable symbologies
            settings.enableSymbologies([
                SDCBarcode.Symbology.Code128,
                SDCBarcode.Symbology.EAN13UPCA,
                SDCBarcode.Symbology.EAN8,
                SDCBarcode.Symbology.QR
            ]);

            // Create SparkScan
            const sparkScan = await SDCBarcode.SparkScan.forSettings(settings);
            sparkScanRef.current = sparkScan;

            // Add scan listener
            sparkScan.addListener({
                didScan: (sparkScan, session) => {
                    const barcode = session.newlyRecognizedBarcodes[0];
                    if (barcode) {
                        setLastResult(barcode.data);
                        addLog(`✓ SCANNED: ${barcode.data}`);
                        if (navigator.vibrate) navigator.vibrate(200);
                    }
                }
            });

            addLog("Creating SparkScan view...");
            const viewSettings = new SDCBarcode.SparkScanViewSettings();
            viewSettings.torchButtonVisible = true;
            viewSettings.scanningBehaviorButtonVisible = true;
            viewSettings.targetModeButtonVisible = true;

            const sparkScanView = SDCBarcode.SparkScanView.forContext(context, sparkScan, viewSettings);
            viewRef.current = sparkScanView;

            if (containerRef.current) {
                containerRef.current.innerHTML = '';
                containerRef.current.appendChild(sparkScanView.htmlElement);
            }

            addLog("Starting scanner...");
            await sparkScanView.prepareScanning();

            addLog("✓ SparkScan ready!");

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
        if (LICENSE_KEY) {
            addLog("✓ License key loaded");
        } else {
            addLog("✗ No license key found");
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
                    marginBottom: '1rem'
                }}>
                    <strong>❌ Erreur</strong>
                    <p style={{ margin: '0.5rem 0 0 0' }}>
                        Variable VITE_SCANDIT_LICENSE_KEY non définie.
                        Créez un fichier .env avec votre clé Scandit.
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
                        marginBottom: '1rem'
                    }}>
                        <strong>ℹ️ SparkScan</strong>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                            Interface optimisée de Scandit pour le scan de codes-barres.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', justifyContent: 'center' }}>
                        {!isScanning ? (
                            <button onClick={startScanner} style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                                🚀 Start Scanner
                            </button>
                        ) : (
                            <button onClick={stopScanner} style={{ backgroundColor: '#dc2626', padding: '1rem 2rem', fontSize: '1.1rem' }}>
                                ⛔ Stop
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
                            ✓ RÉSULTAT: {lastResult}
                        </div>
                    )}

                    <div
                        ref={containerRef}
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
                                <div>Cliquez sur "Start Scanner"</div>
                            </div>
                        )}
                    </div>
                </>
            )}

            <div style={{ marginTop: '1rem', maxHeight: '300px', overflow: 'auto' }}>
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
