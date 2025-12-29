import React, { useEffect, useState, useRef } from 'react';

const ZBarPage = () => {
    const [logs, setLogs] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const scannerRef = useRef(null);
    const streamRef = useRef(null);

    // Settings optimisées pour étiquettes blanches Code 128
    const [resolution, setResolution] = useState('FHD');
    const [scanInterval, setScanInterval] = useState(100);
    const [focusMode, setFocusMode] = useState('continuous');

    const addLog = (msg) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
    };

    useEffect(() => {
        const getDevices = async () => {
            try {
                const allDevices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
                setDevices(videoDevices);

                const backCamera = videoDevices.find(d =>
                    d.label.toLowerCase().includes('back') ||
                    d.label.toLowerCase().includes('arrière') ||
                    d.label.toLowerCase().includes('environment') ||
                    d.label.toLowerCase().includes('rear')
                );
                if (backCamera) {
                    setSelectedDevice(backCamera.deviceId);
                    addLog(`Caméra arrière: ${backCamera.label}`);
                } else if (videoDevices.length > 0) {
                    setSelectedDevice(videoDevices[0].deviceId);
                }
            } catch (err) {
                addLog(`Erreur: ${err}`);
            }
        };
        getDevices();
    }, []);

    useEffect(() => {
        // Charger ZBar dynamiquement
        const loadZBar = async () => {
            try {
                const { scanImageData } = await import('@undecaf/zbar-wasm');
                scannerRef.current = scanImageData;
                addLog("ZBar chargé avec succès");
            } catch (err) {
                addLog(`Erreur chargement ZBar: ${err}`);
            }
        };
        loadZBar();
    }, []);

    const startScanner = async () => {
        if (isScanning || !selectedDevice || !scannerRef.current) return;
        setIsScanning(true);
        setLastResult(null);
        addLog("Démarrage ZBar...");

        try {
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

            if (focusMode !== 'default') {
                constraints.video.advanced = [{ focusMode: focusMode }];
            }

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            videoRef.current.srcObject = stream;
            await videoRef.current.play();

            addLog("ZBar démarré");
            scanFrame();
        } catch (err) {
            addLog(`Erreur démarrage: ${err}`);
            setIsScanning(false);
        }
    };

    const scanFrame = async () => {
        if (!isScanning || !videoRef.current || !canvasRef.current || !scannerRef.current) {
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            try {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const symbols = await scannerRef.current(
                    imageData,
                    {
                        scannerType: 'code128' // Spécifiquement Code 128
                    }
                );

                if (symbols && symbols.length > 0) {
                    const code = symbols[0].decode();
                    setLastResult(code);
                    addLog(`DETECTED: ${code}`);
                    if (navigator.vibrate) navigator.vibrate(200);
                }
            } catch (err) {
                // Ignorer les erreurs de scan (pas de code trouvé)
            }
        }

        setTimeout(() => scanFrame(), scanInterval);
    };

    const stopScanner = () => {
        setIsScanning(false);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        addLog("Scanner arrêté");
    };

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div className="card">
            <h2>Test ZBar</h2>

            <div className="scanner-box">
                <video ref={videoRef} style={{ width: '100%', height: 'auto', display: 'block' }}></video>
                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem', textAlign: 'left', maxWidth: '400px', margin: '1rem auto' }}>

                <div>
                    <label>Caméra: </label>
                    <select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)} disabled={isScanning}>
                        {devices.map(device => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Caméra ${device.deviceId.substring(0, 10)}`}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>Resolution: </label>
                    <select value={resolution} onChange={(e) => setResolution(e.target.value)} disabled={isScanning}>
                        <option value="SD">SD (Default)</option>
                        <option value="HD">HD (720p)</option>
                        <option value="FHD">Full HD (1080p)</option>
                    </select>
                </div>

                <div>
                    <label>Focus Mode: </label>
                    <select value={focusMode} onChange={(e) => setFocusMode(e.target.value)} disabled={isScanning}>
                        <option value="default">Default</option>
                        <option value="continuous">Continuous (Recommandé)</option>
                        <option value="single-shot">Single Shot</option>
                        <option value="manual">Manual</option>
                    </select>
                </div>

                <div>
                    <label>Intervalle scan: {scanInterval}ms</label>
                    <input
                        type="range" min="50" max="500" step="50" value={scanInterval}
                        onChange={(e) => setScanInterval(parseInt(e.target.value))}
                        disabled={isScanning}
                        style={{ width: '100%' }}
                    />
                    <small style={{ display: 'block', color: '#888' }}>Plus court = plus rapide mais plus de CPU</small>
                </div>

                {!isScanning ? (
                    <button onClick={startScanner} style={{ width: '100%', marginTop: '1rem' }} disabled={!selectedDevice || !scannerRef.current}>
                        Start ZBar
                    </button>
                ) : (
                    <button onClick={stopScanner} style={{ backgroundColor: '#dc2626', width: '100%', marginTop: '1rem' }}>
                        Stop ZBar
                    </button>
                )}
            </div>

            {lastResult && (
                <div style={{ background: '#22c55e', color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    <strong>FOUND:</strong> {lastResult}
                </div>
            )}

            <div className="log-container">
                {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
        </div>
    );
};

export default ZBarPage;
