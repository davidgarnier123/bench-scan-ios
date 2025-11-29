import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const Html5QrcodePage = () => {
    const [logs, setLogs] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [resolution, setResolution] = useState('HD');
    const [lastResult, setLastResult] = useState(null);
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
                fps: 10,
                qrbox: { width: 250, height: 150 },
                aspectRatio: 1.0,
                formatsToSupport: [Html5QrcodeSupportedFormats.CODE_128],
            };

            let videoConstraints = { facingMode: "environment" };
            if (resolution === 'HD') videoConstraints = { ...videoConstraints, width: { min: 720, ideal: 1280 }, height: { min: 480, ideal: 720 } };
            if (resolution === 'FHD') videoConstraints = { ...videoConstraints, width: { min: 1080, ideal: 1920 }, height: { min: 720, ideal: 1080 } };

            addLog(`Starting with resolution: ${resolution}`);

            await html5QrCode.start(
                videoConstraints,
                config,
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

            // Retry logic for common Android race condition
            if (err?.message?.includes("already under transition")) {
                addLog("Race condition detected. Retrying in 1s...");
                setTimeout(() => {
                    setIsScanning(false); // Reset flag to allow retry
                    startScanner();
                }, 1000);
            }
        }
    };

    const stopScanner = async () => {
        await cleanupScanner();
        setIsScanning(false);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupScanner();
        };
    }, []);

    return (
        <div className="card">
            <h2>Test html5-qrcode</h2>

            <div style={{ marginBottom: '1rem' }}>
                <select value={resolution} onChange={(e) => setResolution(e.target.value)} disabled={isScanning}>
                    <option value="SD">SD (Default)</option>
                    <option value="HD">HD (720p)</option>
                    <option value="FHD">Full HD (1080p)</option>
                </select>

                {!isScanning ? (
                    <button onClick={startScanner}>Start Camera</button>
                ) : (
                    <button onClick={stopScanner} style={{ backgroundColor: '#dc2626' }}>Stop Camera</button>
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
