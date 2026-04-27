// src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api, { fmt, fmtDate, statusColor } from '../utils/api';
import './Dashboard.css';

const StatCard = ({ label, value, sub, color }) => (
  <div className="stat-card" style={{ '--accent-color': color }}>
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
    {sub && <div className="stat-sub">{sub}</div>}
  </div>
);

export default function Dashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/summary')
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard…</div>;
  if (!data) return null;

  const { summary, byStatus, monthly, topClients, recent, overdue } = data;

  return (
    <div className="dashboard fade-in">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Your billing overview at a glance</p>
        </div>
        <Link to="/invoices/new" className="btn-primary" style={{display:'inline-flex',alignItems:'center',gap:6}}>
          + New Invoice
        </Link>
      </div>

      {/* ── Stat cards ── */}
      <div className="stats-grid">
        <StatCard label="Total Revenue"   value={fmt(summary.total_revenue)}   color="#4f8ef7" />
        <StatCard label="Amount Collected" value={fmt(summary.paid_amount)}     color="#22c55e" />
        <StatCard label="Pending / Sent"   value={fmt(summary.pending_amount)}  color="#f59e0b" />
        <StatCard label="Overdue"          value={fmt(summary.overdue_amount)}  color="#ef4444" />
      </div>

      {/* ── Charts + status ── */}
      <div className="dash-row">
        {/* Monthly revenue chart */}
        <div className="card dash-chart">
          <h3 className="card-title">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly} margin={{left:-20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="#5c6680" tick={{fontSize:11}} />
              <YAxis stroke="#5c6680" tick={{fontSize:11}} tickFormatter={v=>fmt(v).replace('.00','')} />
              <Tooltip
                contentStyle={{ background:'#1e2436', border:'1px solid #2a3045', borderRadius:8, fontSize:13 }}
                formatter={(v)=>[fmt(v), 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#4f8ef7" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status breakdown */}
        <div className="card dash-status">
          <h3 className="card-title">Invoice Status</h3>
          <div className="status-list">
            {byStatus.map(s => (
              <div key={s.status} className="status-row">
                <span className={`badge ${statusColor(s.status)}`}>{s.status}</span>
                <span className="status-count">{s.count}</span>
                <span className="status-amount amount">{fmt(s.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Overdue alerts ── */}
      {overdue.length > 0 && (
        <div className="card overdue-card">
          <h3 className="card-title" style={{color:'var(--red)'}}>⚠ Overdue Invoices ({overdue.length})</h3>
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Invoice</th><th>Client</th><th>Due Date</th><th>Amount</th><th></th>
              </tr></thead>
              <tbody>
                {overdue.map(inv => (
                  <tr key={inv.id}>
                    <td><span className="mono">{inv.invoice_number}</span></td>
                    <td>{inv.client_name}</td>
                    <td style={{color:'var(--red)'}}>{fmtDate(inv.due_date)}</td>
                    <td className="amount">{fmt(inv.total)}</td>
                    <td><Link to={`/invoices/${inv.id}`} className="btn-secondary btn-sm">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="dash-row">
        {/* Recent invoices */}
        <div className="card">
          <h3 className="card-title">Recent Invoices</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Invoice</th><th>Client</th><th>Status</th><th>Amount</th></tr></thead>
              <tbody>
                {recent.map(inv => (
                  <tr key={inv.id}>
                    <td><Link to={`/invoices/${inv.id}`} className="mono link">{inv.invoice_number}</Link></td>
                    <td>{inv.client_name}</td>
                    <td><span className={`badge ${statusColor(inv.status)}`}>{inv.status}</span></td>
                    <td className="amount">{fmt(inv.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top clients */}
        <div className="card">
          <h3 className="card-title">Top Clients</h3>
          <div className="client-list">
            {topClients.map((c,i) => (
              <div key={i} className="top-client">
                <div className="client-rank">#{i+1}</div>
                <div className="client-info">
                  <div className="client-name">{c.name}</div>
                  <div className="client-meta">{c.invoice_count} invoice{c.invoice_count!=1?'s':''}</div>
                </div>
                <div className="client-amount amount">{fmt(c.total_billed)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
