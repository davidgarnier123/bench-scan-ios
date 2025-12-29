import React, { useEffect, useState, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import ScannerNotification from '../components/ScannerNotification';

const ZXingPage = () => {
    const [logs, setLogs] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('');
    const videoRef = useRef(null);
    const readerRef = useRef(null);
    const lastScanTimeRef = useRef(0);


    // Settings optimisées pour étiquettes blanches Code 128
    const [tryHarder, setTryHarder] = useState(true);
    const [resolution, setResolution] = useState('FHD'); // FHD par défaut pour étiquettes
    const [pureBarcodeDetect, setPureBarcodeDetect] = useState(false);
    const [inverted, setInverted] = useState(false);
    const [scanDelay, setScanDelay] = useState(300); // Délai réduit
    const [focusMode, setFocusMode] = useState('continuous');

    const addLog = (msg) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
    };

    useEffect(() => {
        // Get available cameras
        const getDevices = async () => {
            try {
                const allDevices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
                setDevices(videoDevices);

                // Sélectionner la caméra arrière par défaut
                const backCamera = videoDevices.find(d =>
                    d.label.toLowerCase().includes('back') ||
                    d.label.toLowerCase().includes('arrière') ||
                    d.label.toLowerCase().includes('environment') ||
                    d.label.toLowerCase().includes('rear')
                );
                if (backCamera) {
                    setSelectedDevice(backCamera.deviceId);
                } else if (videoDevices.length > 0) {
                    setSelectedDevice(videoDevices[0].deviceId);
                }
                addLog(`Found ${videoDevices.length} camera(s)`);
            } catch (err) {
                addLog(`Device enumeration error: ${err}`);
            }
        };
        getDevices();
    }, []);

    const startScanner = async () => {
        if (isScanning || !selectedDevice) return;
        setIsScanning(true);
        setLastResult(null);
        addLog("Initializing ZXing...");

        try {
            // Set up hints for Code 128
            const hints = new Map();
            hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]);
            if (tryHarder) {
                hints.set(DecodeHintType.TRY_HARDER, true);
            }
            if (pureBarcodeDetect) {
                hints.set(DecodeHintType.PURE_BARCODE, true);
            }
            if (inverted) {
                hints.set(DecodeHintType.ALSO_INVERTED, true);
            }

            const reader = new BrowserMultiFormatReader(hints);
            readerRef.current = reader;

            // Apply resolution constraints
            let constraints = {
                video: {
                    deviceId: selectedDevice,
                    facingMode: 'environment'
                }
            };

            if (resolution === 'HD') {
                constraints.video.width = { min: 720, ideal: 1280 };
                constraints.video.height = { min: 480, ideal: 720 };
            } else if (resolution === 'FHD') {
                constraints.video.width = { min: 1080, ideal: 1920 };
                constraints.video.height = { min: 720, ideal: 1080 };
            }

            // Add focus mode
            if (focusMode !== 'default') {
                constraints.video.advanced = [{ focusMode: focusMode }];
            }

            addLog(`Starting with device: ${selectedDevice.substring(0, 20)}...`);
            addLog(`Try Harder: ${tryHarder}, Resolution: ${resolution}`);

            await reader.decodeFromConstraints(
                constraints,
                videoRef.current,
                (result, error) => {
                    if (result) {
                        const now = Date.now();
                        if (now - lastScanTimeRef.current < scanDelay) {
                            return; // Ignore scans that are too frequent
                        }
                        lastScanTimeRef.current = now;

                        setLastResult(result.getText());
                        addLog(`DETECTED: ${result.getText()}`);
                        if (navigator.vibrate) navigator.vibrate(200);
                    }
                    // Ignore errors (they happen on every frame without a barcode)
                }
            );

            addLog("ZXing started successfully.");
        } catch (err) {
            addLog(`START ERROR: ${err}`);
            setIsScanning(false);
        }
    };

    const stopScanner = () => {
        try {
            if (readerRef.current) {
                readerRef.current.reset();
                addLog("Scanner stopped.");
            }
        } catch (err) {
            addLog(`Stop error: ${err}`);
        }
        setIsScanning(false);
    };

    useEffect(() => {
        return () => {
            if (readerRef.current) {
                readerRef.current.reset();
            }
        };
    }, []);

    return (
        <div className="card">
            <h2>Test ZXing</h2>

            <div className="scanner-box">
                <video ref={videoRef} style={{ width: '100%', height: 'auto', display: 'block' }}></video>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem', textAlign: 'left', maxWidth: '400px', margin: '1rem auto' }}>

                {/* Camera Selection */}
                <div>
                    <label>Camera: </label>
                    <select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)} disabled={isScanning}>
                        {devices.map(device => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Camera ${device.deviceId.substring(0, 10)}`}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Resolution */}
                <div>
                    <label>Resolution: </label>
                    <select value={resolution} onChange={(e) => setResolution(e.target.value)} disabled={isScanning}>
                        <option value="SD">SD (Default)</option>
                        <option value="HD">HD (720p)</option>
                        <option value="FHD">Full HD (1080p)</option>
                    </select>
                </div>

                {/* Try Harder */}
                <div>
                    <label>
                        <input
                            type="checkbox"
                            checked={tryHarder}
                            onChange={(e) => setTryHarder(e.target.checked)}
                            disabled={isScanning}
                        />
                        Try Harder (Plus lent mais plus précis)
                    </label>
                </div>

                {/* Pure Barcode */}
                <div>
                    <label>
                        <input
                            type="checkbox"
                            checked={pureBarcodeDetect}
                            onChange={(e) => setPureBarcodeDetect(e.target.checked)}
                            disabled={isScanning}
                        />
                        Pure Barcode (Sans texte autour)
                    </label>
                </div>

                {/* Inverted */}
                <div>
                    <label>
                        <input
                            type="checkbox"
                            checked={inverted}
                            onChange={(e) => setInverted(e.target.checked)}
                            disabled={isScanning}
                        />
                        Inverser les couleurs (Barcode blanc sur fond noir)
                    </label>
                </div>

                {/* Focus Mode */}
                <div>
                    <label>Focus Mode: </label>
                    <select value={focusMode} onChange={(e) => setFocusMode(e.target.value)} disabled={isScanning}>
                        <option value="default">Default</option>
                        <option value="continuous">Continuous (Recommandé)</option>
                        <option value="single-shot">Single Shot</option>
                        <option value="manual">Manual</option>
                    </select>
                </div>

                {/* Scan Delay */}
                <div>
                    <label>Délai entre scans: {scanDelay}ms</label>
                    <input
                        type="range" min="100" max="2000" step="100" value={scanDelay}
                        onChange={(e) => setScanDelay(parseInt(e.target.value))}
                        disabled={isScanning}
                        style={{ width: '100%' }}
                    />
                    <small style={{ display: 'block', color: '#888' }}>Évite les détections multiples du même code</small>
                </div>

                {!isScanning ? (
                    <button onClick={startScanner} style={{ width: '100%', marginTop: '1rem' }} disabled={!selectedDevice}>
                        Start ZXing
                    </button>
                ) : (
                    <button onClick={stopScanner} style={{ backgroundColor: '#dc2626', width: '100%', marginTop: '1rem' }}>
                        Stop ZXing
                    </button>
                )}
            </div>

            {lastResult && (
                <div style={{ background: '#22c55e', color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    <strong>FOUND:</strong> {lastResult}
                </div>
            )}

            <ScannerNotification result={lastResult} />

            <div className="log-container">
                {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
        </div>
    );
};

export default ZXingPage;
