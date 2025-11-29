import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import QuaggaPage from './pages/QuaggaPage';
import Html5QrcodePage from './pages/Html5QrcodePage';
import ZXingPage from './pages/ZXingPage';

function App() {
  return (
    <Router>
      <div style={{ padding: '1rem' }}>
        <nav style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #333' }}>
          <Link to="/" style={{ marginRight: '1rem', color: '#646cff', textDecoration: 'none' }}>Home</Link>
          <Link to="/html5-qrcode" style={{ marginRight: '1rem', color: '#646cff', textDecoration: 'none' }}>html5-qrcode</Link>
          <Link to="/quagga" style={{ marginRight: '1rem', color: '#646cff', textDecoration: 'none' }}>Quagga</Link>
          <Link to="/zxing" style={{ marginRight: '1rem', color: '#646cff', textDecoration: 'none' }}>ZXing</Link>
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
                <Link to="/quagga">
                  <button style={{ width: '100%' }}>Test Quagga</button>
                </Link>
                <Link to="/zxing">
                  <button style={{ width: '100%' }}>Test ZXing</button>
                </Link>
              </div>
            </div>
          } />
          <Route path="/html5-qrcode" element={<Html5QrcodePage />} />
          <Route path="/quagga" element={<QuaggaPage />} />
          <Route path="/zxing" element={<ZXingPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
