import React, { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useSettings } from '../../context/SettingsContext';

const Html5QrcodeScanner = ({ onScan, onError }) => {
    const { settings } = useSettings();
    const scannerRef = useRef(null);
    const scannerId = "html5-qrcode-reader";

    useEffect(() => {
        // Cleanup function to stop scanner when component unmounts
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
            }
        };
    }, []);

    useEffect(() => {
        const startScanner = async () => {
            // Cleanup existing instance if any
            if (scannerRef.current) {
                try {
                    if (scannerRef.current.isScanning) {
                        await scannerRef.current.stop();
                    }
                } catch (err) {
                    console.warn("Stop failed", err);
                }
            }

            const html5QrCode = new Html5Qrcode(scannerId);
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
            };
        }, [settings.resolution, onScan, onError]);

    return (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
            <div id={scannerId} style={{ width: '100%', height: '100%' }}></div>
        </div>
    );
};

export default Html5QrcodeScanner;
