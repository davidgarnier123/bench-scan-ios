import React, { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';
import { useSettings } from '../../context/SettingsContext';

const ZXingScanner = ({ onScan, onError }) => {
    const { settings } = useSettings();
    const videoRef = useRef(null);
    const codeReader = useRef(new BrowserMultiFormatReader());

    useEffect(() => {
        const reader = codeReader.current;

        // Configure hints for Code 128
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]);
        reader.setHints(hints);

        const startScanner = async () => {
            if (!videoRef.current) return;

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

            try {
                await reader.decodeFromConstraints(
                    { video: videoConstraints },
                    videoRef.current,
                    (result, err) => {
                        if (result) {
                            if (onScan) onScan(result.getText(), 'zxing');
                        }
                        // ZXing throws errors continuously when not detecting, so we ignore them mostly
                        // unless it's a critical error, but distinguishing is hard.
                    }
                );
            } catch (err) {
                console.error("Error starting ZXing", err);
                if (onError) onError(err);
            }
        };

        startScanner();

        return () => {
            reader.reset();
        };
    }, [settings.resolution, onScan, onError]);

    return (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
            <video
                ref={videoRef}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
        </div>
    );
};

export default ZXingScanner;
