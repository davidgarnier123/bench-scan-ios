import React, { useState, useCallback, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import Html5QrcodeScanner from '../components/scanners/Html5QrcodeScanner';
import ZXingScanner from '../components/scanners/ZXingScanner';
import QuaggaScanner from '../components/scanners/QuaggaScanner';
if (settings.vibrate && navigator.vibrate) navigator.vibrate(200);
    }, [showModal, settings.vibrate]);

const closeModal = () => {
    setShowModal(false);
    setLastScanned(null);
};

return (
    <div className="page-container">
        {/* Header / Controls */}
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            zIndex: 50,
            pointerEvents: 'none' // Allow clicks to pass through to camera if needed, but buttons need pointer-events: auto
        }}>
            <div style={{ pointerEvents: 'auto', background: 'rgba(0,0,0,0.5)', padding: '0.5rem 1rem', borderRadius: '20px', color: 'white', backdropFilter: 'blur(4px)' }}>
                {settings.engine}
            </div>
            <Link to="/settings" style={{ pointerEvents: 'auto', background: 'rgba(0,0,0,0.5)', padding: '0.75rem', borderRadius: '50%', color: 'white', display: 'flex', backdropFilter: 'blur(4px)' }}>
                <Settings size={24} />
            </Link>
        </div>

        {/* Camera Viewport */}
        <div className="scanner-viewport">
            {!cameraActive ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <Camera size={64} color="#3b82f6" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ marginBottom: '1rem' }}>Scanner Prêt</h2>
                    <button className="btn btn-primary" onClick={startCamera}>
                        Lancer la Caméra
                        transform: 'translate(-50%, -50%)',
                        width: '80%',
                        height: '150px',
                        border: '2px solid rgba(255,255,255,0.5)',
                        borderRadius: '1rem',
                        pointerEvents: 'none'
                    }}>
                        <div style={{ width: '100%', height: '2px', background: 'red', position: 'absolute', top: '50%', opacity: 0.5 }}></div>
                        import React, {useState, useCallback, useEffect} from 'react';
                        import {useSettings} from '../context/SettingsContext';
                        import Html5QrcodeScanner from '../components/scanners/Html5QrcodeScanner';
                        import ZXingScanner from '../components/scanners/ZXingScanner';
                        import QuaggaScanner from '../components/scanners/QuaggaScanner';
                        import {Settings, CheckCircle, Camera} from 'lucide-react';
                        import {Link} from 'react-router-dom';

const ScannerPage = () => {
    const {settings} = useSettings();
                        const [lastScanned, setLastScanned] = useState(null);
                        const [showModal, setShowModal] = useState(false);
                        const [cameraActive, setCameraActive] = useState(false);

    const startCamera = () => {
                            setCameraActive(true);
    };

    const handleScan = useCallback((code) => {
        if (showModal) return;
                        setLastScanned(code);
                        setShowModal(true);
                        if (settings.vibrate && navigator.vibrate) navigator.vibrate(200);
    }, [showModal, settings.vibrate]);

    const closeModal = () => {
                            setShowModal(false);
                        setLastScanned(null);
    };

                        return (
                        <div className="page-container">
                            {/* Header / Controls */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                padding: '1rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                zIndex: 50,
                                pointerEvents: 'none' // Allow clicks to pass through to camera if needed, but buttons need pointer-events: auto
                            }}>
                                <div style={{ pointerEvents: 'auto', background: 'rgba(0,0,0,0.5)', padding: '0.5rem 1rem', borderRadius: '20px', color: 'white', backdropFilter: 'blur(4px)' }}>
                                    {settings.engine}
                                </div>
                                <Link to="/settings" style={{ pointerEvents: 'auto', background: 'rgba(0,0,0,0.5)', padding: '0.75rem', borderRadius: '50%', color: 'white', display: 'flex', backdropFilter: 'blur(4px)' }}>
                                    <Settings size={24} />
                                </Link>
                            </div>

                            {/* Camera Viewport */}
                            <div className="scanner-viewport">
                                {!cameraActive ? (
                                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                                        <Camera size={64} color="#3b82f6" style={{ marginBottom: '1rem' }} />
                                        <h2 style={{ marginBottom: '1rem' }}>Scanner Prêt</h2>
                                        <button className="btn btn-primary" onClick={startCamera}>
                                            Lancer la Caméra
                                        </button>
                                        <p style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                                            Appuyez pour autoriser l'accès à la caméra.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {settings.engine === 'html5-qrcode' && <Html5QrcodeScanner onScan={handleScan} />}
                                        {settings.engine === 'zxing' && <ZXingScanner onScan={handleScan} />}
                                        {settings.engine === 'quagga' && <QuaggaScanner onScan={handleScan} />}

                                        {/* Visual Guide Overlay */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            width: '80%',
                                            height: '150px',
                                            border: '2px solid rgba(255,255,255,0.5)',
                                            borderRadius: '1rem',
                                            pointerEvents: 'none'
                                        }}>
                                            <div style={{ width: '100%', height: '2px', background: 'red', position: 'absolute', top: '50%', opacity: 0.5 }}></div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Result Modal */}
                            {showModal && (
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'rgba(0,0,0,0.85)',
                                    zIndex: 100,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '2rem'
                                }}>
                                    <div className="card" style={{ width: '100%', textAlign: 'center' }}>
                                        <CheckCircle size={48} color="#22c55e" style={{ margin: '0 auto 1rem' }} />
                                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Code Détecté</h3>
                                        <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', margin: '1rem 0', fontFamily: 'monospace', fontSize: '1.25rem' }}>
                                            {lastScanned}
                                        </div>
                                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={closeModal}>
                                            Scanner le suivant
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* On-screen Error Log for Mobile Debugging */}
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                maxHeight: '150px',
                                overflowY: 'auto',
                                background: 'rgba(0,0,0,0.8)',
                                color: 'red',
                                fontSize: '10px',
                                padding: '5px',
                                zIndex: 200,
                                pointerEvents: 'none'
                            }}>
                                {/* This will be populated by a custom hook or global error handler if we implement one,
                    but for now let's just show the last error passed to the component if we lift state up,
                    or better, let's rely on the user telling us what they see if we add explicit error display in the viewport.
                */}
                            </div>
                        </div>
                        );
};

                        export default ScannerPage;
