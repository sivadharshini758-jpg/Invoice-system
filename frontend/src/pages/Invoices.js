// src/pages/Invoices.js
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { fmt, fmtDate, statusColor } from '../utils/api';
import toast from 'react-hot-toast';

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filters,  setFilters]  = useState({ search:'', status:'' });

  const load = async () => {
    setLoading(true);
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    const r = await api.get('/invoices', { params });
    setInvoices(r.data.invoices);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filters]);

  const deleteInv = async (inv) => {
    if (!window.confirm(`Delete ${inv.invoice_number}?`)) return;
    try {
      await api.delete(`/invoices/${inv.id}`);
      toast.success('Invoice deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>Invoices</h1>
          <p>{invoices.length} invoice{invoices.length!==1?'s':''} found</p>
        </div>
        <Link to="/invoices/new" className="btn-primary">+ New Invoice</Link>
      </div>

      <div className="filters">
        <input placeholder="Search invoices or clients…"
          value={filters.search}
          onChange={e => setFilters({...filters, search: e.target.value})} />
        <select value={filters.status}
          onChange={e => setFilters({...filters, status: e.target.value})}>
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="card" style={{padding:0}}>
        <div className="table-wrap">
          {loading ? (
            <div className="loading" style={{padding:60}}>Loading…</div>
          ) : invoices.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🧾</div>
              <h3>No invoices found</h3>
              <p>Create your first invoice to get started</p>
              <Link to="/invoices/new" className="btn-primary" style={{marginTop:16,display:'inline-flex'}}>+ New Invoice</Link>
            </div>
          ) : (
            <table>
              <thead><tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr></thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td>
                      <Link to={`/invoices/${inv.id}`} style={{fontFamily:'DM Mono',fontSize:13,color:'var(--accent)'}}>
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td>
                      <div style={{fontWeight:500}}>{inv.client_name}</div>
                      {inv.client_company && <div style={{color:'var(--text2)',fontSize:12}}>{inv.client_company}</div>}
                    </td>
                    <td style={{color:'var(--text2)'}}>{fmtDate(inv.issue_date)}</td>
                    <td style={{color: inv.status==='overdue' ? 'var(--red)' : 'var(--text2)'}}>
                      {fmtDate(inv.due_date)}
                    </td>
                    <td><span className={`badge ${statusColor(inv.status)}`}>{inv.status}</span></td>
                    <td className="amount" style={{fontWeight:600}}>{fmt(inv.total, inv.currency)}</td>
                    <td>
                      <div style={{display:'flex',gap:6}}>
                        <Link to={`/invoices/${inv.id}`} className="btn-secondary btn-sm">View</Link>
                        {['draft','cancelled'].includes(inv.status) && (
                          <button className="btn-danger btn-sm" onClick={()=>deleteInv(inv)}>Del</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
