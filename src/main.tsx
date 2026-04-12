import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';

// Global error handler for "Script error." and other unhandled exceptions
window.onerror = function(message, source, lineno, colno, error) {
  console.error("Global Script Error:", { message, source, lineno, colno, error });
  return false;
};

window.onunhandledrejection = function(event) {
  console.error("Unhandled Promise Rejection:", event.reason);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
