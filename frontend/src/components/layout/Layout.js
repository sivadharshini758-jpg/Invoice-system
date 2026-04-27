// src/components/layout/Layout.js
import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const nav = [
  { to: '/',         icon: '📊', label: 'Dashboard'   },
  { to: '/invoices', icon: '🧾', label: 'Invoices'    },
  { to: '/clients',  icon: '👥', label: 'Clients'     },
  { to: '/payments', icon: '💳', label: 'Payments'    },
];
const adminNav = [
  { to: '/users',    icon: '🔐', label: 'Users'       },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [sideOpen, setSideOpen] = useState(false);

  return (
    <div className="layout">
      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sideOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">InvoiceOS</span>
        </div>

        <nav className="sidebar-nav">
          {nav.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to==='/'} className={({isActive})=>`nav-link ${isActive?'active':''}`} onClick={()=>setSideOpen(false)}>
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
            </NavLink>
          ))}
          {user?.role === 'admin' && <>
            <div className="nav-divider" />
            {adminNav.map(n => (
              <NavLink key={n.to} to={n.to} className={({isActive})=>`nav-link ${isActive?'active':''}`} onClick={()=>setSideOpen(false)}>
                <span className="nav-icon">{n.icon}</span>
                <span>{n.label}</span>
              </NavLink>
            ))}
          </>}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <button className="logout-btn" onClick={logout} title="Logout">⎋</button>
        </div>
      </aside>

      {/* ── Mobile overlay ── */}
      {sideOpen && <div className="sidebar-overlay" onClick={()=>setSideOpen(false)} />}

      {/* ── Main ── */}
      <main className="main">
        <div className="topbar">
          <button className="menu-btn" onClick={()=>setSideOpen(!sideOpen)}>☰</button>
          <div className="topbar-right">
            <span className="topbar-greeting">Hello, {user?.name?.split(' ')[0]}</span>
          </div>
        </div>
        <div className="main-content fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
