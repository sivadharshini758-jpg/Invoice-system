// src/pages/InvoiceForm.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { fmt } from '../utils/api';
import toast from 'react-hot-toast';
import './InvoiceForm.css';

const emptyItem = () => ({ description: '', quantity: 1, unit_price: '' });

export default function InvoiceForm() {
  const navigate  = useNavigate();
  const { id }    = useParams();
  const isEdit    = !!id;

  const today = new Date().toISOString().split('T')[0];
  const due30 = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];

  const [form, setForm] = useState({
    client_id: '', issue_date: today, due_date: due30,
    tax_rate: 0, discount_amount: 0, currency: 'USD',
    notes: '', terms: 'Payment due within 30 days.', status: 'draft'
  });
  const [items,   setItems]   = useState([emptyItem()]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    api.get('/clients').then(r => setClients(r.data.clients));
    if (isEdit) {
      setLoading(true);
      api.get(`/invoices/${id}`).then(r => {
        const { invoice, items: its } = r.data;
        setForm({
          client_id: invoice.client_id, issue_date: invoice.issue_date?.split('T')[0],
          due_date: invoice.due_date?.split('T')[0], tax_rate: invoice.tax_rate,
          discount_amount: invoice.discount_amount, currency: invoice.currency,
          notes: invoice.notes || '', terms: invoice.terms || '', status: invoice.status,
        });
        setItems(its.map(i => ({ description:i.description, quantity:i.quantity, unit_price:i.unit_price })));
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const setItem = (i, field, val) => {
    const next = [...items];
    next[i] = { ...next[i], [field]: val };
    setItems(next);
  };

  const addItem    = () => setItems([...items, emptyItem()]);
  const removeItem = (i) => setItems(items.filter((_,j) => j !== i));

  // Totals
  const subtotal = items.reduce((s,it) => s + (parseFloat(it.quantity)||0)*(parseFloat(it.unit_price)||0), 0);
  const tax      = subtotal * ((parseFloat(form.tax_rate)||0)/100);
  const total    = subtotal + tax - (parseFloat(form.discount_amount)||0);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.client_id) return toast.error('Please select a client');
    if (items.some(it => !it.description || !it.unit_price)) return toast.error('Fill in all line items');

    setSaving(true);
    try {
      const payload = { ...form, items: items.map(it => ({...it, quantity: parseFloat(it.quantity), unit_price: parseFloat(it.unit_price)})) };
      if (isEdit) {
        await api.put(`/invoices/${id}`, payload);
        toast.success('Invoice updated!');
        navigate(`/invoices/${id}`);
      } else {
        const r = await api.post('/invoices', payload);
        toast.success('Invoice created!');
        navigate(`/invoices/${r.data.invoice.id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit Invoice' : 'New Invoice'}</h1>
          <p>{isEdit ? 'Update invoice details' : 'Create a new invoice'}</p>
        </div>
      </div>

      <form onSubmit={submit}>
        {/* ── Header info ── */}
        <div className="card" style={{marginBottom:20}}>
          <h3 className="section-title">Invoice Details</h3>
          <div className="form-grid form-grid-3">
            <div className="form-group">
              <label>Client *</label>
              <select value={form.client_id} onChange={e=>setForm({...form,client_id:e.target.value})} required>
                <option value="">Select a client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company?` (${c.company})`:''}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Issue Date</label>
              <input type="date" value={form.issue_date} onChange={e=>setForm({...form,issue_date:e.target.value})} />
            </div>
            <div className="form-group">
              <label>Due Date *</label>
              <input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Currency</label>
              <select value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}>
                {['USD','EUR','GBP','INR','CAD','AUD','SGD','AED'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Line items ── */}
        <div className="card" style={{marginBottom:20}}>
          <h3 className="section-title">Line Items</h3>
          <div className="items-list">
            {items.map((it, i) => (
              <div key={i} className="item-row">
                <div className="item-desc form-group">
                  <label>Description</label>
                  <input placeholder="Service or product description…"
                    value={it.description}
                    onChange={e=>setItem(i,'description',e.target.value)} required />
                </div>
                <div className="item-qty form-group">
                  <label>Qty</label>
                  <input type="number" min="0.01" step="0.01" placeholder="1"
                    value={it.quantity}
                    onChange={e=>setItem(i,'quantity',e.target.value)} required />
                </div>
                <div className="item-price form-group">
                  <label>Unit Price</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00"
                    value={it.unit_price}
                    onChange={e=>setItem(i,'unit_price',e.target.value)} required />
                </div>
                <div className="item-total form-group">
                  <label>Total</label>
                  <div className="item-total-val amount">{fmt((parseFloat(it.quantity)||0)*(parseFloat(it.unit_price)||0), form.currency)}</div>
                </div>
                <button type="button" className="btn-danger btn-sm item-del" onClick={()=>removeItem(i)} disabled={items.length===1}>✕</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn-secondary btn-sm" style={{marginTop:12}} onClick={addItem}>+ Add Item</button>
        </div>

        {/* ── Totals + notes ── */}
        <div className="form-bottom">
          <div className="card" style={{flex:1}}>
            <h3 className="section-title">Notes & Terms</h3>
            <div className="form-group" style={{marginBottom:12}}>
              <label>Notes</label>
              <textarea rows={3} placeholder="Any notes for the client…" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
            </div>
            <div className="form-group">
              <label>Terms</label>
              <textarea rows={2} value={form.terms} onChange={e=>setForm({...form,terms:e.target.value})} />
            </div>
          </div>

          <div className="card totals-card">
            <h3 className="section-title">Summary</h3>
            <div className="form-group" style={{marginBottom:12}}>
              <label>Tax Rate (%)</label>
              <input type="number" min="0" max="100" step="0.01" value={form.tax_rate} onChange={e=>setForm({...form,tax_rate:e.target.value})} />
            </div>
            <div className="form-group" style={{marginBottom:20}}>
              <label>Discount Amount</label>
              <input type="number" min="0" step="0.01" value={form.discount_amount} onChange={e=>setForm({...form,discount_amount:e.target.value})} />
            </div>
            <div className="total-summary">
              <div className="ts-row"><span>Subtotal</span><span className="amount">{fmt(subtotal,form.currency)}</span></div>
              {tax > 0 && <div className="ts-row"><span>Tax ({form.tax_rate}%)</span><span className="amount">{fmt(tax,form.currency)}</span></div>}
              {parseFloat(form.discount_amount) > 0 && <div className="ts-row"><span>Discount</span><span className="amount" style={{color:'var(--green)'}}>-{fmt(form.discount_amount,form.currency)}</span></div>}
              <div className="ts-row ts-total"><span>Total</span><span className="amount">{fmt(total,form.currency)}</span></div>
            </div>
            <button type="submit" className="btn-primary btn-lg" style={{width:'100%',justifyContent:'center',marginTop:16}} disabled={saving}>
              {saving ? 'Saving…' : isEdit ? '✓ Update Invoice' : '✓ Create Invoice'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
