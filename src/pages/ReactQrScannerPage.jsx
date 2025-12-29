import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Scanner, useDevices } from '@yudiel/react-qr-scanner';
import ScannerNotification from '../components/ScannerNotification';

const ReactQrScannerPage = () => {
    const devices = useDevices();
    const [selectedDevice, setSelectedDevice] = useState('');
    const [isPaused, setIsPaused] = useState(false);
    const [lastResult, setLastResult] = useState('');
    const [error, setError] = useState('');
    const [logs, setLogs] = useState([]);

    // Configuration Options
    const [selectedFormats, setSelectedFormats] = useState(['code_128', 'qr_code']);
    const [resolution, setResolution] = useState('FHD');
    const [focusMode, setFocusMode] = useState('continuous');
    const [scanDelay, setScanDelay] = useState(500);
    const [enableAudio, setEnableAudio] = useState(true);
    const [enableTorch, setEnableTorch] = useState(true);
    const [enableZoom, setEnableZoom] = useState(true);
    const [enableFinder, setEnableFinder] = useState(true);

    const log = (msg) => {
        setLogs(prev => [`${new Date().toLocaleTimeString()}: ${msg}`, ...prev]);
        console.log(msg);
    };

    const handleScan = (detectedCodes) => {
        if (detectedCodes && detectedCodes.length > 0) {
            const code = detectedCodes[0].rawValue;
            if (lastResult !== code) {
                setLastResult(code);
                log(`Detected: ${code} (Format: ${detectedCodes[0].format})`);
                if (navigator.vibrate) navigator.vibrate(200);
            }
        }
    };

    const handleError = (error) => {
        setError(error?.message || 'Unknown error');
        log(`Error: ${error?.message || error}`);
    };

    // Build constraints based on settings
    const buildConstraints = () => {
        const constraints = {
            facingMode: selectedDevice ? undefined : 'environment',
        };

        if (selectedDevice) {
            constraints.deviceId = selectedDevice;
        }

        // Resolution
        if (resolution === 'HD') {
            constraints.width = { ideal: 1280 };
            constraints.height = { ideal: 720 };
        } else if (resolution === 'FHD') {
            constraints.width = { ideal: 1920 };
            constraints.height = { ideal: 1080 };
        }

        // Focus Mode
        if (focusMode !== 'default') {
            constraints.focusMode = focusMode;
        }

        return constraints;
    };

    const availableFormats = [
        { value: 'qr_code', label: 'QR Code' },
        { value: 'code_128', label: 'Code 128' },
        { value: 'code_39', label: 'Code 39' },
        { value: 'ean_13', label: 'EAN-13' },
        { value: 'ean_8', label: 'EAN-8' },
        { value: 'upc_a', label: 'UPC-A' },
        { value: 'upc_e', label: 'UPC-E' },
        { value: 'data_matrix', label: 'Data Matrix' },
        { value: 'pdf417', label: 'PDF417' },
        { value: 'aztec', label: 'Aztec' }
    ];

    const toggleFormat = (format) => {
        setSelectedFormats(prev => {
            if (prev.includes(format)) {
                return prev.filter(f => f !== format);
            } else {
                return [...prev, format];
            }
        });
    };

    // Select back camera by default when devices are loaded
    React.useEffect(() => {
        if (devices.length > 0 && !selectedDevice) {
            const backCamera = devices.find(device =>
                device.label.toLowerCase().includes('back') ||
                device.label.toLowerCase().includes('arrière')
            );
            if (backCamera) {
                setSelectedDevice(backCamera.deviceId);
            } else {
                setSelectedDevice(devices[0].deviceId);
            }
        }
    }, [devices, selectedDevice]);

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>React QR Scanner (Yudiel)</h2>

            <div className="scanner-box" style={{
                position: 'relative',
                backgroundColor: '#000',
                borderRadius: '8px',
                overflow: 'hidden',
                maxWidth: '640px',
                margin: '0 auto 1rem auto',
                minHeight: '400px'
            }}>
                {selectedDevice && (
                    <Scanner
                        onScan={handleScan}
                        onError={handleError}
                        constraints={buildConstraints()}
                        formats={selectedFormats}
                        paused={isPaused}
                        scanDelay={scanDelay}
                        components={{
                            audio: enableAudio,
                            torch: enableTorch,
                            zoom: enableZoom,
                            finder: enableFinder,
                            tracker: (detectedCodes, ctx) => {
                                // Custom tracking overlay
                                detectedCodes.forEach((detectedCode) => {
                                    const { boundingBox, cornerPoints } = detectedCode;

                                    // Draw bounding box
                                    ctx.strokeStyle = '#22c55e';
                                    ctx.lineWidth = 4;
                                    ctx.strokeRect(
                                        boundingBox.x,
                                        boundingBox.y,
                                        boundingBox.width,
                                        boundingBox.height
                                    );

                                    // Draw corner points
                                    ctx.fillStyle = '#22c55e';
                                    cornerPoints.forEach((point) => {
                                        ctx.beginPath();
                                        ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
                                        ctx.fill();
                                    });
                                });
                            }
                        }}
                        styles={{
                            container: {
                                width: '100%',
                                height: '100%',
                                minHeight: '400px'
                            }
                        }}
                    />
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem', textAlign: 'left', maxWidth: '600px', margin: '0 auto 1rem auto' }}>

                {/* Camera Selection */}
                <div>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Camera:</label>
                    <select
                        value={selectedDevice}
                        onChange={(e) => setSelectedDevice(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        <option value="">Select Camera</option>
                        {devices.map(device => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Camera ${device.deviceId.substring(0, 10)}`}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Format Selection */}
                <div>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Barcode Formats:</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                        {availableFormats.map(format => (
                            <label key={format.value} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedFormats.includes(format.value)}
                                    onChange={() => toggleFormat(format.value)}
                                />
                                <span>{format.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Resolution */}
                <div>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Resolution:</label>
                    <select
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        <option value="SD">SD (Default)</option>
                        <option value="HD">HD (720p)</option>
                        <option value="FHD">Full HD (1080p)</option>
                    </select>
                </div>

                {/* Focus Mode */}
                <div>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Focus Mode:</label>
                    <select
                        value={focusMode}
                        onChange={(e) => setFocusMode(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        <option value="default">Default</option>
                        <option value="continuous">Continuous</option>
                        <option value="single-shot">Single Shot</option>
                        <option value="manual">Manual</option>
                    </select>
                </div>

                {/* Scan Delay */}
                <div>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
                        Scan Delay: {scanDelay}ms
                    </label>
                    <input
                        type="range"
                        min="100"
                        max="2000"
                        step="100"
                        value={scanDelay}
                        onChange={(e) => setScanDelay(parseInt(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* UI Components */}
                <div>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>UI Components:</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={enableAudio}
                                onChange={(e) => setEnableAudio(e.target.checked)}
                            />
                            <span>Audio Beep</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={enableTorch}
                                onChange={(e) => setEnableTorch(e.target.checked)}
                            />
                            <span>Torch/Flash</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={enableZoom}
                                onChange={(e) => setEnableZoom(e.target.checked)}
                            />
                            <span>Zoom Control</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={enableFinder}
                                onChange={(e) => setEnableFinder(e.target.checked)}
                            />
                            <span>Finder Overlay</span>
                        </label>
                    </div>
                </div>

                {/* Pause/Resume Button */}
                <button
                    onClick={() => setIsPaused(!isPaused)}
                    style={{
                        padding: '12px',
                        background: isPaused ? '#22c55e' : '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        cursor: 'pointer'
                    }}
                >
                    {isPaused ? '▶ Resume Scanning' : '⏸ Pause Scanning'}
                </button>
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
                <strong>Logs:</strong>
                {logs.map((L, i) => <div key={i}>{L}</div>)}
            </div>

            <div style={{ marginTop: '30px' }}>
                <Link to="/" style={{ color: '#646cff' }}>Back to Home</Link>
            </div>
        </div>
    );
};

export default ReactQrScannerPage;
