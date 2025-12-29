import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarcodeDetectorPolyfill as BarcodeDetector } from '@undecaf/barcode-detector-polyfill';
import ScannerNotification from '../components/ScannerNotification';

const BarcodeDetectorPage = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [lastResult, setLastResult] = useState('');
    const [error, setError] = useState('');
    const [logs, setLogs] = useState([]);

    // Options
    const [resolution, setResolution] = useState('FHD');
    const [focusMode, setFocusMode] = useState('continuous');
    const [scanInterval, setScanInterval] = useState(100);
    const [enableCache, setEnableCache] = useState(true);

    const log = (msg) => {
        setLogs(prev => [`${new Date().toLocaleTimeString()}: ${msg}`, ...prev]);
        console.log(msg);
    };

    useEffect(() => {
        // Enumerate cameras
        navigator.mediaDevices.enumerateDevices()
            .then(mediaDevices => {
                const videoDevices = mediaDevices.filter(({ kind }) => kind === "videoinput");
                setDevices(videoDevices);
                // Select back camera by default
                const backCamera = videoDevices.find(device => device.label.toLowerCase().includes('back'));
                if (backCamera) {
                    setSelectedDevice(backCamera.deviceId);
                } else if (videoDevices.length > 0) {
                    setSelectedDevice(videoDevices[0].deviceId);
                }
            })
            .catch(err => {
                setError("Camera error: " + err.message);
                log("Camera enumeration error: " + err);
            });
    }, []);

    useEffect(() => {
        let lastTime = 0;
        let animationFrameId;

        const startDetection = async () => {
            if (!isScanning || !videoRef.current || !canvasRef.current) return;

            try {
                log(`Initializing Detector (Cache: ${enableCache})...`);

                const detector = new BarcodeDetector({
                    formats: ['code_128'], // Hardcoded to Code 128
                    zbar: {
                        enableCache: enableCache
                    }
                });

                const detectLoop = async (timestamp) => {
                    if (!isScanning) return;

                    // Interval Check
                    if (timestamp - lastTime >= scanInterval) {
                        lastTime = timestamp;

                        try {
                            if (videoRef.current && videoRef.current.readyState === 4) {
                                const barcodes = await detector.detect(videoRef.current);

                                // Draw frame
                                const ctx = canvasRef.current.getContext('2d');
                                canvasRef.current.width = videoRef.current.videoWidth;
                                canvasRef.current.height = videoRef.current.videoHeight;
                                ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

                                if (barcodes.length > 0) {
                                    const code = barcodes[0].rawValue;
                                    if (lastResult !== code) {
                                        setLastResult(code);
                                        log(`Found: ${code}`);
                                        if (navigator.vibrate) navigator.vibrate(200);
                                    }

                                    // Draw bounding box
                                    barcodes.forEach(barcode => {
                                        ctx.strokeStyle = '#22c55e';
                                        ctx.lineWidth = 4;
                                        ctx.strokeRect(
                                            barcode.boundingBox.x,
                                            barcode.boundingBox.y,
                                            barcode.boundingBox.width,
                                            barcode.boundingBox.height
                                        );
                                    });
                                }
                            }
                        } catch (e) {
                            // log(`Detection error: ${e.message}`);
                        }
                    }

                    if (isScanning) {
                        animationFrameId = requestAnimationFrame(detectLoop);
                    }
                };

                animationFrameId = requestAnimationFrame(detectLoop);

            } catch (e) {
                setError(`Detector init error: ${e.message}`);
                log(`Detector init error: ${e.message}`);
            }
        };

        if (isScanning) {
            startDetection();
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };

    }, [isScanning, lastResult, enableCache, scanInterval]); // Re-run if cache/interval changes

    const startScanner = async () => {
        try {
            setError('');
            setIsScanning(true);

            let constraints = {
                video: {
                    deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
                    facingMode: selectedDevice ? undefined : 'environment'
                }
            };

            // Apply Resolution
            if (resolution === 'HD') {
                constraints.video.width = { min: 720, ideal: 1280 };
                constraints.video.height = { min: 480, ideal: 720 };
            } else if (resolution === 'FHD') {
                constraints.video.width = { min: 1080, ideal: 1920 };
                constraints.video.height = { min: 720, ideal: 1080 };
            }

            // Apply Focus Mode
            if (focusMode !== 'default') {
                constraints.video.advanced = [{ focusMode: focusMode }];
            }

            log(`Starting camera (${resolution}, ${focusMode})...`);

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            log("Camera started");
        } catch (err) {
            setError("Start error: " + err.message);
            setIsScanning(false);
            log("Start error: " + err);
        }
    };

    const stopScanner = () => {
        setIsScanning(false);
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        log("Scanner stopped");
    };

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Polyfill Scanner (BarcodeDetector)</h2>

            <div className="scanner-box" style={{
                position: 'relative',
                backgroundColor: '#000',
                borderRadius: '8px',
                overflow: 'hidden',
                maxWidth: '640px',
                margin: '0 auto 1rem auto'
            }}>
                <video
                    ref={videoRef}
                    style={{ width: '100%', height: 'auto', display: isScanning ? 'block' : 'none' }}
                    playsInline
                    muted
                ></video>
                <canvas
                    ref={canvasRef}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none'
                    }}
                ></canvas>
                {!isScanning && (
                    <div style={{ padding: '40px', color: '#666' }}>
                        Camera Stop
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem', textAlign: 'left', maxWidth: '400px', margin: '0 auto 1rem auto' }}>
                {/* Camera Selection */}
                <div>
                    <label>Camera: </label>
                    <select
                        value={selectedDevice}
                        onChange={(e) => setSelectedDevice(e.target.value)}
                        disabled={isScanning}
                        style={{ width: '100%', padding: '8px' }}
                    >
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
                    <select
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        disabled={isScanning}
                        style={{ width: '100%', padding: '8px' }}
                    >
                        <option value="SD">SD (Default)</option>
                        <option value="HD">HD (720p)</option>
                        <option value="FHD">Full HD (1080p)</option>
                    </select>
                </div>

                {/* Focus Mode */}
                <div>
                    <label>Focus Mode: </label>
                    <select
                        value={focusMode}
                        onChange={(e) => setFocusMode(e.target.value)}
                        disabled={isScanning}
                        style={{ width: '100%', padding: '8px' }}
                    >
                        <option value="default">Default</option>
                        <option value="continuous">Continuous</option>
                        <option value="single-shot">Single Shot</option>
                        <option value="manual">Manual</option>
                    </select>
                </div>

                {/* Scan Interval */}
                <div>
                    <label>Scan Interval: {scanInterval}ms</label>
                    <input
                        type="range" min="50" max="1000" step="50"
                        value={scanInterval}
                        onChange={(e) => setScanInterval(parseInt(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* Enable Cache */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                        type="checkbox"
                        id="enableCache"
                        checked={enableCache}
                        onChange={(e) => setEnableCache(e.target.checked)}
                        disabled={isScanning}
                    />
                    <label htmlFor="enableCache">Enable Cache (ZBar)</label>
                </div>


                {!isScanning ? (
                    <button
                        onClick={startScanner}
                        style={{
                            padding: '12px',
                            background: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            marginTop: '1rem'
                        }}
                    >
                        ▶ Start Polyfill
                    </button>
                ) : (
                    <button
                        onClick={stopScanner}
                        style={{
                            padding: '12px',
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            marginTop: '1rem'
                        }}
                    >
                        ⏹ Stop Polyfill
                    </button>
                )}
            </div>

            {lastResult && (
                <div style={{ background: '#22c55e', color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    <strong>FOUND:</strong> {lastResult}
                </div>
            )}

            <ScannerNotification result={lastResult} />

            {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}

            <div style={{
                marginTop: '1rem',
                padding: '10px',
                background: '#f5f5f5',
                borderRadius: '5px',
                textAlign: 'left',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                maxHeight: '200px',
                overflowY: 'auto'
            }}>
                {logs.map((L, i) => <div key={i}>{L}</div>)}
            </div>

            <div style={{ marginTop: '30px' }}>
                <Link to="/" style={{ color: '#646cff' }}>Back to Home</Link>
            </div>
        </div>
    );
};

export default BarcodeDetectorPage;
