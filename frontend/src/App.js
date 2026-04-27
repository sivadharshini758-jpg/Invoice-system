// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Layout       from './components/layout/Layout';
import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import Invoices     from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import InvoiceForm  from './pages/InvoiceForm';
import Clients      from './pages/Clients';
import Payments     from './pages/Payments';
import Users        from './pages/Users';

import './index.css';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'var(--text2)'}}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index         element={<Dashboard />} />
        <Route path="invoices"        element={<Invoices />} />
        <Route path="invoices/new"    element={<InvoiceForm />} />
        <Route path="invoices/:id"    element={<InvoiceDetail />} />
        <Route path="invoices/:id/edit" element={<InvoiceForm />} />
        <Route path="clients"         element={<Clients />} />
        <Route path="payments"        element={<Payments />} />
        <Route path="users"           element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background:'#1e2436', color:'#e8eaf0', border:'1px solid #2a3045', fontSize:14 },
            success: { iconTheme: { primary:'#22c55e', secondary:'#1e2436' } },
            error:   { iconTheme: { primary:'#ef4444', secondary:'#1e2436' } },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
