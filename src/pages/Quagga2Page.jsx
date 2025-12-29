import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Quagga2Scanner from '../components/Quagga2Scanner';
import ScannerNotification from '../components/ScannerNotification';

const Quagga2Page = () => {
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState('');

    const handleDetected = (result) => {
        setScanResult(result);
        // Notification is handled by the component watching 'result'
    };

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Quagga2 Scanner</h2>

            <Quagga2Scanner onDetected={handleDetected} scanning={scanning} />

            <ScannerNotification result={scanResult} />

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                <button
                    onClick={() => setScanning(!scanning)}
                    style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        backgroundColor: scanning ? '#ff4444' : '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50px',
                        width: '100%',
                        maxWidth: '300px',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                >
                    {scanning ? '⏹ Stop Scanning' : '▶ Start Scanning'}
                </button>

                {scanResult && (
                    <div style={{
                        padding: '15px',
                        border: '2px solid #4CAF50',
                        borderRadius: '8px',
                        maxWidth: '400px',
                        width: '100%',
                        backgroundColor: '#f0fff4',
                        color: '#000000',
                        textAlign: 'center'
                    }}>
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: '#2e7d32' }}>Last Detected:</h3>
                        <p style={{ fontSize: '1.5rem', fontFamily: 'monospace', margin: 0, fontWeight: 'bold' }}>
                            {scanResult}
                        </p>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '30px' }}>
                <Link to="/" style={{ color: '#646cff' }}>Back to Home</Link>
            </div>
        </div>
    );
};

export default Quagga2Page;
