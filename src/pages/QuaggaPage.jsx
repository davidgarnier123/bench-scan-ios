import React, { useEffect, useState, useRef } from 'react';
import Quagga from '@ericblade/quagga2';

const QuaggaPage = () => {
    const [logs, setLogs] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const scannerRef = useRef(null);

    // Settings
    const [resolution, setResolution] = useState('HD');
    const [patchSize, setPatchSize] = useState('medium');
    const [halfSample, setHalfSample] = useState(false); // Désactivé par défaut pour meilleure précision
    const [frequency, setFrequency] = useState(5); // Réduit pour laisser plus de temps au décodeur
    const [focusMode, setFocusMode] = useState('continuous');
    const [zoom, setZoom] = useState(1);
    const [capabilities, setCapabilities] = useState(null);

    const addLog = (msg) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
    };

    const applyZoom = (zoomValue) => {
        const track = Quagga.CameraAccess.getActiveTrack();
        if (track && typeof track.getCapabilities === 'function') {
            const caps = track.getCapabilities();
            if (caps.zoom) {
                track.applyConstraints({ advanced: [{ zoom: zoomValue }] })
                    .catch(err => console.warn("Zoom failed", err));
            }
        }
        setZoom(zoomValue);
    };

    const startScanner = async () => {
        if (isScanning) return;
        setIsScanning(true);
        setLastResult(null);
        addLog("Initializing Quagga...");

        let constraints = {
            facingMode: "environment",
            aspectRatio: { min: 1, max: 2 }
        };

        if (resolution === 'HD') {
            constraints.width = { min: 720, ideal: 1280 };
            constraints.height = { min: 480, ideal: 720 };
        } else if (resolution === 'FHD') {
            constraints.width = { min: 1080, ideal: 1920 };
            constraints.height = { min: 720, ideal: 1080 };
        }

        // Ajouter les contraintes de focus
        if (focusMode !== 'default') {
            constraints.advanced = [{ focusMode: focusMode }];
        }

        const config = {
            inputStream: {
                type: "LiveStream",
                constraints: constraints,
                target: scannerRef.current,
            },
            locator: {
                patchSize: patchSize,
                halfSample: halfSample,
            },
            numOfWorkers: navigator.hardwareConcurrency || 4,
            frequency: frequency,
            decoder: {
                readers: [{
                    format: "code_128_reader",
                    config: {}
                }],
                multiple: false
            },
            locate: true,
        };

        try {
            await Quagga.init(config, (err) => {
                if (err) {
                    addLog(`INIT ERROR: ${err}`);
                    setIsScanning(false);
                    return;
                }
                addLog("Quagga initialized. Starting...");
                Quagga.start();

                // Check for zoom capabilities
                const track = Quagga.CameraAccess.getActiveTrack();
                if (track && typeof track.getCapabilities === 'function') {
                    const caps = track.getCapabilities();
                    if (caps.zoom) {
                        setCapabilities(caps);
                        addLog(`Zoom supported: ${caps.zoom.min} - ${caps.zoom.max}`);
                    }
                }

                addLog("Quagga started.");
            });

            Quagga.onDetected((data) => {
                if (data && data.codeResult && data.codeResult.code) {
                    setLastResult(data.codeResult.code);
                    addLog(`DETECTED: ${data.codeResult.code}`);
                    if (navigator.vibrate) navigator.vibrate(200);
                }
            });

            Quagga.onProcessed((result) => {
                const drawingCtx = Quagga.canvas.ctx.overlay;
                const drawingCanvas = Quagga.canvas.dom.overlay;

                if (result) {
                    if (result.boxes) {
                        drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
                        result.boxes.filter((box) => box !== result.box).forEach((box) => {
                            Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { color: "green", lineWidth: 2 });
                        });
                    }

                    if (result.box) {
                        Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { color: "#00F", lineWidth: 2 });
                    }

                    if (result.codeResult && result.codeResult.code) {
                        Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: 'red', lineWidth: 3 });
                    }
                }
            });

        } catch (err) {
            addLog(`FATAL ERROR: ${err}`);
            setIsScanning(false);
        }
    };

    const stopScanner = () => {
        try {
            Quagga.stop();
            Quagga.offDetected();
            Quagga.offProcessed();
            addLog("Scanner stopped.");
        } catch (err) {
            addLog(`Stop error: ${err}`);
        }
        setIsScanning(false);
    };

    useEffect(() => {
        return () => {
            if (isScanning) {
                Quagga.stop();
                Quagga.offDetected();
                Quagga.offProcessed();
            }
        };
    }, [isScanning]);

    return (
        <div className="card">
            <h2>Test Quagga2</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem', textAlign: 'left', maxWidth: '400px', margin: '0 auto 1rem auto' }}>

                {/* Resolution */}
                <div>
                    <label>Resolution: </label>
                    <select value={resolution} onChange={(e) => setResolution(e.target.value)} disabled={isScanning}>
                        <option value="SD">SD (640x480)</option>
                        <option value="HD">HD (1280x720)</option>
                        <option value="FHD">Full HD (1920x1080)</option>
                    </select>
                </div>

                {/* Patch Size */}
                <div>
                    <label>Patch Size (Detection Grid): </label>
                    <select value={patchSize} onChange={(e) => setPatchSize(e.target.value)} disabled={isScanning}>
                        <option value="x-small">X-Small</option>
                        <option value="small">Small</option>
                        <option value="medium">Medium (Default)</option>
                        <option value="large">Large</option>
                        <option value="x-large">X-Large</option>
                    </select>
                    <small style={{ display: 'block', color: '#888' }}>Larger = better for big codes, worse for small ones.</small>
                </div>

                {/* Half Sample */}
                <div>
                    <label>
                        <input
                            type="checkbox"
                            checked={halfSample}
                            onChange={(e) => setHalfSample(e.target.checked)}
                            disabled={isScanning}
                        />
                        Half Sample (Faster, less accurate)
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
                    <small style={{ display: 'block', color: '#888' }}>Continuous = autofocus permanent</small>
                </div>

                {/* Frequency */}
                <div>
                    <label>Frequency: {frequency} scans/s</label>
                    <input
                        type="range" min="1" max="30" value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        disabled={isScanning}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* Zoom Slider */}
                {isScanning && capabilities && capabilities.zoom && (
                    <div>
                        <label>Zoom: {zoom}x</label>
                        <input
                            type="range"
                            min={capabilities.zoom.min}
                            max={capabilities.zoom.max}
                            step="0.1"
                            value={zoom}
                            onChange={(e) => applyZoom(parseFloat(e.target.value))}
                            style={{ width: '100%' }}
                        />
                    </div>
                )}

                {!isScanning ? (
                    <button onClick={startScanner} style={{ width: '100%', marginTop: '1rem' }}>Start Quagga</button>
                ) : (
                    <button onClick={stopScanner} style={{ backgroundColor: '#dc2626', width: '100%', marginTop: '1rem' }}>Stop Quagga</button>
                )}
            </div>

            {lastResult && (
                <div style={{ background: '#22c55e', color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    <strong>FOUND:</strong> {lastResult}
                </div>
            )}

            <div className="scanner-box" ref={scannerRef} style={{ position: 'relative', overflow: 'hidden' }}>
                {/* Quagga injects video and canvas here */}
            </div>

            <div className="log-container">
                {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
        </div>
    );
};

export default QuaggaPage;
