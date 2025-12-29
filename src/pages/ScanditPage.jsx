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
        setLogs((prev) => [`[${time}] ${msg}`, ...prev].slice(0, 50));
    };

    const cleanupScanner = async () => {
        try {
            if (viewRef.current) {
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
            console.error('Cleanup error:', err);
        }
    };

    const startScanner = async () => {
        if (isScanning || !LICENSE_KEY) return;
        setIsScanning(true);
        setScannedCodes([]);

        try {
            await cleanupScanner();
            addLog('🚀 Starting initialization sequence...');

            // 1. Créer le contexte EN PREMIER (moteur + licence)
            addLog('📥 Loading Scandit engine...');
            const context = await SDCCore.DataCaptureContext.forLicenseKey(LICENSE_KEY, {
                // Correct path for v8 engine files
                libraryLocation: 'https://cdn.jsdelivr.net/npm/@scandit/web-datacapture-barcode@8.0.0/build/engine/',
                moduleLoaders: [SDCBarcode.barcodeCaptureLoader()],
            });
            contextRef.current = context;
            addLog('✅ Engine loaded successfully');

            // 2. Créer la vue
            const view = new SDCCore.DataCaptureView();
            viewRef.current = view;

            // 3. Configurer la caméra
            addLog('📷 Selecting camera...');
            const camera = SDCCore.Camera.pickBestGuess();
            if (!camera) throw new Error('No camera available');
            cameraRef.current = camera;

            const cameraSettings = SDCBarcode.BarcodeCapture.recommendedCameraSettings;
            await camera.applySettings(cameraSettings);

            // 4. Connecter la vue au DOM
            if (containerRef.current) {
                view.connectToElement(containerRef.current);
                addLog('✅ View connected to DOM');
            }

            // 5. Lier contexte et caméra
            await view.setContext(context);
            await context.setFrameSource(camera);

            // 6. Configurer BarcodeCapture
            addLog('🔧 Configuring barcode capture...');
            const settings = new SDCBarcode.BarcodeCaptureSettings();
            settings.enableSymbologies([
                SDCBarcode.Symbology.Code128,
                SDCBarcode.Symbology.EAN13UPCA,
                SDCBarcode.Symbology.EAN8,
                SDCBarcode.Symbology.QR,
            ]);

            const barcodeCapture = await SDCBarcode.BarcodeCapture.forContext(context, settings);
            barcodeCaptureRef.current = barcodeCapture;

            // 7. Overlay et contrôles
            const overlay = await SDCBarcode.BarcodeCaptureOverlay.withBarcodeCaptureForView(
                barcodeCapture,
                view
            );
            overlay.viewfinder = new SDCCore.RectangularViewfinder(
                SDCCore.RectangularViewfinderStyle.Square,
                SDCCore.RectangularViewfinderLineStyle.Light
            );

            // Contrôle changement caméra
            view.addControl(new SDCCore.CameraSwitchControl());

            // 8. Listener pour les scans
            barcodeCapture.addListener({
                didScan: async (barcodeCapture, session) => {
                    const barcode = session.newlyRecognizedBarcodes[0];
                    if (barcode) {
                        const data = barcode.data;
                        const symbology = barcode.symbology;
                        setScannedCodes((prev) => [
                            { data, symbology, time: new Date().toLocaleTimeString() },
                            ...prev,
                        ]);
                        addLog(`✅ SCANNED: ${data} (${symbology})`);
                    }
                },
            });

            // 9. Démarrer caméra et capture
            addLog('▶️ Starting camera stream...');
            await camera.switchToDesiredState(SDCCore.FrameSourceState.On);
            await barcodeCapture.setEnabled(true);
            addLog('🎉 Scanner fully operational (Continuous mode)');

        } catch (err) {
            addLog(`❌ ERROR: ${err.message || 'Unknown error'}`);
            console.error('Full error:', err);
            setIsScanning(false);
            await cleanupScanner();
        }
    };

    const stopScanner = async () => {
        addLog('⏹️ Stopping scanner...');
        await cleanupScanner();
        setIsScanning(false);
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
        }
        addLog('✅ Scanner stopped');
    };

    useEffect(() => {
        return () => {
            cleanupScanner();
        };
    }, []);

    return (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
            <h2>🔍 Test Scandit SDK (Mode Continu)</h2>

            {!LICENSE_KEY && (
                <div
                    style={{
                        background: '#fee2e2',
                        border: '1px solid #dc2626',
                        color: '#991b1b',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                    }}
                >
                    <strong>❌ Erreur Configuration</strong>
                    <p>VITE_SCANDIT_LICENSE_KEY manquante dans .env</p>
                </div>
            )}

            {LICENSE_KEY && (
                <>
                    {/* Conteneur Scanner */}
                    <div
                        ref={containerRef}
                        id="data-capture-view"
                        style={{
                            width: '100%',
                            height: '50vh',
                            minHeight: '300px',
                            backgroundColor: '#000',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            position: 'relative',
                            border: '3px solid #333',
                        }}
                    >
                        {!isScanning && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    color: '#888',
                                    textAlign: 'center',
                                    fontSize: '1.2rem',
                                }}
                            >
                                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📷</div>
                                <div>Appuyez pour démarrer</div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Mode Continu</div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', justifyContent: 'center' }}>
                        {!isScanning ? (
                            <button
                                onClick={startScanner}
                                style={{
                                    padding: '1rem 2rem',
                                    fontSize: '1.1rem',
                                    background: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                🎥 Démarrer Caméra
                            </button>
                        ) : (
                            <button
                                onClick={stopScanner}
                                style={{
                                    backgroundColor: '#dc2626',
                                    color: 'white',
                                    padding: '1rem 2rem',
                                    fontSize: '1.1rem',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                ⏹️ Arrêter
                            </button>
                        )}
                    </div>

                    {/* Liste des codes scannés */}
                    {scannedCodes.length > 0 && (
                        <div
                            style={{
                                background: '#f0fdf4',
                                border: '2px solid #22c55e',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                maxHeight: '250px',
                                overflowY: 'auto',
                            }}
                        >
                            <h3 style={{ margin: '0 0 1rem 0', color: '#15803d', fontSize: '1.2rem' }}>
                                📋 Codes Scannés ({scannedCodes.length})
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {scannedCodes.map((code, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '1rem',
                                            background: 'white',
                                            borderRadius: '8px',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                            borderLeft: '4px solid #22c55e',
                                        }}
                                    >
                                        <span style={{
                                            fontWeight: 'bold',
                                            fontFamily: 'monospace',
                                            fontSize: '1.1rem',
                                            color: '#15803d'
                                        }}>
                                            {code.data}
                                        </span>
                                        <span style={{
                                            color: '#666',
                                            fontSize: '0.9rem',
                                            background: '#f0f9ff',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '12px'
                                        }}>
                                            {code.symbology} • {code.time}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Logs */}
            <div
                style={{
                    marginTop: '2rem',
                    maxHeight: '250px',
                    overflow: 'auto',
                    fontSize: '0.85rem',
                    textAlign: 'left',
                    background: '#f8fafc',
                    padding: '1rem',
                    color: '#334155',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                }}
            >
                <strong>📋 Logs récents:</strong>
                {logs.map((log, i) => (
                    <div
                        key={i}
                        style={{
                            borderBottom: '1px solid #e2e8f0',
                            padding: '0.5rem 0',
                            wordBreak: 'break-all'
                        }}
                    >
                        {log}
                    </div>
                ))}
            </div>

            {/* Checklist de diagnostic */}
            <details style={{ marginTop: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>🔧 Checklist si problème persiste</summary>
                <ul style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    <li>✅ HTTPS ou localhost requis</li>
                    <li>✅ Clé licence Web (pas mobile)</li>
                    <li>✅ Vérifier Console + Réseau (404 sur .wasm?)</li>
                    <li>✅ Versions packages identiques (@scandit/...@8.x)</li>
                </ul>
            </details>
        </div >
    );
};

export default ScanditPage;
