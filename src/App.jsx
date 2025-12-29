import React from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import QuaggaPage from './pages/QuaggaPage';
import Html5QrcodePage from './pages/Html5QrcodePage';
import ZXingPage from './pages/ZXingPage';
import ZBarPage from './pages/ZBarPage';
import ScanditPage from './pages/ScanditPage';
import Html5QrcodeDemoPage from './pages/Html5QrcodeDemoPage';
import Quagga2Page from './pages/Quagga2Page';
import BarcodeDetectorPage from './pages/BarcodeDetectorPage';
import ReactQrScannerPage from './pages/ReactQrScannerPage';
import CameraDetectionPage from './pages/CameraDetectionPage';

const cardStyle = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '1.5rem',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'transform 0.2s',
  backgroundColor: 'white',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.5rem',
  color: '#333'
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigationChange = (event) => {
    navigate(event.target.value);
  };

  return (
    <div style={{ padding: '1rem', fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif' }}>
      <header style={{
        marginBottom: '1rem',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        {/* Home Button */}
        <Link to="/" style={{
          textDecoration: 'none',
          fontSize: '1.5rem',
          padding: '0.5rem',
          borderRadius: '50%',
          backgroundColor: '#f0f0f0',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px'
        }}>
          🏠
        </Link>

        {/* Navigation Dropdown */}
        <select
          value={location.pathname}
          onChange={handleNavigationChange}
          style={{
            flex: 1,
            padding: '0.5rem',
            fontSize: '1rem',
            borderRadius: '8px',
            border: '1px solid #ccc'
          }}
        >
          <option value="/">Select Scanner...</option>
          <option value="/camera-detection">🔍 Camera Detection</option>
          <option value="/quagga2">Quagga2 (New)</option>
          <option value="/barcode-detector">Polyfill (New)</option>
          <option value="/react-qr-scanner">React QR Scanner</option>
          <option value="/html5-qrcode">html5-qrcode</option>
          <option value="/quagga">Quagga (Old)</option>
          <option value="/zxing">ZXing</option>
          <option value="/zbar">ZBar</option>
          <option value="/scandit">Scandit</option>
          <option value="/html5-demo">Html5 Demo</option>
        </select>
      </header>

      <Routes>
        <Route path="/" element={
          <div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>Scanner Benchmark</h1>
            <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#666' }}>Select a scanner library to test:</p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '1rem',
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              <Link to="/camera-detection" style={{ textDecoration: 'none' }}>
                <div style={cardStyle}>
                  <span style={{ fontSize: '2rem' }}>🔍</span>
                  <h3>Camera Detection</h3>
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>Test Camera</p>
                </div>
              </Link>

              <Link to="/quagga2" style={{ textDecoration: 'none' }}>
                <div style={cardStyle}>
                  <span style={{ fontSize: '2rem' }}>📷</span>
                  <h3>Quagga2</h3>
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>New Implementation</p>
                </div>
              </Link>

              <Link to="/barcode-detector" style={{ textDecoration: 'none' }}>
                <div style={cardStyle}>
                  <span style={{ fontSize: '2rem' }}>🌐</span>
                  <h3>Polyfill</h3>
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>BarcodeDetector</p>
                </div>
              </Link>

              <Link to="/react-qr-scanner" style={{ textDecoration: 'none' }}>
                <div style={cardStyle}>
                  <span style={{ fontSize: '2rem' }}>⚛️</span>
                  <h3>React QR</h3>
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>Yudiel Scanner</p>
                </div>
              </Link>



              <Link to="/html5-qrcode" style={{ textDecoration: 'none' }}>
                <div style={cardStyle}>
                  <span style={{ fontSize: '2rem' }}>🔳</span>
                  <h3>html5-qrcode</h3>
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>Standard Lib</p>
                </div>
              </Link>

              <Link to="/quagga" style={{ textDecoration: 'none' }}>
                <div style={cardStyle}>
                  <span style={{ fontSize: '2rem' }}>🦓</span>
                  <h3>Quagga</h3>
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>Original</p>
                </div>
              </Link>

              <Link to="/zxing" style={{ textDecoration: 'none' }}>
                <div style={cardStyle}>
                  <span style={{ fontSize: '2rem' }}>🦓</span>
                  <h3>ZXing</h3>
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>Google Lib</p>
                </div>
              </Link>

              <Link to="/zbar" style={{ textDecoration: 'none' }}>
                <div style={cardStyle}>
                  <span style={{ fontSize: '2rem' }}>⚡</span>
                  <h3>ZBar</h3>
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>WASM Fast</p>
                </div>
              </Link>

              <Link to="/scandit" style={{ textDecoration: 'none' }}>
                <div style={cardStyle}>
                  <span style={{ fontSize: '2rem' }}>🏢</span>
                  <h3>Scandit</h3>
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>Enterprise</p>
                </div>
              </Link>

              <Link to="/html5-demo" style={{ textDecoration: 'none' }}>
                <div style={cardStyle}>
                  <span style={{ fontSize: '2rem' }}>🧪</span>
                  <h3>Html5 Demo</h3>
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>UI Test</p>
                </div>
              </Link>
            </div>
          </div>
        } />
        <Route path="/html5-qrcode" element={<Html5QrcodePage />} />
        <Route path="/html5-demo" element={<Html5QrcodeDemoPage />} />
        <Route path="/quagga" element={<QuaggaPage />} />
        <Route path="/zxing" element={<ZXingPage />} />
        <Route path="/zbar" element={<ZBarPage />} />
        <Route path="/scandit" element={<ScanditPage />} />
        <Route path="/quagga2" element={<Quagga2Page />} />
        <Route path="/barcode-detector" element={<BarcodeDetectorPage />} />
        <Route path="/react-qr-scanner" element={<ReactQrScannerPage />} />
        <Route path="/camera-detection" element={<CameraDetectionPage />} />
      </Routes>
    </div>
  );
}

export default App;
