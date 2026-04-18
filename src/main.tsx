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
  console.error("Critical: Unhandled Promise Rejection:", {
    reason: event.reason,
    promise: event.promise
  });
  
  // Optionally show a user-friendly error toast if sonner was available globally, 
  // but better to just log accurately for now.
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
