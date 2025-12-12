import React from 'react';

const TestPage = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>PPM is Working!</h1>
        <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>The React application is successfully rendering.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <a 
            href="/login" 
            style={{ padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', borderRadius: '0.375rem', textDecoration: 'none', transition: 'background-color 0.2s' }}
          >
            Go to Login
          </a>
          <a 
            href="/dashboard" 
            style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', borderRadius: '0.375rem', textDecoration: 'none', transition: 'background-color 0.2s' }}
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

export default TestPage;