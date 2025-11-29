import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { Settings, ChevronLeft, Save, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const SettingsPage = () => {
    const { settings, updateSetting } = useSettings();

    return (
        <div className="container">
            <header style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                <Link to="/" className="btn" style={{ marginRight: '1rem', padding: '0.5rem' }}>
                    <ChevronLeft size={24} />
                </Link>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Settings</h1>
            </header>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings size={20} className="text-accent" />
                    Scanner Configuration
                </h2>

                <div className="input-group">
                    <label className="input-label">Scanner Engine</label>
                    <select
                        className="input-field"
                        value={settings.engine}
                        onChange={(e) => updateSetting('engine', e.target.value)}
                    >
                        <option value="html5-qrcode">html5-qrcode (Wrapper)</option>
                        <option value="zxing">ZXing (@zxing/browser)</option>
                        <option value="quagga">Quagga2 (1D Optimized)</option>
                    </select>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Choose the underlying library used for barcode detection.
                    </p>
                </div>

                <div className="input-group">
                    <label className="input-label">Camera Resolution</label>
                    <select
                        className="input-field"
                        value={settings.resolution}
                        onChange={(e) => updateSetting('resolution', e.target.value)}
                    >
                        <option value="HD">HD (720p)</option>
                        <option value="FHD">Full HD (1080p)</option>
                        <option value="4K">4K (2160p)</option>
                    </select>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Info size={20} className="text-accent" />
                    Feedback & Debug
                </h2>

                <div className="input-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label className="input-label" style={{ marginBottom: 0 }}>Debug Overlay</label>
                    <input
                        type="checkbox"
                        checked={settings.debug}
                        onChange={(e) => updateSetting('debug', e.target.checked)}
                        style={{ width: '1.5rem', height: '1.5rem' }}
                    />
                </div>
            </div>

            <div style={{ marginTop: 'auto' }}>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Scanner Benchmark v0.1.1
                </p>
            </div>
        </div>
    );
};

export default SettingsPage;
