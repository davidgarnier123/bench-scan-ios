import React, { useEffect, useRef } from 'react';
import Quagga from '@ericblade/quagga2';
import { useSettings } from '../../context/SettingsContext';

const QuaggaScanner = ({ onScan, onError }) => {
    const { settings } = useSettings();
    const scannerRef = useRef(null);

    useEffect(() => {
        const startScanner = async () => {
            const videoConstraints = {
                facingMode: 'environment'
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

            Quagga.init({
                inputStream: {
                    name: "Live",
                    type: "LiveStream",
                    target: scannerRef.current,
                    constraints: videoConstraints,
                },
                decoder: {
                    readers: ["code_128_reader"],
                    multiple: false
                },
                locate: true,
            }, (err) => {
                if (err) {
                    console.error("Error starting Quagga", err);
                    if (onError) onError(err);
                    return;
                }
                Quagga.start();
            });

            Quagga.onDetected((data) => {
                if (data && data.codeResult && data.codeResult.code) {
                    if (onScan) onScan(data.codeResult.code, 'quagga');
                }
            });
        };

        startScanner();

        return () => {
            Quagga.stop();
            Quagga.offDetected();
        };
    }, [settings.resolution, onScan, onError]);

    return (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
            <div ref={scannerRef} style={{ width: '100%', height: '100%', '& > video': { width: '100%', height: '100%', objectFit: 'cover' } }}></div>
        </div>
    );
};

export default QuaggaScanner;
