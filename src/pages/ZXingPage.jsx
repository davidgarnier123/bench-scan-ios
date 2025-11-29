import React, { useEffect, useState, useRef } from 'react';
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';

const ZXingPage = () => {
    const [logs, setLogs] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('');
    const videoRef = useRef(null);
    const readerRef = useRef(null);

    // Settings
    const [tryHarder, setTryHarder] = useState(true);
    const [resolution, setResolution] = useState('HD');

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
                // Select back camera by default
                const backCamera = videoDevices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
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

            addLog(`Starting with device: ${selectedDevice.substring(0, 20)}...`);
            addLog(`Try Harder: ${tryHarder}, Resolution: ${resolution}`);

            await reader.decodeFromConstraints(
                constraints,
                videoRef.current,
                (result, error) => {
                    if (result) {
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem', textAlign: 'left', maxWidth: '400px', margin: '0 auto 1rem auto' }}>

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

            <div className="scanner-box">
                <video ref={videoRef} style={{ width: '100%', height: 'auto', display: 'block' }}></video>
            </div>

            <div className="log-container">
                {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
        </div>
    );
};

export default ZXingPage;
