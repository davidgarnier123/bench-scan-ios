import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Quagga2Scanner from '../components/Quagga2Scanner';

const Quagga2Page = () => {
    const [scanResult, setScanResult] = useState('');
    const [scanning, setScanning] = useState(false);

    const handleDetected = (result) => {
        setScanResult(result);
        // Optional: Stop scanning on detection found
        // setScanning(false); 
    };

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Quagga2 Scanner (Code 128)</h2>

            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={() => setScanning(!scanning)}
                    style={{
                        padding: '10px 20px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        backgroundColor: scanning ? '#ff4444' : '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px'
                    }}
                >
                    {scanning ? 'Stop Scanning' : 'Start Scanning'}
                </button>
            </div>

            {scanResult && (
                <div style={{
                    margin: '20px auto',
                    padding: '15px',
                    border: '2px solid #4CAF50',
                    borderRadius: '8px',
                    maxWidth: '400px',
                    backgroundColor: '#f0fff4'
                }}>
                    <h3>Detected Code:</h3>
                    <p style={{ fontSize: '24px', fontFamily: 'monospace', margin: '5px 0' }}>
                        {scanResult}
                    </p>
                </div>
            )}

            <Quagga2Scanner onDetected={handleDetected} scanning={scanning} />

            <div style={{ marginTop: '30px' }}>
                <Link to="/" style={{ color: '#646cff' }}>Back to Home</Link>
            </div>
        </div>
    );
};

export default Quagga2Page;
