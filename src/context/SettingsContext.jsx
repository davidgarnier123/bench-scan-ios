import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('scanner-settings');
    return saved ? JSON.parse(saved) : {
      engine: 'html5-qrcode', // 'html5-qrcode' | 'zxing' | 'quagga'
      resolution: 'FHD', // 'HD' | 'FHD' | '4K'
      debug: false,
      vibrate: true
    };
  });

  useEffect(() => {
    localStorage.setItem('scanner-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
};
