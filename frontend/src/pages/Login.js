// src/pages/Login.js
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Login.css';

export default function Login() {
  const { user, login } = useAuth();
  const [form, setForm]   = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">⚡</div>
          <h1>InvoiceOS</h1>
          <p>Sign in to your account</p>
        </div>
        <form onSubmit={submit} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="admin@example.com" required
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" required
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})} />
          </div>
          <button type="submit" className="btn-primary btn-lg" disabled={loading} style={{width:'100%',justifyContent:'center'}}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>
        <p className="login-hint">Default: admin@example.com / Admin@123</p>
      </div>
    </div>
  );
}
