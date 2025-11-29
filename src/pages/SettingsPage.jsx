import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { ChevronLeft, Settings, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const SettingsPage = () => {
    const { settings, updateSetting } = useSettings();

    if (!settings) return <div className="page-container" style={{ justifyContent: 'center', alignItems: 'center' }}>Chargement...</div>;

    return (
        <div className="page-container">
            <div className="settings-container">
                <header style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                    <Link to="/" className="btn" style={{ marginRight: '1rem', padding: '0.5rem' }}>
                        <ChevronLeft size={24} />
                    </Link>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Paramètres</h1>
                </header>

                <div className="card">
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Settings size={20} className="text-accent" />
                        Scanner
                    </h2>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Moteur de Scan</label>
                        <select
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', color: 'white', border: '1px solid #334155' }}
                            value={settings.engine}
                            onChange={(e) => updateSetting('engine', e.target.value)}
                        >
                            <option value="html5-qrcode">html5-qrcode</option>
                            <option value="zxing">ZXing</option>
                            <option value="quagga">Quagga2</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Résolution</label>
                        <select
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', color: 'white', border: '1px solid #334155' }}
                            value={settings.resolution}
                            onChange={(e) => updateSetting('resolution', e.target.value)}
                        >
                            <option value="HD">HD (720p)</option>
                            <option value="FHD">Full HD (1080p)</option>
                            <option value="4K">4K (2160p)</option>
                        </select>
                    </div>
                </div>

                <div className="card">
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Info size={20} className="text-accent" />
                        Options
                    </h2>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label>Mode Debug</label>
                        <input
                            type="checkbox"
                            checked={settings.debug}
                            onChange={(e) => updateSetting('debug', e.target.checked)}
                            style={{ width: '1.5rem', height: '1.5rem' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
