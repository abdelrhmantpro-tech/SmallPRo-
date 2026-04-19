import React, { useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { Badge, Card, Modal, SectionTitle } from '../components/UI';
import { useApp } from '../context/AppContext';
import { money } from '../utils/format';

const quotationStatuses = ['Draft', 'Sent', 'Accepted', 'Rejected'];

export default function SalesPage() {
  const { scoped, addQuotation, updateQuotation, convertQuotationToInvoice, addInvoice, updateInvoice, recordPayment } = useApp();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [quoteDetail, setQuoteDetail] = useState(null);
  const [invoiceDetail, setInvoiceDetail] = useState(null);
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [quoteSearch, setQuoteSearch] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [quoteForm, setQuoteForm] = useState({ customerId: scoped.customers[0]?.id || '', productId: scoped.products[0]?.id || '', quantity: 1, tax: 0, validUntil: '' });
  const [invoiceForm, setInvoiceForm] = useState({ customerId: scoped.customers[0]?.id || '', productId: scoped.products[0]?.id || '', quantity: 1, tax: 0, dueDate: '' });

  const makeItems = (productId, quantity) => {
    const product = scoped.products.find((item) => item.id === productId);
    if (!product) return [];
    return [{ productId: product.id, quantity: Number(quantity), price: Number(product.price) }];
  };

  const filteredQuotations = useMemo(() => {
    const q = quoteSearch.trim().toLowerCase();
    return scoped.quotations.filter((quotation) => {
      const customer = scoped.customers.find((customerItem) => customerItem.id === quotation.customerId);
      return !q || [quotation.id, quotation.quotationNumber, quotation.status, quotation.customerId, customer?.name].filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [scoped.quotations, scoped.customers, quoteSearch]);

  const filteredInvoices = useMemo(() => {
    const q = invoiceSearch.trim().toLowerCase();
    return scoped.invoices.filter((invoice) => {
      const customer = scoped.customers.find((customerItem) => customerItem.id === invoice.customerId);
      return !q || [invoice.id, invoice.invoiceNumber, invoice.status, invoice.customerId, invoice.paymentMethod, customer?.name].filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [scoped.invoices, scoped.customers, invoiceSearch]);

  return (
    <Layout title="Sales" actions={<div className="row gap wrap"><button className="btn ghost" onClick={() => setInvoiceOpen(true)}>Create invoice</button><button className="btn primary" onClick={() => setQuoteOpen(true)}>Create quotation</button></div>}>
      <div className="grid two balanced-grid">
        <Card className="large-card">
          <SectionTitle title="Quotations" subtitle="Search quotations by quotation number, quotation ID, customer name, customer ID, or status." />
          <div className="module-filters single-row"><label className="filter-field span-full">Quotation search<input value={quoteSearch} onChange={(e) => setQuoteSearch(e.target.value)} placeholder="Search QTN number, quotation ID, customer name, customer ID, status..." /></label></div>
          <table>
            <thead><tr><th>Quotation</th><th>Customer</th><th>Status</th><th>Total</th><th></th></tr></thead>
            <tbody>
              {filteredQuotations.map((quotation) => (
                <tr key={quotation.id}>
                  <td>{quotation.quotationNumber || quotation.id}</td>
                  <td>{scoped.customers.find((customer) => customer.id === quotation.customerId)?.name}</td>
                  <td><Badge tone={quotation.status === 'Accepted' ? 'success' : quotation.status === 'Rejected' ? 'danger' : 'warning'}>{quotation.status}</Badge></td>
                  <td>{money(quotation.total)}</td>
                  <td><div className="row gap wrap"><button className="btn ghost small" onClick={() => setQuoteDetail({ ...quotation })}>Open</button><button className="btn small" onClick={() => convertQuotationToInvoice(quotation.id)}>To invoice</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="large-card">
          <SectionTitle title="Invoices & Payments" subtitle="Search invoices by invoice number, invoice ID, customer name, customer ID, status, or payment method." />
          <div className="module-filters single-row"><label className="filter-field span-full">Invoice search<input value={invoiceSearch} onChange={(e) => setInvoiceSearch(e.target.value)} placeholder="Search INV number, invoice ID, customer name, payment method, status..." /></label></div>
          <table>
            <thead><tr><th>Invoice</th><th>Customer</th><th>Status</th><th>Total</th><th></th></tr></thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.invoiceNumber || invoice.id}</td>
                  <td>{scoped.customers.find((customer) => customer.id === invoice.customerId)?.name}</td>
                  <td><Badge tone={invoice.isPaid || invoice.status === 'Paid' ? 'success' : 'warning'}>{invoice.isPaid || invoice.status === 'Paid' ? 'Paid' : 'Unpaid'}</Badge></td>
                  <td>{money(invoice.total)}</td>
                  <td><div className="row gap wrap"><button className="btn ghost small" onClick={() => setInvoiceDetail({ ...invoice })}>Open</button>{!(invoice.isPaid || invoice.status === 'Paid') ? <button className="btn small" onClick={() => setPaymentTarget(invoice)}>Record payment</button> : null}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Modal open={quoteOpen} onClose={() => setQuoteOpen(false)} title="Create quotation" subtitle="Sales module uses popups instead of direct inline forms." footer={<button className="btn primary" onClick={() => { addQuotation({ customerId: quoteForm.customerId, tax: Number(quoteForm.tax || 0), validUntil: quoteForm.validUntil, items: makeItems(quoteForm.productId, quoteForm.quantity) }); setQuoteOpen(false); }}>Save quotation</button>}>
        <div className="grid two balanced-grid">
          <label>Customer<select value={quoteForm.customerId} onChange={(e) => setQuoteForm({ ...quoteForm, customerId: e.target.value })}>{scoped.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
          <label>Product<select value={quoteForm.productId} onChange={(e) => setQuoteForm({ ...quoteForm, productId: e.target.value })}>{scoped.products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
          <label>Quantity<input type="number" value={quoteForm.quantity} onChange={(e) => setQuoteForm({ ...quoteForm, quantity: e.target.value })} /></label>
          <label>Tax amount<input type="number" value={quoteForm.tax} onChange={(e) => setQuoteForm({ ...quoteForm, tax: e.target.value })} /></label>
          <label className="span-2">Valid until<input type="date" value={quoteForm.validUntil} onChange={(e) => setQuoteForm({ ...quoteForm, validUntil: e.target.value })} /></label>
        </div>
      </Modal>

      <Modal open={invoiceOpen} onClose={() => setInvoiceOpen(false)} title="Create invoice" subtitle="Independent sales invoice with popup-based entry." footer={<button className="btn primary" onClick={() => { addInvoice({ customerId: invoiceForm.customerId, tax: Number(invoiceForm.tax || 0), dueDate: invoiceForm.dueDate, items: makeItems(invoiceForm.productId, invoiceForm.quantity) }); setInvoiceOpen(false); }}>Save invoice</button>}>
        <div className="grid two balanced-grid">
          <label>Customer<select value={invoiceForm.customerId} onChange={(e) => setInvoiceForm({ ...invoiceForm, customerId: e.target.value })}>{scoped.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
          <label>Product<select value={invoiceForm.productId} onChange={(e) => setInvoiceForm({ ...invoiceForm, productId: e.target.value })}>{scoped.products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
          <label>Quantity<input type="number" value={invoiceForm.quantity} onChange={(e) => setInvoiceForm({ ...invoiceForm, quantity: e.target.value })} /></label>
          <label>Tax amount<input type="number" value={invoiceForm.tax} onChange={(e) => setInvoiceForm({ ...invoiceForm, tax: e.target.value })} /></label>
          <label className="span-2">Due date<input type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} /></label>
        </div>
      </Modal>

      <Modal open={!!quoteDetail} onClose={() => setQuoteDetail(null)} title={quoteDetail?.quotationNumber || 'Quotation details'} subtitle="Review quotation data and update the current status." footer={<div className="row gap"><button className="btn ghost" onClick={() => quoteDetail && convertQuotationToInvoice(quoteDetail.id)}>Convert</button><button className="btn primary" onClick={() => { if (quoteDetail) updateQuotation(quoteDetail.id, quoteDetail); setQuoteDetail(null); }}>Save changes</button></div>}>
        {quoteDetail ? (
          <div className="stack">
            <div className="grid two balanced-grid">
              <label>Status<select value={quoteDetail.status} onChange={(e) => setQuoteDetail({ ...quoteDetail, status: e.target.value })}>{quotationStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
              <label>Valid until<input type="date" value={quoteDetail.validUntil || ''} onChange={(e) => setQuoteDetail({ ...quoteDetail, validUntil: e.target.value })} /></label>
            </div>
            <div className="inline-panel"><div className="section-title"><div><h3>Items</h3><p>Prepared for backend line items later</p></div></div><div className="stack">{quoteDetail.items.map((item, index) => { const product = scoped.products.find((productItem) => productItem.id === item.productId); return (<div key={`${item.productId}-${index}`} className="list-item emphasis-item"><div><strong>{product?.name}</strong><p>{item.quantity} × {money(item.price)}</p></div><div className="right-meta"><strong>{money(item.quantity * item.price)}</strong></div></div>); })}</div></div>
          </div>
        ) : null}
      </Modal>

      <Modal open={!!invoiceDetail} onClose={() => setInvoiceDetail(null)} title={invoiceDetail?.invoiceNumber || 'Invoice details'} subtitle="See payment state, due date, and line items." footer={<button className="btn primary" onClick={() => { if (invoiceDetail) updateInvoice(invoiceDetail.id, invoiceDetail); setInvoiceDetail(null); }}>Save changes</button>}>
        {invoiceDetail ? (
          <div className="stack">
            <div className="grid two balanced-grid">
              <label>Due date<input type="date" value={invoiceDetail.dueDate || ''} onChange={(e) => setInvoiceDetail({ ...invoiceDetail, dueDate: e.target.value })} /></label>
              <label>Payment status<input value={invoiceDetail.isPaid || invoiceDetail.status === 'Paid' ? 'Paid' : 'Unpaid'} disabled /></label>
            </div>
            <div className="inline-panel"><div className="section-title"><div><h3>Items</h3><p>Stock deduction is prepared to happen on payment only</p></div></div><div className="stack">{invoiceDetail.items.map((item, index) => { const product = scoped.products.find((productItem) => productItem.id === item.productId); return (<div key={`${item.productId}-${index}`} className="list-item emphasis-item"><div><strong>{product?.name}</strong><p>{item.quantity} × {money(item.price)}</p></div><div className="right-meta"><strong>{money(item.quantity * item.price)}</strong></div></div>); })}</div></div>
          </div>
        ) : null}
      </Modal>

      <Modal open={!!paymentTarget} onClose={() => setPaymentTarget(null)} title={paymentTarget?.invoiceNumber || 'Record payment'} subtitle="Once paid, invoice status changes and inventory is reduced by sold quantities." footer={<button className="btn primary" onClick={() => { if (paymentTarget) recordPayment(paymentTarget.id, paymentMethod, paymentNotes); setPaymentTarget(null); setPaymentMethod('Cash'); setPaymentNotes(''); }}>Confirm payment</button>}>
        <div className="stack">
          <label>Payment method<select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option>Cash</option><option>Bank Transfer</option><option>Instapay</option><option>Credit Card</option></select></label>
          <label>Payment notes<textarea rows="4" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} /></label>
        </div>
      </Modal>
    </Layout>
  );
}
