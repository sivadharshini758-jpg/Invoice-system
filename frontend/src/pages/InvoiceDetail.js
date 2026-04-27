// src/pages/InvoiceDetail.js
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import api, { fmt, fmtDate, statusColor } from '../utils/api';
import toast from 'react-hot-toast';
import PaymentModal from '../components/invoices/PaymentModal';
import './InvoiceDetail.css';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  const load = () => {
    setLoading(true);
    api.get(`/invoices/${id}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handlePrint = useReactToPrint({ content: () => printRef.current });

  const sendEmail = async () => {
    setActionLoading('email');
    try {
      await api.post(`/invoices/${id}/send-email`);
      toast.success('Invoice emailed to client!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send email');
    } finally { setActionLoading(''); }
  };

  const stripeCheckout = async () => {
    setActionLoading('stripe');
    try {
      const r = await api.post(`/payments/invoices/${id}/stripe-session`);
      window.open(r.data.url, '_blank');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Stripe error');
    } finally { setActionLoading(''); }
  };

  if (loading) return <div className="loading">Loading invoice…</div>;
  if (!data) return <div className="loading">Invoice not found</div>;

  const { invoice, items, payments } = data;

  return (
    <div className="fade-in">
      {/* Actions bar */}
      <div className="page-header">
        <div>
          <Link to="/invoices" style={{color:'var(--text2)',fontSize:13}}>← Invoices</Link>
          <h1 style={{marginTop:4}}>{invoice.invoice_number}</h1>
          <span className={`badge ${statusColor(invoice.status)}`} style={{marginTop:4,display:'inline-flex'}}>{invoice.status}</span>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button className="btn-secondary" onClick={handlePrint}>🖨 Print / PDF</button>
          {invoice.status !== 'paid' && <>
            <button className="btn-secondary" onClick={sendEmail} disabled={actionLoading==='email'}>
              {actionLoading==='email' ? 'Sending…' : '✉ Send Email'}
            </button>
            <button className="btn-secondary" onClick={stripeCheckout} disabled={actionLoading==='stripe'}>
              {actionLoading==='stripe' ? 'Loading…' : '💳 Stripe Pay Link'}
            </button>
            <button className="btn-success" onClick={()=>setShowPayModal(true)}>✓ Record Payment</button>
          </>}
          {['draft','cancelled'].includes(invoice.status) && (
            <Link to={`/invoices/${id}/edit`} className="btn-primary">✏ Edit</Link>
          )}
        </div>
      </div>

      {/* Printable invoice */}
      <div className="card invoice-print-wrap" ref={printRef}>
        <div className="inv-header">
          <div className="inv-from">
            <div className="inv-company">{process.env.REACT_APP_COMPANY_NAME || 'Your Company'}</div>
            <div className="inv-address">{process.env.REACT_APP_COMPANY_ADDRESS || ''}</div>
            <div className="inv-address">{process.env.REACT_APP_COMPANY_EMAIL || ''}</div>
          </div>
          <div className="inv-title-block">
            <div className="inv-title">INVOICE</div>
            <div className="inv-number">{invoice.invoice_number}</div>
          </div>
        </div>

        <div className="inv-meta-grid">
          <div className="inv-meta-box">
            <div className="inv-meta-label">Bill To</div>
            <div className="inv-meta-value" style={{fontWeight:600}}>{invoice.client_name}</div>
            {invoice.client_company && <div className="inv-meta-value">{invoice.client_company}</div>}
            <div className="inv-meta-value" style={{color:'var(--text2)'}}>{invoice.client_email}</div>
            {invoice.client_phone && <div className="inv-meta-value" style={{color:'var(--text2)'}}>{invoice.client_phone}</div>}
            {invoice.client_address && <div className="inv-meta-value" style={{color:'var(--text2)'}}>{invoice.client_address}</div>}
          </div>
          <div className="inv-meta-box">
            <div className="inv-detail-row"><span>Issue Date</span><span>{fmtDate(invoice.issue_date)}</span></div>
            <div className="inv-detail-row"><span>Due Date</span><span style={{color:invoice.status==='overdue'?'var(--red)':undefined}}>{fmtDate(invoice.due_date)}</span></div>
            <div className="inv-detail-row"><span>Currency</span><span>{invoice.currency}</span></div>
            <div className="inv-detail-row"><span>Status</span>
              <span className={`badge ${statusColor(invoice.status)}`}>{invoice.status}</span>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="table-wrap" style={{marginTop:24}}>
          <table className="items-table">
            <thead><tr>
              <th style={{width:'50%'}}>Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr></thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id}>
                  <td>{it.description}</td>
                  <td className="amount">{it.quantity}</td>
                  <td className="amount">{fmt(it.unit_price, invoice.currency)}</td>
                  <td className="amount" style={{fontWeight:500}}>{fmt(it.total, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="inv-totals">
          <div className="total-row"><span>Subtotal</span><span className="amount">{fmt(invoice.subtotal, invoice.currency)}</span></div>
          {parseFloat(invoice.tax_rate) > 0 && (
            <div className="total-row"><span>Tax ({invoice.tax_rate}%)</span><span className="amount">{fmt(invoice.tax_amount, invoice.currency)}</span></div>
          )}
          {parseFloat(invoice.discount_amount) > 0 && (
            <div className="total-row"><span>Discount</span><span className="amount" style={{color:'var(--green)'}}>-{fmt(invoice.discount_amount, invoice.currency)}</span></div>
          )}
          <div className="total-row total-final">
            <span>Total Due</span>
            <span className="amount">{fmt(invoice.total, invoice.currency)}</span>
          </div>
        </div>

        {invoice.notes && <div className="inv-notes"><strong>Notes:</strong> {invoice.notes}</div>}
        {invoice.terms && <div className="inv-notes"><strong>Terms:</strong> {invoice.terms}</div>}
      </div>

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="card" style={{marginTop:20}}>
          <h3 style={{marginBottom:16,fontSize:15,fontWeight:600}}>Payment History</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Method</th><th>Transaction ID</th><th>Amount</th></tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td>{fmtDate(p.paid_at)}</td>
                    <td style={{textTransform:'capitalize'}}>{p.method}</td>
                    <td style={{fontFamily:'DM Mono',fontSize:12,color:'var(--text2)'}}>{p.transaction_id || '—'}</td>
                    <td className="amount" style={{color:'var(--green)',fontWeight:600}}>{fmt(p.amount, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showPayModal && (
        <PaymentModal
          invoice={invoice}
          onClose={() => setShowPayModal(false)}
          onSuccess={() => { setShowPayModal(false); load(); toast.success('Payment recorded!'); }}
        />
      )}
    </div>
  );
}
