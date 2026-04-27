// src/pages/Clients.js
import React, { useEffect, useState } from 'react';
import api, { fmtDate } from '../utils/api';
import toast from 'react-hot-toast';

const emptyForm = { name:'', email:'', phone:'', company:'', address:'', city:'', country:'', tax_number:'', notes:'' };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState(null); // null | 'create' | client obj
  const [form,    setForm]    = useState(emptyForm);
  const [saving,  setSaving]  = useState(false);

  const load = () =>
    api.get('/clients', { params: search ? { search } : {} })
       .then(r => setClients(r.data.clients));

  useEffect(() => { load(); }, [search]);

  const openCreate = () => { setForm(emptyForm); setModal('create'); };
  const openEdit   = (c) => { setForm(c); setModal(c); };
  const closeModal = () => setModal(null);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'create') {
        await api.post('/clients', form);
        toast.success('Client created!');
      } else {
        await api.put(`/clients/${modal.id}`, form);
        toast.success('Client updated!');
      }
      closeModal();
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  const toggle = async (c) => {
    try {
      await api.put(`/clients/${c.id}`, { is_active: !c.is_active });
      load();
    } catch { toast.error('Update failed'); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1>Clients</h1><p>{clients.length} client{clients.length!==1?'s':''}</p></div>
        <button className="btn-primary" onClick={openCreate}>+ Add Client</button>
      </div>

      <div className="filters">
        <input placeholder="Search clients…" value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      <div className="card" style={{padding:0}}>
        <div className="table-wrap">
          {clients.length === 0 ? (
            <div className="empty-state">
              <div className="icon">👥</div>
              <h3>No clients yet</h3>
              <p>Add your first client to get started</p>
              <button className="btn-primary" style={{marginTop:16}} onClick={openCreate}>+ Add Client</button>
            </div>
          ) : (
            <table>
              <thead><tr>
                <th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Status</th><th>Added</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id}>
                    <td style={{fontWeight:500}}>{c.name}</td>
                    <td style={{color:'var(--text2)'}}>{c.company || '—'}</td>
                    <td style={{color:'var(--text2)',fontSize:13}}>{c.email}</td>
                    <td style={{color:'var(--text2)',fontSize:13}}>{c.phone || '—'}</td>
                    <td>
                      <span className={`badge ${c.is_active ? 'badge-paid' : 'badge-cancelled'}`}>
                        {c.is_active ? 'active' : 'inactive'}
                      </span>
                    </td>
                    <td style={{color:'var(--text2)',fontSize:13}}>{fmtDate(c.created_at)}</td>
                    <td>
                      <div style={{display:'flex',gap:6}}>
                        <button className="btn-secondary btn-sm" onClick={()=>openEdit(c)}>Edit</button>
                        <button className="btn-secondary btn-sm" onClick={()=>toggle(c)}>
                          {c.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&closeModal()}>
          <div className="modal modal-lg">
            <h2 style={{marginBottom:20,fontSize:18,fontWeight:700}}>
              {modal==='create' ? 'New Client' : 'Edit Client'}
            </h2>
            <form onSubmit={save}>
              <div className="form-grid form-grid-2" style={{marginBottom:16}}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Company</label>
                  <input value={form.company||''} onChange={e=>setForm({...form,company:e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})} />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input value={form.city||''} onChange={e=>setForm({...form,city:e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input value={form.country||''} onChange={e=>setForm({...form,country:e.target.value})} />
                </div>
                <div className="form-group" style={{gridColumn:'span 2'}}>
                  <label>Address</label>
                  <input value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Tax / VAT Number</label>
                  <input value={form.tax_number||''} onChange={e=>setForm({...form,tax_number:e.target.value})} />
                </div>
                <div className="form-group" style={{gridColumn:'span 2'}}>
                  <label>Notes</label>
                  <textarea rows={2} value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} />
                </div>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : modal==='create' ? 'Create Client' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
