// src/pages/Payments.js
import React, { useEffect, useState } from 'react';
import api, { fmt, fmtDate } from '../utils/api';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get('/payments').then(r => setPayments(r.data.payments)).finally(()=>setLoading(false));
  }, []);

  const total = payments.reduce((s,p)=>s+parseFloat(p.amount||0), 0);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>Payments</h1>
          <p>{payments.length} payment{payments.length!==1?'s':''} — Total collected: <strong>{fmt(total)}</strong></p>
        </div>
      </div>

      <div className="card" style={{padding:0}}>
        <div className="table-wrap">
          {loading ? (
            <div className="loading" style={{padding:60}}>Loading…</div>
          ) : payments.length === 0 ? (
            <div className="empty-state">
              <div className="icon">💳</div>
              <h3>No payments recorded yet</h3>
              <p>Payments will appear here once invoices are paid.</p>
            </div>
          ) : (
            <table>
              <thead><tr>
                <th>Date</th><th>Invoice</th><th>Client</th><th>Method</th><th>Transaction ID</th><th>Amount</th>
              </tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td style={{color:'var(--text2)',fontSize:13}}>{fmtDate(p.paid_at)}</td>
                    <td style={{fontFamily:'DM Mono',fontSize:13,color:'var(--accent)'}}>{p.invoice_number}</td>
                    <td>{p.client_name}</td>
                    <td style={{textTransform:'capitalize'}}>
                      <span className="badge badge-sent">{p.method}</span>
                    </td>
                    <td style={{fontFamily:'DM Mono',fontSize:12,color:'var(--text2)'}}>{p.transaction_id||'—'}</td>
                    <td className="amount" style={{color:'var(--green)',fontWeight:600}}>{fmt(p.amount)}</td>
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
