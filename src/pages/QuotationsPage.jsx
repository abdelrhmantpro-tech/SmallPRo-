import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Card, SectionTitle } from '../components/UI';
import { useApp } from '../context/AppContext';
import { money } from '../utils/format';

export default function QuotationsPage() {
  const { scoped, addQuotation, convertQuotationToInvoice } = useApp();
  const [customerId, setCustomerId] = useState(scoped.customers[0]?.id || '');
  const [productId, setProductId] = useState(scoped.products[0]?.id || '');
  const [quantity, setQuantity] = useState(1);

  const create = () => {
    const product = scoped.products.find((p) => p.id === productId);
    if (!product || !customerId) return;
    addQuotation({ customerId, userId: 3, items: [{ productId, quantity: Number(quantity), price: product.price }] });
  };

  return (
    <Layout title="Quotations">
      <div className="grid three">
        <Card>
          <SectionTitle title="Create quotation" subtitle="Direct sales workflow" />
          <label>Customer<select value={customerId} onChange={(e)=>setCustomerId(e.target.value)}>{scoped.customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label>Product<select value={productId} onChange={(e)=>setProductId(e.target.value)}>{scoped.products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label>Quantity<input type="number" value={quantity} onChange={(e)=>setQuantity(e.target.value)} /></label>
          <button className="btn primary" onClick={create}>Save quotation</button>
        </Card>
        <Card className="span-2">
          <SectionTitle title="All quotations" subtitle="Convert approved quote into invoice" />
          <table><thead><tr><th>ID</th><th>Customer</th><th>Status</th><th>Total</th><th></th></tr></thead><tbody>{scoped.quotations.map((q)=><tr key={q.id}><td>{q.id}</td><td>{scoped.customers.find(c=>c.id===q.customerId)?.name}</td><td>{q.status}</td><td>{money(q.total)}</td><td><button className="btn ghost small" onClick={()=>convertQuotationToInvoice(q.id)}>To invoice</button></td></tr>)}</tbody></table>
        </Card>
      </div>
    </Layout>
  );
}
