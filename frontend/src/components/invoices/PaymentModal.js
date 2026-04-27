// src/components/invoices/PaymentModal.js
import React, { useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function PaymentModal({ invoice, onClose, onSuccess }) {
  const [form, setForm] = useState({
    amount: invoice.total, method: 'bank',
    transaction_id: '', notes: '',
    paid_at: new Date().toISOString().split('T')[0]
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/invoices/${invoice.id}/record-payment`, form);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record payment');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 style={{marginBottom:20,fontSize:18,fontWeight:700}}>Record Payment</h2>
        <form onSubmit={submit}>
          <div className="form-grid form-grid-2" style={{marginBottom:16}}>
            <div className="form-group">
              <label>Amount</label>
              <input type="number" step="0.01" value={form.amount}
                onChange={e=>setForm({...form,amount:e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select value={form.method} onChange={e=>setForm({...form,method:e.target.value})}>
                <option value="bank">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="stripe">Stripe</option>
                <option value="paypal">PayPal</option>
                <option value="razorpay">Razorpay</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Payment Date</label>
              <input type="date" value={form.paid_at} onChange={e=>setForm({...form,paid_at:e.target.value})} />
            </div>
            <div className="form-group">
              <label>Transaction ID</label>
              <input placeholder="Optional reference…" value={form.transaction_id}
                onChange={e=>setForm({...form,transaction_id:e.target.value})} />
            </div>
          </div>
          <div className="form-group" style={{marginBottom:20}}>
            <label>Notes</label>
            <textarea rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-success" disabled={saving}>
              {saving ? 'Saving…' : '✓ Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
