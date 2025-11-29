import React, { useState, useCallback, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import Html5QrcodeScanner from '../components/scanners/Html5QrcodeScanner';
import ZXingScanner from '../components/scanners/ZXingScanner';
import QuaggaScanner from '../components/scanners/QuaggaScanner';
import { Settings, Zap, CheckCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const ScannerPage = () => {
    const { settings } = useSettings();
    const [lastScanned, setLastScanned] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [fps, setFps] = useState(0);

    // Vibrate
    const triggerVibrate = useCallback(() => {
        if (settings.vibrate && navigator.vibrate) {
            navigator.vibrate(200);
        }
    }, [settings.vibrate]);

    const handleScan = useCallback((code, source) => {
        // If modal is already showing, ignore new scans to prevent spam
        if (showModal) return;

        setLastScanned(code);
        setShowModal(true);
        triggerVibrate();

        // Auto-hide after 3 seconds if user doesn't close
        // setTimeout(() => setShowModal(false), 3000); 
    }, [showModal, triggerVibrate]);

    const handleError = useCallback((err) => {
        console.warn("Scanner Error:", err);
    }, []);

    const closeModal = () => {
        setShowModal(false);
        setLastScanned(null);
    };

    // FPS Counter
    useEffect(() => {
        let frameCount = 0;
        let lastTime = performance.now();
        let animationFrameId;

        const loop = () => {
            const now = performance.now();
            frameCount++;
            if (now - lastTime >= 1000) {
                setFps(frameCount);
                frameCount = 0;
                lastTime = now;
            }
            animationFrameId = requestAnimationFrame(loop);
        };

        if (settings.debug) {
            loop();
        }

        return () => cancelAnimationFrame(animationFrameId);
    }, [settings.debug]);

    return (
        <div style={{ position: 'relative', height: '100vh', width: '100vw', backgroundColor: '#000' }}>
            {/* Scanner Layer */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
                {settings.engine === 'html5-qrcode' && (
                    <Html5QrcodeScanner onScan={handleScan} onError={handleError} />
                )}
                {settings.engine === 'zxing' && (
                    <ZXingScanner onScan={handleScan} onError={handleError} />
                )}
                {settings.engine === 'quagga' && (
                    <QuaggaScanner onScan={handleScan} onError={handleError} />
                )}
            </div>

            {/* Overlay Layer */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1rem' }}>

                {/* Top Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'auto' }}>
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: '0.5rem 1rem', borderRadius: '2rem', backdropFilter: 'blur(4px)' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.875rem', color: 'white' }}>
                            {settings.engine === 'html5-qrcode' ? 'HTML5-QR' : settings.engine === 'zxing' ? 'ZXing' : 'Quagga2'}
                        </span>
                    </div>

                    <Link to="/settings" className="btn" style={{ padding: '0.75rem', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', color: 'white' }}>
                        <Settings size={24} />
                    </Link>
                </div>

                {/* Center Target (Visual Guide) */}
                {!showModal && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', height: '150px', border: '2px solid rgba(255, 255, 255, 0.5)', borderRadius: '1rem', boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)' }}>
                        <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '20px', height: '20px', borderTop: '4px solid #3b82f6', borderLeft: '4px solid #3b82f6', borderTopLeftRadius: '1rem' }}></div>
                        <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '20px', height: '20px', borderTop: '4px solid #3b82f6', borderRight: '4px solid #3b82f6', borderTopRightRadius: '1rem' }}></div>
                        <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '20px', height: '20px', borderBottom: '4px solid #3b82f6', borderLeft: '4px solid #3b82f6', borderBottomLeftRadius: '1rem' }}></div>
                        <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderBottom: '4px solid #3b82f6', borderRight: '4px solid #3b82f6', borderBottomRightRadius: '1rem' }}></div>

                        {/* Scanning Line Animation */}
                        <div style={{ position: 'absolute', top: '50%', left: '0', width: '100%', height: '2px', backgroundColor: 'rgba(59, 130, 246, 0.8)', boxShadow: '0 0 4px #3b82f6', animation: 'scan 2s infinite linear' }}></div>
                    </div>
                )}

                {/* Debug Info */}
                <div style={{ marginTop: 'auto', pointerEvents: 'auto' }}>
                    {settings.debug && (
                        <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', padding: '0.75rem', borderRadius: '0.75rem', fontSize: '0.75rem', color: '#94a3b8', backdropFilter: 'blur(4px)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>FPS: <span style={{ color: 'white' }}>{fps}</span></span>
                                <span>Res: <span style={{ color: 'white' }}>{settings.resolution}</span></span>
                                <span>Format: <span style={{ color: 'white' }}>Code 128</span></span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Result Modal */}
            {showModal && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '1.5rem', width: '100%', maxWidth: '320px', textAlign: 'center', border: '1px solid #334155', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                        <div style={{ width: '4rem', height: '4rem', backgroundColor: 'rgba(34, 197, 94, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                            <CheckCircle size={40} className="text-success" color="#22c55e" />
                        </div>

                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>Code Found!</h3>
                        <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1.5rem' }}>Successfully scanned Code 128</p>

                        <div style={{ backgroundColor: '#0f172a', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '1px solid #334155' }}>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{lastScanned}</p>
                        </div>

                        <button onClick={closeModal} className="btn btn-primary" style={{ width: '100%' }}>
                            Scan Next
                        </button>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
        @keyframes popIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
        </div>
    );
};

export default ScannerPage;
