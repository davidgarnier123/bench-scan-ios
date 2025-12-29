import React, { useEffect, useRef, useState } from 'react';
import Quagga from '@ericblade/quagga2';

const Quagga2Scanner = ({ onDetected, scanning }) => {
    const scannerRef = useRef(null);
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        // Enumerate cameras
        const getCameras = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                setCameras(videoDevices);

                // Default to back camera if available, or just the first one
                const backCamera = videoDevices.find(device => device.label.toLowerCase().includes('back'));
                if (backCamera) {
                    setSelectedCamera(backCamera.deviceId);
                } else if (videoDevices.length > 0) {
                    setSelectedCamera(videoDevices[0].deviceId);
                }
            } catch (err) {
                console.error("Error enumerating devices:", err);
                setError("Could not list cameras.");
            }
        };
        getCameras();
    }, []);

    useEffect(() => {
        // Cleanup function to stop scanner when component unmounts or dependencies change
        const cleanup = () => {
            try {
                Quagga.stop();
            } catch (e) {
                console.warn("Error stopping Quagga:", e);
            }
        };

        if (!scanning || !selectedCamera) {
            cleanup();
            return;
        }

        let mounted = true;

        // Small delay to ensure previous instance is fully stopped if we are switching
        const initTimeout = setTimeout(() => {
            Quagga.init({
                inputStream: {
                    type: "LiveStream",
                    constraints: {
                        width: { min: 640 },
                        height: { min: 480 },
                        facingMode: "environment",
                        deviceId: { exact: selectedCamera },
                        aspectRatio: { min: 1, max: 2 }
                    },
                    target: scannerRef.current,
                },
                locator: {
                    patchSize: "medium",
                    halfSample: true,
                },
                numOfWorkers: 2,
                decoder: {
                    readers: ["code_128_reader"],
                },
                locate: true,
            }, (err) => {
                if (err) {
                    console.error("Quagga init error:", err);
                    if (mounted) setError(`Error initializing scanner: ${err.message || err}`);
                    return;
                }
                if (mounted) {
                    Quagga.start();
                    console.log("Quagga initialization finished. Ready to start");
                }
            });
        }, 100);

        const handleDetected = (result) => {
            if (onDetected) {
                onDetected(result.codeResult.code);
            }
        };

        const handleProcessed = (result) => {
            const drawingCtx = Quagga.canvas.ctx.overlay;
            const drawingCanvas = Quagga.canvas.dom.overlay;

            if (result) {
                if (result.boxes) {
                    drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
                    result.boxes.filter(function (box) {
                        return box !== result.box;
                    }).forEach(function (box) {
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
        };

        Quagga.onDetected(handleDetected);
        Quagga.onProcessed(handleProcessed);

        return () => {
            mounted = false;
            clearTimeout(initTimeout);
            Quagga.offDetected(handleDetected);
            Quagga.offProcessed(handleProcessed);
            cleanup();
        };
    }, [scanning, selectedCamera, onDetected]);

    return (
        <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto' }}>
            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

            <div
                ref={scannerRef}
                id="interactive"
                className="viewport"
                style={{
                    position: 'relative',
                    width: '100%',
                    height: 'auto',
                    overflow: 'hidden',
                    backgroundColor: '#000',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                }}
            >
                {/* Quagga injects video and canvas here */}
                <style>{`
              #interactive.viewport > canvas, #interactive.viewport > video {
                  max-width: 100%;
                  width: 100%;
              }
              canvas.drawing, canvas.drawingBuffer {
                  position: absolute;
                  left: 0;
                  top: 0;
              }
          `}</style>
            </div>

            <div style={{ marginBottom: '10px' }}>
                <label htmlFor="camera-select" style={{ marginRight: '10px' }}>Select Camera:</label>
                <select
                    id="camera-select"
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                >
                    {cameras.map((camera) => (
                        <option key={camera.deviceId} value={camera.deviceId}>
                            {camera.label || `Camera ${camera.deviceId.substring(0, 5)}...`}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default Quagga2Scanner;
