import React, { useEffect, useState } from 'react';

/**
 * ScannerNotification Component
 * Displays a snackbar notification when a new result is detected.
 * 
 * @param {string|null} result - The scanned code to display.
 * @param {number} duration - Duration in ms to show the notification (default: 2000).
 */
const ScannerNotification = ({ result, duration = 2000 }) => {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (result) {
            setMessage(result);
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [result, duration]);

    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '100px', // Above the navigation/bottom of screen
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#323232',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '24px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            minWidth: '200px',
            justifyContent: 'center',
            animation: 'fadeIn 0.3s ease-in-out'
        }}>
            <span style={{ fontSize: '1.2rem' }}>✅</span>
            <span style={{ fontWeight: '500', fontFamily: 'monospace', fontSize: '1rem' }}>
                {message}
            </span>
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
        </div>
    );
};

export default ScannerNotification;
