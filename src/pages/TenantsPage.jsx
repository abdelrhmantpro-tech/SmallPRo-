import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Card, SectionTitle, Badge } from '../components/UI';
import { useApp } from '../context/AppContext';

export default function TenantsPage() {
  const { currentUser, scoped, addTenant } = useApp();
  const [form, setForm] = useState({ name:'', email:'', phone:'', plan:'Starter' });
  if (currentUser?.type !== 'platform') return <Layout title="Tenants"><Card>This page is available for web admin only.</Card></Layout>;
  return (
    <Layout title="Tenants">
      <Card>
        <SectionTitle title="Create tenant" subtitle="Provision a new company workspace" />
        <div className="inline-form"><input placeholder="Company name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} /><input placeholder="Email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} /><input placeholder="Phone" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} /><select value={form.plan} onChange={(e)=>setForm({...form,plan:e.target.value})}><option>Starter</option><option>Growth</option><option>Professional</option></select><button className="btn primary" onClick={()=>addTenant(form)}>Create</button></div>
      </Card>
      <div className="mt24"><Card><SectionTitle title="All tenants" subtitle="Subscription overview" /><table><thead><tr><th>Name</th><th>Plan</th><th>Status</th><th>Email</th></tr></thead><tbody>{scoped.tenants.map((t)=><tr key={t.id}><td>{t.name}</td><td>{t.plan}</td><td><Badge tone={t.status === 'Active' ? 'success' : 'warning'}>{t.status}</Badge></td><td>{t.email}</td></tr>)}</tbody></table></Card></div>
    </Layout>
  );
}
