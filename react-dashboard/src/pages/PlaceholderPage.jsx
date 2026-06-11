import React from 'react';
import { useNavigate } from 'react-router-dom';

const PlaceholderPage = ({ title }) => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container" style={{ textAlign: 'center', padding: '100px 20px' }}>
      <div className="icon-3d-wrapper icon-xl icon-indigo" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '32px' }}>{title[0]}</h1>
      </div>
      <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>{title}</h1>
      <p style={{ color: '#64748b', fontSize: '1.2rem', marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
        We are currently migrating this section to our new React architecture to provide you with a smoother experience. Stay tuned!
      </p>
      <button 
        className="btn-continue" 
        style={{ padding: '12px 32px', fontSize: '16px' }}
        onClick={() => navigate('/')}
      >
        Return to Dashboard
      </button>
    </div>
  );
};

export default PlaceholderPage;
