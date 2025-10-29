import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      {/* createBrowserRouter lets us opt into future v7 flags to silence migration warnings
          We mount App at a wildcard route so the existing in-App <Routes> still works. */}
      <RouterProvider router={createBrowserRouter([
        { path: '/*', element: <App /> }
      ], { future: { v7_startTransition: true, v7_relativeSplatPath: true } })} />
    </AuthProvider>
  </React.StrictMode>
);
