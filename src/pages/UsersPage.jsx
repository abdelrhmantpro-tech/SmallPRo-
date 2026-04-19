import React, { useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { Card, SectionTitle, Badge, Modal } from '../components/UI';
import { useApp } from '../context/AppContext';
import { date } from '../utils/format';

const blankUser = {
  username: '',
  fullName: '',
  email: '',
  phoneNumber: '',
  role: 3,
  password: '123456',
};

export default function UsersPage() {
  const { scoped, addUser, updateUser, currentUser } = useApp();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [form, setForm] = useState(blankUser);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped.users.filter((user) => {
      const matchesText = !q || [String(user.id), user.username, user.name, user.fullName, user.email, user.phoneNumber, user.role].filter(Boolean).join(' ').toLowerCase().includes(q);
      const matchesRole = roleFilter === 'All' || user.role === roleFilter;
      return matchesText && matchesRole;
    });
  }, [scoped.users, search, roleFilter]);

  const saveUser = () => {
    const res = addUser(form);
    if (res?.ok) {
      setOpen(false);
      setForm(blankUser);
    }
  };

  return (
    <Layout title="Users" actions={<button className="btn primary" onClick={() => setOpen(true)} disabled={currentUser?.role !== 'Admin'}>Register user</button>}>
      <Card className="large-card">
        <SectionTitle title="Tenant users" subtitle="Implements the documented register-user flow. Search by user ID, username, name, email, phone, or role." />
        <div className="module-filters">
          <label className="filter-field"><span>User search</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search user ID, username, full name, email, phone, role..." /></label>
          <label className="filter-field"><span>Role</span><select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}><option>All</option><option>Admin</option><option>Manager</option><option>Salesperson</option><option>Inventory Manager</option></select></label>
        </div>
        <table>
          <thead><tr><th>ID</th><th>User</th><th>Contact</th><th>Role</th><th>Created</th><th></th></tr></thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>
                  <strong>{user.fullName || user.name}</strong>
                  <div className="table-subtle">@{user.username}</div>
                </td>
                <td>
                  <strong>{user.email}</strong>
                  <div className="table-subtle">{user.phoneNumber || '-'}</div>
                </td>
                <td><Badge>{user.role}</Badge></td>
                <td>{user.createdAt ? date(user.createdAt) : '-'}</td>
                <td><button className="btn ghost small" onClick={() => setSelected({ ...user })}>Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Register user" subtitle="Admin-only registration using username, email, password, full name, phone number, and role." footer={<button className="btn primary" onClick={saveUser}>Create user</button>}>
        <div className="grid two balanced-grid">
          <label>Username<input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
          <label>Full name<input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
          <label>Email<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>Phone number<input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} /></label>
          <label>Role<select value={form.role} onChange={(e) => setForm({ ...form, role: Number(e.target.value) })}><option value={1}>Admin</option><option value={2}>Manager</option><option value={3}>Salesperson</option><option value={4}>Inventory Manager</option></select></label>
          <label>Password<input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        </div>
      </Modal>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.fullName || selected?.name || 'User details'} subtitle="Review the exact data stored in the authentication module for this tenant user." footer={<button className="btn primary" onClick={() => { if (selected) updateUser(selected.id, selected); setSelected(null); }}>Save changes</button>}>
        {selected ? (
          <div className="grid two balanced-grid">
            <label>ID<input value={selected.id} disabled /></label>
            <label>Tenant ID<input value={selected.tenantId} disabled /></label>
            <label>Username<input value={selected.username || ''} onChange={(e) => setSelected({ ...selected, username: e.target.value })} /></label>
            <label>Full name<input value={selected.fullName || selected.name || ''} onChange={(e) => setSelected({ ...selected, fullName: e.target.value, name: e.target.value })} /></label>
            <label>Email<input value={selected.email || ''} onChange={(e) => setSelected({ ...selected, email: e.target.value })} /></label>
            <label>Phone number<input value={selected.phoneNumber || ''} onChange={(e) => setSelected({ ...selected, phoneNumber: e.target.value })} /></label>
            <label>Role<select value={selected.role} onChange={(e) => setSelected({ ...selected, role: e.target.value })}><option>Admin</option><option>Manager</option><option>Salesperson</option><option>Inventory Manager</option></select></label>
            <label>Password<input value={selected.password || '123456'} onChange={(e) => setSelected({ ...selected, password: e.target.value })} /></label>
            <label>Created at<input value={selected.createdAt || ''} disabled /></label>
            <label>Created by<input value={selected.createdBy || 'Tenant bootstrap'} disabled /></label>
          </div>
        ) : null}
      </Modal>
    </Layout>
  );
}
