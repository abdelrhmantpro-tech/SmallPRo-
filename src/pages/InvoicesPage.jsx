import React from 'react';
import Layout from '../components/Layout';
import { Card, SectionTitle, Badge } from '../components/UI';
import { useApp } from '../context/AppContext';
import { money } from '../utils/format';

export default function InvoicesPage() {
  const { scoped, recordPayment } = useApp();
  return (
    <Layout title="Invoices & Payments">
      <Card>
        <SectionTitle title="Sales invoices" subtitle="Payment updates inventory automatically" />
        <table><thead><tr><th>ID</th><th>Customer</th><th>Status</th><th>Total</th><th>Method</th><th></th></tr></thead><tbody>{scoped.invoices.map((i)=><tr key={i.id}><td>{i.id}</td><td>{scoped.customers.find(c=>c.id===i.customerId)?.name}</td><td><Badge tone={i.status==='Paid' ? 'success' : 'warning'}>{i.status}</Badge></td><td>{money(i.total)}</td><td>{i.paymentMethod || '-'}</td><td>{i.status !== 'Paid' && <div className="row gap"><button className="btn small" onClick={()=>recordPayment(i.id,'Cash')}>Pay Cash</button><button className="btn ghost small" onClick={()=>recordPayment(i.id,'Visa')}>Pay Visa</button></div>}</td></tr>)}</tbody></table>
      </Card>
    </Layout>
  );
}
