import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const Html5QrcodeDemoPage = () => {
    const [scanResult, setScanResult] = useState(null);
    const scannerRef = useRef(null);

    useEffect(() => {
        // Create instance of Html5QrcodeScanner
        // "reader" is the id of the HTML element
        const html5QrcodeScanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: 250 },
            /* verbose= */ false
        );

        scannerRef.current = html5QrcodeScanner;

        function onScanSuccess(decodedText, decodedResult) {
            // Handle on success condition with the decoded text or result.
            console.log(`Scan result: ${decodedText}`, decodedResult);
            setScanResult(decodedText);

            // Optional: Stop scanning after first success if desired
            // html5QrcodeScanner.clear();
        }

        function onScanError(errorMessage) {
            // handle on error condition, with error message
            // console.warn(`Scan error: ${errorMessage}`);
        }

        html5QrcodeScanner.render(onScanSuccess, onScanError);

        // Cleanup function
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear html5QrcodeScanner. ", error);
                });
            }
        };
    }, []);

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2>Html5QrcodeScanner Demo</h2>

            <div id="reader" width="600px"></div>

            {scanResult && (
                <div style={{
                    marginTop: '20px',
                    padding: '10px',
                    backgroundColor: '#e6fffa',
                    border: '1px solid #38b2ac',
                    borderRadius: '4px',
                    color: '#234e52'
                }}>
                    <strong>Scanned Result:</strong> {scanResult}
                </div>
            )}

            <div style={{ marginTop: '20px', fontSize: '0.9em', color: '#666' }}>
                <p>This implementation uses the <code>Html5QrcodeScanner</code> class which provides a default UI.</p>
            </div>
        </div>
    );
};

export default Html5QrcodeDemoPage;
