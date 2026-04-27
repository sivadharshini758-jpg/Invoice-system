// src/pages/Users.js
import React, { useEffect, useState } from 'react';
import api, { fmtDate } from '../utils/api';
import toast from 'react-hot-toast';

export default function Users() {
  const [users,   setUsers]   = useState([]);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState({ name:'', email:'', password:'', role:'staff' });
  const [saving,  setSaving]  = useState(false);

  const load = () => api.get('/auth/users').then(r => setUsers(r.data.users));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/auth/register', form);
      toast.success('User created!');
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setSaving(false); }
  };

  const toggle = async (u) => {
    try {
      await api.patch(`/auth/users/${u.id}/toggle`);
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1>User Management</h1><p>Control who can access the system</p></div>
        <button className="btn-primary" onClick={()=>setModal(true)}>+ Add User</button>
      </div>

      <div className="card" style={{padding:0}}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{fontWeight:500}}>{u.name}</td>
                  <td style={{color:'var(--text2)',fontSize:13}}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role==='admin'?'badge-overdue':u.role==='staff'?'badge-sent':'badge-draft'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.is_active?'badge-paid':'badge-cancelled'}`}>
                      {u.is_active ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td style={{color:'var(--text2)',fontSize:13}}>{fmtDate(u.created_at)}</td>
                  <td>
                    <button className="btn-secondary btn-sm" onClick={()=>toggle(u)}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal">
            <h2 style={{marginBottom:20,fontSize:18,fontWeight:700}}>New User</h2>
            <form onSubmit={save}>
              <div className="form-grid" style={{gap:14,marginBottom:16}}>
                <div className="form-group"><label>Full Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
                <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required /></div>
                <div className="form-group"><label>Password</label><input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required minLength={6} /></div>
                <div className="form-group">
                  <label>Role</label>
                  <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                    <option value="admin">Admin (full access)</option>
                    <option value="staff">Staff (create/edit)</option>
                    <option value="viewer">Viewer (read-only)</option>
                  </select>
                </div>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" className="btn-secondary" onClick={()=>setModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving?'Creating…':'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
