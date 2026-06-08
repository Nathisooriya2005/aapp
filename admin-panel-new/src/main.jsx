import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Inject responsive styles
const style = document.createElement('style');
style.textContent = `
  @media (max-width: 768px) {
    .admin-container {
      padding: 10px !important;
    }
    .admin-header {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 10px !important;
    }
    .admin-nav {
      flex-direction: column !important;
      gap: 5px !important;
    }
    .admin-nav-button {
      width: 100% !important;
      text-align: left !important;
    }
    .admin-table-container {
      overflow-x: auto !important;
    }
    .admin-table {
      min-width: 600px !important;
    }
    .admin-card {
      padding: 15px !important;
    }
    .admin-button {
      width: 100% !important;
      margin-bottom: 5px !important;
    }
    .admin-stats {
      grid-template-columns: 1fr !important;
    }
  }
  @media (max-width: 480px) {
    .admin-login-form {
      padding: 20px !important;
      width: 90% !important;
    }
    .admin-input {
      width: 100% !important;
    }
  }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
