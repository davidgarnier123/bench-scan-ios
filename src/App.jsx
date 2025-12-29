import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import QuaggaPage from './pages/QuaggaPage';
import Html5QrcodePage from './pages/Html5QrcodePage';
import ZXingPage from './pages/ZXingPage';
import ZBarPage from './pages/ZBarPage';
import ScanditPage from './pages/ScanditPage';
import Html5QrcodeDemoPage from './pages/Html5QrcodeDemoPage';
import Quagga2Page from './pages/Quagga2Page';

function App() {
  return (
    <Router>
      <div style={{ padding: '1rem' }}>
        <nav style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #333' }}>
          <Link to="/" style={{ marginRight: '1rem', color: '#646cff', textDecoration: 'none' }}>Home</Link>
          <Link to="/html5-qrcode" style={{ marginRight: '1rem', color: '#646cff', textDecoration: 'none' }}>html5-qrcode</Link>
          <Link to="/html5-demo" style={{ marginRight: '1rem', color: '#646cff', textDecoration: 'none' }}>Html5 Demo</Link>
          <Link to="/quagga" style={{ marginRight: '1rem', color: '#646cff', textDecoration: 'none' }}>Quagga</Link>
          <Link to="/zxing" style={{ marginRight: '1rem', color: '#646cff', textDecoration: 'none' }}>ZXing</Link>
          <Link to="/zbar" style={{ marginRight: '1rem', color: '#646cff', textDecoration: 'none' }}>ZBar</Link>
          <Link to="/scandit" style={{ marginRight: '1rem', color: '#646cff', textDecoration: 'none' }}>Scandit</Link>
          <Link to="/quagga2" style={{ marginRight: '1rem', color: '#646cff', textDecoration: 'none' }}>Quagga2</Link>
        </nav>

        <Routes>
          <Route path="/" element={
            <div>
              <h1>Scanner Benchmark</h1>
              <p>Select a scanner library to test:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '0 auto' }}>
                <Link to="/html5-qrcode">
                  <button style={{ width: '100%' }}>Test html5-qrcode</button>
                </Link>
                <Link to="/html5-demo">
                  <button style={{ width: '100%' }}>Test Html5 Demo (Scanner UI)</button>
                </Link>
                <Link to="/quagga">
                  <button style={{ width: '100%' }}>Test Quagga</button>
                </Link>
                <Link to="/zxing">
                  <button style={{ width: '100%' }}>Test ZXing</button>
                </Link>
                <Link to="/zbar">
                  <button style={{ width: '100%' }}>Test ZBar</button>
                </Link>
                <Link to="/scandit">
                  <button style={{ width: '100%' }}>Test Scandit</button>
                </Link>
                <Link to="/quagga2">
                  <button style={{ width: '100%' }}>Test Quagga2</button>
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
        </Routes>
      </div>
    </Router>
  );
}

export default App;
