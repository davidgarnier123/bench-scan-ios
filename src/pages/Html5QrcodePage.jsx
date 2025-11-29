import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const Html5QrcodePage = () => {
    const [logs, setLogs] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [lastResult, setLastResult] = useState(null);

    // Settings State
    const [resolution, setResolution] = useState('HD');
    const [fps, setFps] = useState(10);
    const [focusMode, setFocusMode] = useState('continuous');
    const [boxWidth, setBoxWidth] = useState(250);

    const scannerRef = useRef(null);
    const scannerId = "html5-qrcode-reader";

    const addLog = (msg) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
    };

    const cleanupScanner = async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    addLog("Stopping scanner...");
                    await scannerRef.current.stop();
                    addLog("Scanner stopped.");
                }
                scannerRef.current.clear();
            } catch (err) {
                addLog(`Cleanup error: ${err}`);
            }
            scannerRef.current = null;
        }
    };

    const startScanner = async () => {
        if (isScanning) return;
        setIsScanning(true);
        setLastResult(null);

        try {
            await cleanupScanner();

            addLog("Initializing Html5Qrcode...");
            const html5QrCode = new Html5Qrcode(scannerId);
            scannerRef.current = html5QrCode;

            const config = {
                fps: parseInt(fps),
                qrbox: { width: parseInt(boxWidth), height: 150 },
                aspectRatio: 1.0,
                formatsToSupport: [Html5QrcodeSupportedFormats.CODE_128],
                // Experimental feature for focus
                videoConstraints: {
                    focusMode: focusMode
                }
            };

            // Define resolution constraints
            let resConstraints = { facingMode: "environment" };

            // Add advanced constraints for focus if supported
            if (focusMode !== 'default') {
                resConstraints.advanced = [{ focusMode: focusMode }];
            }

            if (resolution === 'HD') {
                resConstraints.width = { min: 720, ideal: 1280 };
                resConstraints.height = { min: 480, ideal: 720 };
            }
            if (resolution === 'FHD') {
                resConstraints.width = { min: 1080, ideal: 1920 };
                resConstraints.height = { min: 720, ideal: 1080 };
            }

            addLog(`Starting... Res: ${resolution}, FPS: ${fps}, Focus: ${focusMode}`);

            // First argument: Camera ID or Config (facingMode)
            // Second argument: Configuration (fps, qrbox, etc.)
            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    ...config,
                    videoConstraints: resConstraints // Pass constraints here as per library docs for some versions, or mixed in. 
                                                   // Actually, for start(), the first arg is camera, second is config. 
                                                   // Video constraints usually go into the config object if not using deviceId.
                                                   // BUT, html5-qrcode is tricky. 
                                                   // Let's pass the constraints in the config object's videoConstraints property, 
                                                   // and keep the first arg simple.
                    videoConstraints: resConstraints
                },
                (decodedText, decodedResult) => {
                    setLastResult(decodedText);
                    addLog(`SCANNED: ${decodedText}`);
                    if (navigator.vibrate) navigator.vibrate(200);
                },
                (errorMessage) => {
                    // ignore parse errors
                }
            );
            addLog("Scanner started successfully.");

        } catch (err) {
            addLog(`START ERROR: ${err}`);
            setIsScanning(false);

            if (err?.message?.includes("already under transition")) {
                addLog("Race condition detected. Retrying in 1s...");
                setTimeout(() => {
                    setIsScanning(false);
                    startScanner();
                }, 1000);
            }
        }
    };

    const stopScanner = async () => {
        await cleanupScanner();
        setIsScanning(false);
    };

    useEffect(() => {
        return () => { cleanupScanner(); };
    }, []);

    return (
        <div className="card">
            <h2>Test html5-qrcode</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem', textAlign: 'left', maxWidth: '400px', margin: '0 auto 1rem auto' }}>

                {/* Resolution */}
                <div>
                    <label>Resolution: </label>
                    <select value={resolution} onChange={(e) => setResolution(e.target.value)} disabled={isScanning}>
                        <option value="SD">SD (Default)</option>
                        <option value="HD">HD (720p)</option>
                        <option value="FHD">Full HD (1080p)</option>
                    </select>
                </div>

                {/* FPS */}
                <div>
                    <label>FPS: {fps}</label>
                    <input
                        type="range" min="1" max="60" value={fps}
                        onChange={(e) => setFps(e.target.value)}
                        disabled={isScanning}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* Focus Mode */}
                <div>
                    <label>Focus Mode: </label>
                    <select value={focusMode} onChange={(e) => setFocusMode(e.target.value)} disabled={isScanning}>
                        <option value="default">Default</option>
                        <option value="continuous">Continuous</option>
                        <option value="single-shot">Single Shot</option>
                        <option value="macro">Macro</option>
                    </select>
                </div>

                {/* Scan Box Width */}
                <div>
                    <label>Scan Box Width: {boxWidth}px</label>
                    <input
                        type="range" min="150" max="350" value={boxWidth}
                        onChange={(e) => setBoxWidth(e.target.value)}
                        disabled={isScanning}
                        style={{ width: '100%' }}
                    />
                </div>

                {!isScanning ? (
                    <button onClick={startScanner} style={{ width: '100%', marginTop: '1rem' }}>Start Camera</button>
                ) : (
                    <button onClick={stopScanner} style={{ backgroundColor: '#dc2626', width: '100%', marginTop: '1rem' }}>Stop Camera</button>
                )}
            </div>

            {lastResult && (
                <div style={{ background: '#22c55e', color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    <strong>FOUND:</strong> {lastResult}
                </div>
            )}

            <div className="scanner-box">
                <div id={scannerId}></div>
            </div>

            <div className="log-container">
                {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
        </div>
    );
};

export default Html5QrcodePage;
