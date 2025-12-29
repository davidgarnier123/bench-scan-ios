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
        let intervalId;

        const startDetection = async () => {
            if (!isScanning || !videoRef.current || !canvasRef.current) return;

            try {
                // Initialize BarcodeDetector
                // Using specific formats or all supported
                const formats = await BarcodeDetector.getSupportedFormats();
                log(`Supported formats: ${formats.join(', ')}`);

                const detector = new BarcodeDetector({
                    formats: ['code_128', 'qr_code', 'ean_13', 'code_39'] // Prioritize Code 128
                });

                const detectLoop = async () => {
                    if (!isScanning) return;

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
                                    ctx.strokeStyle = 'red';
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

                    if (isScanning) {
                        requestAnimationFrame(detectLoop);
                    }
                };

                detectLoop();

            } catch (e) {
                setError(`Detector init error: ${e.message}`);
                log(`Detector init error: ${e.message}`);
            }
        };

        if (isScanning) {
            startDetection();
        }

        return () => {
            // cleanup if needed
        };

    }, [isScanning, lastResult]);

    const startScanner = async () => {
        try {
            setError('');
            setIsScanning(true);

            const constraints = {
                video: {
                    deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
                    facingMode: selectedDevice ? undefined : 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };

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
                            fontSize: '1rem'
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
                            fontSize: '1rem'
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
