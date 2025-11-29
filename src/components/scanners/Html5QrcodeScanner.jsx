import React, { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useSettings } from '../../context/SettingsContext';

const Html5QrcodeScanner = ({ onScan, onError }) => {
    const { settings } = useSettings();
    const scannerRef = useRef(null);
    const scannerId = "html5-qrcode-reader";
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        let html5QrCode;

        const startScanner = async () => {
            // Ensure any previous instance is stopped and cleared
            if (scannerRef.current) {
                try {
                    if (scannerRef.current.isScanning) {
                        await scannerRef.current.stop();
                    }
                    scannerRef.current.clear();
                } catch (err) {
                    console.warn("Cleanup failed", err);
                }
                scannerRef.current = null;
            }

            // Create new instance
            html5QrCode = new Html5Qrcode(scannerId);
            scannerRef.current = html5QrCode;

            const videoConstraints = {
                facingMode: "environment"
            };

            if (settings.resolution === 'HD') {
                videoConstraints.width = { min: 720, ideal: 1280 };
                videoConstraints.height = { min: 480, ideal: 720 };
            } else if (settings.resolution === 'FHD') {
                videoConstraints.width = { min: 1080, ideal: 1920 };
                videoConstraints.height = { min: 720, ideal: 1080 };
            } else if (settings.resolution === '4K') {
                videoConstraints.width = { min: 2160, ideal: 3840 };
                videoConstraints.height = { min: 1080, ideal: 2160 };
            }

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 150 },
                aspectRatio: 1.0,
                formatsToSupport: [Html5QrcodeSupportedFormats.CODE_128],
            };

            const startWithConstraints = async (constraints) => {
                if (!isMounted.current) return;
                try {
                    await html5QrCode.start(
                        constraints,
                        config,
                        (decodedText, decodedResult) => {
                            if (isMounted.current && onScan) onScan(decodedText, 'html5-qrcode');
                        },
                        (errorMessage) => {
                            // ignore parse errors
                        }
                    );
                } catch (err) {
                    if (!isMounted.current) return;
                    console.warn("Start failed with constraints", constraints, err);

                    // Check for specific "already under transition" error
                    if (err?.message?.includes("already under transition")) {
                        console.log("Scanner busy, retrying in 500ms...");
                        setTimeout(() => startWithConstraints(constraints), 500);
                        return;
                    }

                    // Fallback logic
                    if (constraints.width || constraints.height) {
                        console.log("Retrying with default constraints...");
                        await startWithConstraints({ facingMode: "environment" });
                    } else {
                        console.error("Fatal error starting html5-qrcode", err);
                        if (onError) onError(err);
                    }
                }
            };

            // Small delay to ensure DOM is ready and previous cleanup is done
            setTimeout(() => {
                if (isMounted.current) {
                    startWithConstraints(videoConstraints);
                }
            }, 100);
        };

        startScanner();

        return () => {
            isMounted.current = false;
            if (scannerRef.current) {
                scannerRef.current.stop().catch(err => console.warn("Unmount stop failed", err));
                // We don't clear() here to avoid removing the DOM element if React re-uses it immediately,
                // but we stop the stream.
            }
        };
    }, [settings.resolution, onScan, onError]);

    return (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
            <div id={scannerId} style={{ width: '100%', height: '100%' }}></div>
        </div>
    );
};

export default Html5QrcodeScanner;
