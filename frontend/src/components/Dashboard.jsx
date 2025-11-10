import { useState } from 'react';
import LetterForm from './LetterForm';

function Dashboard({ userEmail, onLogout }) {
  const [selectedFormat, setSelectedFormat] = useState('');

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>NICL Letter Generator</h1>
          <div className="user-info">
            <span>{userEmail}</span>
            <button onClick={onLogout} className="btn-logout">Logout</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {!selectedFormat ? (
          <div className="format-selection">
            <h2>Select Letter Format</h2>
            <div className="format-cards">
              <div className="format-card" onClick={() => setSelectedFormat('format1')}>
                <h3>Format 1</h3>
                <p>Life Insurance with Options</p>
                <ul>
                  <li>Multiple benefits coverage</li>
                  <li>Two options for customer</li>
                  <li>Detailed premium breakdown</li>
                </ul>
                <button className="btn-primary">Select</button>
              </div>
              <div className="format-card" onClick={() => setSelectedFormat('format2')}>
                <h3>Format 2</h3>
                <p>Increase in Premium</p>
                <ul>
                  <li>Simplified format</li>
                  <li>Single acceptance option</li>
                  <li>Premium adjustment letter</li>
                </ul>
                <button className="btn-primary">Select</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="form-container">
            <button 
              className="btn-back" 
              onClick={() => setSelectedFormat('')}
            >
              ← Back to Format Selection
            </button>
            <LetterForm format={selectedFormat} />
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
