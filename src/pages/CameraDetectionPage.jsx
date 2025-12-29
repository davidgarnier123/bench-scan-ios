import React, { useState, useEffect, useRef } from 'react';

const CameraDetectionPage = () => {
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState(null);
    const [cameraCapabilities, setCameraCapabilities] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    // Détecter toutes les caméras disponibles
    const detectCameras = async () => {
        try {
            setError(null);

            // Demander la permission d'accès aux caméras
            await navigator.mediaDevices.getUserMedia({ video: true });

            // Énumérer tous les périphériques
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            console.log('Cameras detected:', videoDevices);
            setCameras(videoDevices);

            // Arrêter le stream de permission initial
            const tracks = await navigator.mediaDevices.getUserMedia({ video: true });
            tracks.getTracks().forEach(track => track.stop());

        } catch (err) {
            console.error('Error detecting cameras:', err);
            setError(`Erreur de détection: ${err.message}`);
        }
    };

    // Obtenir les capacités détaillées d'une caméra
    const getCameraCapabilities = async (deviceId) => {
        try {
            setError(null);

            // Arrêter le stream précédent s'il existe
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            // Démarrer un stream avec cette caméra
            const constraints = {
                video: {
                    deviceId: { exact: deviceId }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            // Obtenir le track vidéo
            const videoTrack = stream.getVideoTracks()[0];

            // Afficher la vidéo
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            // Obtenir les capacités
            const capabilities = videoTrack.getCapabilities();
            const settings = videoTrack.getSettings();

            console.log('Capabilities:', capabilities);
            console.log('Settings:', settings);

            setCameraCapabilities({
                capabilities,
                settings,
                label: videoTrack.label
            });

            setIsScanning(true);

        } catch (err) {
            console.error('Error getting camera capabilities:', err);
            setError(`Erreur d'accès à la caméra: ${err.message}`);
        }
    };

    // Sélectionner une caméra
    const handleCameraSelect = (camera) => {
        setSelectedCamera(camera);
        getCameraCapabilities(camera.deviceId);
    };

    // Arrêter la caméra
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsScanning(false);
        setCameraCapabilities(null);
    };

    // Détecter les caméras au chargement
    useEffect(() => {
        detectCameras();

        // Cleanup
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Formater les valeurs de capacité
    const formatCapability = (key, value) => {
        if (value === null || value === undefined) return 'N/A';

        if (typeof value === 'object' && value !== null) {
            if (value.min !== undefined && value.max !== undefined) {
                return `${value.min} - ${value.max}`;
            }
            return JSON.stringify(value);
        }

        if (Array.isArray(value)) {
            return value.join(', ');
        }

        return String(value);
    };

    return (
        <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🔍 Détection des Caméras</h1>

            <p style={{ marginBottom: '1rem', color: '#666' }}>
                Cette page détecte toutes les caméras disponibles et affiche leurs capacités détaillées.
            </p>

            {error && (
                <div style={{
                    padding: '1rem',
                    backgroundColor: '#fee',
                    color: '#c00',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                }}>
                    ⚠️ {error}
                </div>
            )}

            <button
                onClick={detectCameras}
                style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    marginBottom: '1.5rem'
                }}
            >
                🔄 Recharger les caméras
            </button>

            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
                    Caméras détectées ({cameras.length})
                </h2>

                {cameras.length === 0 ? (
                    <p style={{ color: '#666' }}>Aucune caméra détectée. Cliquez sur "Recharger les caméras".</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {cameras.map((camera, index) => (
                            <div
                                key={camera.deviceId}
                                onClick={() => handleCameraSelect(camera)}
                                style={{
                                    padding: '1rem',
                                    border: selectedCamera?.deviceId === camera.deviceId ? '2px solid #4CAF50' : '1px solid #ddd',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: selectedCamera?.deviceId === camera.deviceId ? '#e8f5e9' : 'white',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                                    📷 Caméra {index + 1}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                    {camera.label || 'Sans nom'}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.25rem' }}>
                                    ID: {camera.deviceId.substring(0, 20)}...
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedCamera && (
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.2rem' }}>Prévisualisation</h2>
                        {isScanning && (
                            <button
                                onClick={stopCamera}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                ⏹️ Arrêter
                            </button>
                        )}
                    </div>

                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                            width: '100%',
                            maxHeight: '400px',
                            backgroundColor: '#000',
                            borderRadius: '8px',
                            marginBottom: '1rem'
                        }}
                    />
                </div>
            )}

            {cameraCapabilities && (
                <div>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
                        📊 Capacités de la caméra
                    </h2>

                    <div style={{
                        backgroundColor: '#f5f5f5',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1rem'
                    }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            {cameraCapabilities.label}
                        </div>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Paramètres actuels:</h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                        gap: '0.5rem',
                        marginBottom: '1.5rem'
                    }}>
                        {Object.entries(cameraCapabilities.settings).map(([key, value]) => (
                            <div
                                key={key}
                                style={{
                                    padding: '0.75rem',
                                    backgroundColor: 'white',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px'
                                }}
                            >
                                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>
                                    {key}
                                </div>
                                <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                                    {formatCapability(key, value)}
                                </div>
                            </div>
                        ))}
                    </div>

                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Capacités disponibles:</h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                        gap: '0.5rem'
                    }}>
                        {Object.entries(cameraCapabilities.capabilities).map(([key, value]) => (
                            <div
                                key={key}
                                style={{
                                    padding: '0.75rem',
                                    backgroundColor: 'white',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px'
                                }}
                            >
                                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>
                                    {key}
                                </div>
                                <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                                    {formatCapability(key, value)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Informations importantes pour le scan de codes-barres */}
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        backgroundColor: '#e3f2fd',
                        borderRadius: '8px',
                        border: '1px solid #2196F3'
                    }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#1976D2' }}>
                            💡 Informations pour la détection de codes-barres:
                        </h3>
                        <ul style={{ margin: '0', paddingLeft: '1.5rem', color: '#333' }}>
                            <li>Pour les codes-barres, privilégiez une caméra avec une haute résolution (width × height)</li>
                            <li>Le focusMode "continuous" ou "macro" est idéal pour les codes-barres</li>
                            <li>Un zoom optique élevé permet de mieux capturer les petits codes</li>
                            <li>Les caméras arrière ont généralement de meilleures capacités que les caméras frontales</li>
                            <li>Le facingMode "environment" correspond à la caméra arrière</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CameraDetectionPage;
