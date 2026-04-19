import React, { useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { Card, SectionTitle, Modal, Badge } from '../components/UI';
import { useApp } from '../context/AppContext';
import { date, money } from '../utils/format';

const blankSupplier = { name: '', email: '', phone: '', address: '' };
const blankItem = { productId: '', quantity: 1, cost: 0 };

const createPoForm = (products = [], suppliers = []) => ({
  supplierId: suppliers[0]?.id || '',
  orderDate: new Date().toISOString().slice(0, 10),
  notes: '',
  items: products[0] ? [{ productId: products[0].id, quantity: 1, cost: Number(products[0].cost || 0) }] : [],
});

export default function PurchasePage() {
  const {
    scoped,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    sendPurchaseOrder,
    receivePurchaseOrder,
    getSupplierReferences,
    pushNotification,
  } = useApp();

  const [supplierOpen, setSupplierOpen] = useState(false);
  const [supplierDetail, setSupplierDetail] = useState(null);
  const [poOpen, setPoOpen] = useState(false);
  const [poDetail, setPoDetail] = useState(null);
  const [documentOpen, setDocumentOpen] = useState(false);
  const [documentPO, setDocumentPO] = useState(null);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [poSearch, setPoSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [supplier, setSupplier] = useState(blankSupplier);
  const [poForm, setPoForm] = useState(() => createPoForm(scoped.products, scoped.suppliers));
  const [receiveNotes, setReceiveNotes] = useState('');

  const filteredSuppliers = useMemo(() => {
    const q = supplierSearch.trim().toLowerCase();
    return scoped.suppliers.filter((item) => !q || [item.id, item.name, item.email, item.phone, item.address].filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [scoped.suppliers, supplierSearch]);

  const filteredPOs = useMemo(() => {
    const q = poSearch.trim().toLowerCase();
    return scoped.purchaseOrders.filter((item) => {
      const supplierItem = scoped.suppliers.find((supplierRow) => supplierRow.id === item.supplierId);
      const matchesStatus = statusFilter === 'All' || (statusFilter === 'Pending' ? item.status === 'Sent' : item.status === statusFilter);
      const matchesSearch = !q || [item.id, item.poNumber, item.status, item.supplierId, supplierItem?.name, item.notes].filter(Boolean).join(' ').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [scoped.purchaseOrders, scoped.suppliers, poSearch, statusFilter]);

  const hydratePoItems = (items = []) => items.map((item) => {
    const product = scoped.products.find((productRow) => productRow.id === item.productId);
    return { ...item, cost: Number(item.cost ?? product?.cost ?? 0) };
  });

  const poTotal = (items = []) => items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.cost || 0), 0);

  const updatePoFormItem = (index, key, value) => {
    const next = poForm.items.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      if (key === 'productId') {
        const product = scoped.products.find((productRow) => productRow.id === value);
        return { ...item, productId: value, cost: Number(product?.cost || item.cost || 0) };
      }
      return { ...item, [key]: value };
    });
    setPoForm({ ...poForm, items: next });
  };

  const updatePoDetailItem = (index, key, value) => {
    if (!poDetail) return;
    const next = poDetail.items.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      if (key === 'productId') {
        const product = scoped.products.find((productRow) => productRow.id === value);
        return { ...item, productId: value, cost: Number(product?.cost || item.cost || 0) };
      }
      return { ...item, [key]: value };
    });
    setPoDetail({ ...poDetail, items: next, total: poTotal(next) });
  };

  const addPoLine = () => {
    setPoForm({ ...poForm, items: [...poForm.items, { ...blankItem, productId: scoped.products[0]?.id || '', cost: Number(scoped.products[0]?.cost || 0) }] });
  };

  const addPoDetailLine = () => {
    if (!poDetail) return;
    const nextItems = [...poDetail.items, { ...blankItem, productId: scoped.products[0]?.id || '', cost: Number(scoped.products[0]?.cost || 0) }];
    setPoDetail({ ...poDetail, items: nextItems, total: poTotal(nextItems) });
  };

  const saveSupplier = () => {
    const res = addSupplier(supplier);
    if (res?.ok) {
      setSupplier(blankSupplier);
      setSupplierOpen(false);
    }
  };

  const saveSupplierChanges = () => {
    if (!supplierDetail) return;
    updateSupplier(supplierDetail.id, supplierDetail);
    setSupplierDetail(null);
  };

  const removeSupplier = () => {
    if (!supplierDetail) return;
    const res = deleteSupplier(supplierDetail.id);
    if (res?.ok) setSupplierDetail(null);
  };

  const createPurchaseOrder = () => {
    const res = addPurchaseOrder({
      supplierId: poForm.supplierId,
      orderDate: poForm.orderDate,
      notes: poForm.notes,
      items: poForm.items,
    });
    if (res?.ok) {
      setPoOpen(false);
      setPoForm(createPoForm(scoped.products, scoped.suppliers));
    }
  };

  const openPoDetail = (item) => {
    setPoDetail({ ...item, items: hydratePoItems(item.items), orderDate: item.orderDate || item.date || '', notes: item.notes || '' });
    setReceiveNotes(item.notes || '');
  };

  const savePoChanges = () => {
    if (!poDetail) return;
    const res = updatePurchaseOrder(poDetail.id, { ...poDetail, items: poDetail.items, notes: poDetail.notes, orderDate: poDetail.orderDate });
    if (res?.ok) setPoDetail(null);
  };

  const removePurchaseOrder = () => {
    if (!poDetail) return;
    const res = deletePurchaseOrder(poDetail.id);
    if (res?.ok) setPoDetail(null);
  };

  const sendPo = (poId) => {
    const res = sendPurchaseOrder(poId);
    if (res?.ok && poDetail?.id === poId) setPoDetail(null);
  };

  const receivePo = (poId) => {
    const res = receivePurchaseOrder(poId, receiveNotes);
    if (res?.ok) setPoDetail(null);
  };

  const openDocumentPreview = (po) => {
    if (po.status !== 'Draft') {
      pushNotification('Document blocked', 'Supplier document can be generated only while the purchase order is still Draft.', 'danger');
      return;
    }
    setDocumentPO(po);
    setDocumentOpen(true);
  };

  const getSupplierForPo = (po) => scoped.suppliers.find((supplierItem) => supplierItem.id === po.supplierId);

  const actions = (
    <div className="row gap wrap">
      <button className={`btn ${statusFilter === 'Pending' ? 'primary' : 'ghost'}`} onClick={() => setStatusFilter(statusFilter === 'Pending' ? 'All' : 'Pending')}>Get pending</button>
      <button className="btn ghost" onClick={() => setSupplierOpen(true)}>Add supplier</button>
      <button className="btn primary" onClick={() => setPoOpen(true)}>Create PO</button>
    </div>
  );

  return (
    <Layout title="Purchase" actions={actions}>
      <div className="grid two balanced-grid">
        <Card className="large-card">
          <SectionTitle title="Suppliers" subtitle="Search suppliers by supplier ID or any letter. Open any supplier to see full details, product count, purchase-order count, and created date." />
          <div className="module-filters single-row"><label className="filter-field span-full">Supplier search<input value={supplierSearch} onChange={(e) => setSupplierSearch(e.target.value)} placeholder="Search supplier ID, name, email, phone, address..." /></label></div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Supplier</th>
                <th>Products</th>
                <th>Order count</th>
                <th>Created at</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((item) => {
                const refs = getSupplierReferences(item.id);
                return (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>
                      <strong>{item.name}</strong>
                      <div className="table-subtle">{item.email}</div>
                    </td>
                    <td>{refs.productCount}</td>
                    <td>{refs.purchaseOrderCount}</td>
                    <td>{date(item.createdAt)}</td>
                    <td><button className="btn ghost small" onClick={() => setSupplierDetail({ ...item })}>Open</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <Card className="large-card">
          <SectionTitle title="Purchase orders" subtitle="Search by PO number, PO ID, supplier name, supplier ID, status, or notes. Pending means Sent but not Received." action={<div className="row gap wrap"><Badge>{filteredPOs.length} result(s)</Badge><select className="inline-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option>All</option><option>Draft</option><option>Sent</option><option>Received</option><option>Pending</option></select></div>} />
          <div className="module-filters single-row"><label className="filter-field span-full">Purchase order search<input value={poSearch} onChange={(e) => setPoSearch(e.target.value)} placeholder="Search PO number, PO ID, supplier name, supplier ID, status, or notes..." /></label></div>
          <table>
            <thead><tr><th>PO</th><th>Supplier</th><th>Status</th><th>Total</th><th>Order date</th><th></th></tr></thead>
            <tbody>
              {filteredPOs.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.poNumber || item.id}</strong>
                    <div className="table-subtle">{item.id}</div>
                  </td>
                  <td>{getSupplierForPo(item)?.name}</td>
                  <td><Badge tone={item.status === 'Received' ? 'success' : item.status === 'Sent' ? 'warning' : 'default'}>{item.status}</Badge></td>
                  <td>{money(item.total)}</td>
                  <td>{date(item.orderDate || item.date)}</td>
                  <td>
                    <div className="row gap wrap">
                      <button className="btn ghost small" onClick={() => openPoDetail(item)}>Open</button>
                      {item.status === 'Draft' ? <button className="btn small" onClick={() => sendPo(item.id)}>Send</button> : null}
                      {item.status === 'Sent' ? <button className="btn small" onClick={() => receivePurchaseOrder(item.id, item.notes || '')}>Receive</button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Modal open={supplierOpen} onClose={() => setSupplierOpen(false)} title="Add supplier" subtitle="Create supplier with the same documented fields: name, email, phone, and address." footer={<button className="btn primary" onClick={saveSupplier}>Save supplier</button>}>
        <div className="grid two balanced-grid">
          <label>ID<input value="Auto generated" disabled /></label>
          <label>Created at<input value={new Date().toISOString().slice(0, 10)} disabled /></label>
          <label>Name<input value={supplier.name} onChange={(e) => setSupplier({ ...supplier, name: e.target.value })} /></label>
          <label>Email<input value={supplier.email} onChange={(e) => setSupplier({ ...supplier, email: e.target.value })} /></label>
          <label>Phone<input value={supplier.phone} onChange={(e) => setSupplier({ ...supplier, phone: e.target.value })} /></label>
          <label>Address<input value={supplier.address} onChange={(e) => setSupplier({ ...supplier, address: e.target.value })} /></label>
        </div>
      </Modal>

      <Modal open={!!supplierDetail} onClose={() => setSupplierDetail(null)} title={supplierDetail?.name || 'Supplier details'} subtitle="Full supplier inquiry with counts, purchase orders, and linked products." footer={<div className="row gap wrap"><button className="btn danger" onClick={removeSupplier}>Delete</button><button className="btn primary" onClick={saveSupplierChanges}>Save changes</button></div>}>
        {supplierDetail ? (() => {
          const refs = getSupplierReferences(supplierDetail.id);
          const linkedProducts = scoped.products.filter((item) => item.supplierId === supplierDetail.id);
          const linkedOrders = scoped.purchaseOrders.filter((item) => item.supplierId === supplierDetail.id);
          return (
            <div className="stack">
              <div className="grid two balanced-grid">
                <label>ID<input value={supplierDetail.id} disabled /></label>
                <label>Created at<input value={supplierDetail.createdAt || ''} disabled /></label>
                <label>Name<input value={supplierDetail.name} onChange={(e) => setSupplierDetail({ ...supplierDetail, name: e.target.value })} /></label>
                <label>Email<input value={supplierDetail.email} onChange={(e) => setSupplierDetail({ ...supplierDetail, email: e.target.value })} /></label>
                <label>Phone<input value={supplierDetail.phone} onChange={(e) => setSupplierDetail({ ...supplierDetail, phone: e.target.value })} /></label>
                <label>Address<input value={supplierDetail.address} onChange={(e) => setSupplierDetail({ ...supplierDetail, address: e.target.value })} /></label>
              </div>
              <div className="summary-grid three-column-summary">
                <div className="summary-box"><span>Product count</span><strong>{refs.productCount}</strong></div>
                <div className="summary-box"><span>Purchase orders</span><strong>{refs.purchaseOrderCount}</strong></div>
                <div className="summary-box"><span>Active role</span><strong>{refs.total > 0 ? 'Linked' : 'Free'}</strong></div>
              </div>
              <div className="grid two balanced-grid">
                <Card>
                  <SectionTitle title="Linked products" subtitle="All products using this supplier." />
                  <div className="stack small-stack">
                    {linkedProducts.length ? linkedProducts.map((item) => <div className="list-item emphasis-item" key={item.id}><div><strong>{item.name}</strong><p>{item.code} • {item.category}</p></div><div className="right-meta"><strong>{item.quantity}</strong></div></div>) : <div className="empty-inline">No products linked.</div>}
                  </div>
                </Card>
                <Card>
                  <SectionTitle title="Purchase orders" subtitle="Complete inquiry for this supplier." />
                  <div className="stack small-stack">
                    {linkedOrders.length ? linkedOrders.map((item) => <div className="list-item emphasis-item" key={item.id}><div><strong>{item.poNumber || item.id}</strong><p>{date(item.orderDate || item.date)} • {item.notes || 'No notes'}</p></div><div className="right-meta"><Badge tone={item.status === 'Received' ? 'success' : item.status === 'Sent' ? 'warning' : 'default'}>{item.status}</Badge></div></div>) : <div className="empty-inline">No purchase orders linked.</div>}
                  </div>
                </Card>
              </div>
            </div>
          );
        })() : null}
      </Modal>

      <Modal open={poOpen} onClose={() => setPoOpen(false)} title="Create purchase order" subtitle="Draft-only creation with supplier, order date, notes, and detailed item lines." footer={<button className="btn primary" onClick={createPurchaseOrder}>Create draft PO</button>}>
        <div className="stack">
          <div className="grid two balanced-grid">
            <label>Supplier<select value={poForm.supplierId} onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}>{scoped.suppliers.map((supplierItem) => <option key={supplierItem.id} value={supplierItem.id}>{supplierItem.name} ({supplierItem.id})</option>)}</select></label>
            <label>Order date<input type="date" value={poForm.orderDate} onChange={(e) => setPoForm({ ...poForm, orderDate: e.target.value })} /></label>
            <label className="span-2">Notes<textarea rows="3" value={poForm.notes} onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })} placeholder="Prepared notes for supplier / receiving" /></label>
          </div>
          <div className="inline-panel">
            <div className="section-title"><div><h3>Items</h3><p>Every line includes product, quantity, purchase price, and line total.</p></div><button className="btn ghost small" onClick={addPoLine}>Add line</button></div>
            <div className="stack small-stack">
              {poForm.items.map((item, index) => {
                const product = scoped.products.find((productRow) => productRow.id === item.productId);
                return (
                  <div className="po-item-grid" key={`${item.productId}-${index}`}>
                    <label>Product<select value={item.productId} onChange={(e) => updatePoFormItem(index, 'productId', e.target.value)}>{scoped.products.map((productRow) => <option key={productRow.id} value={productRow.id}>{productRow.code} - {productRow.name}</option>)}</select></label>
                    <label>Quantity<input type="number" value={item.quantity} onChange={(e) => updatePoFormItem(index, 'quantity', Number(e.target.value))} /></label>
                    <label>Unit price<input type="number" value={item.cost} onChange={(e) => updatePoFormItem(index, 'cost', Number(e.target.value))} /></label>
                    <div className="line-total-box"><span>Line total</span><strong>{money(Number(item.quantity) * Number(item.cost))}</strong><small>{product?.name}</small></div>
                  </div>
                );
              })}
            </div>
            <div className="doc-total-row"><span>Total</span><strong>{money(poTotal(poForm.items))}</strong></div>
          </div>
        </div>
      </Modal>

      <Modal open={!!poDetail} onClose={() => setPoDetail(null)} title={poDetail?.poNumber || 'Purchase order details'} subtitle="Update works only while status is Draft. Sent and Received orders are protected and show notification if you try to update or delete them." footer={<div className="row gap wrap">{poDetail?.status === 'Draft' ? <button className="btn ghost" onClick={() => openDocumentPreview(poDetail)}>Supplier document</button> : null}{poDetail?.status === 'Draft' ? <button className="btn ghost" onClick={() => sendPo(poDetail.id)}>Send PO</button> : null}{poDetail?.status === 'Sent' ? <button className="btn ghost" onClick={() => receivePo(poDetail.id)}>Receive PO</button> : null}<button className="btn danger" onClick={removePurchaseOrder}>Delete</button><button className="btn primary" onClick={savePoChanges}>Save changes</button></div>}>
        {poDetail ? (
          <div className="stack">
            <div className="grid two balanced-grid">
              <label>PO ID<input value={poDetail.id} disabled /></label>
              <label>PO Number<input value={poDetail.poNumber || poDetail.id} disabled /></label>
              <label>Status<input value={poDetail.status} disabled /></label>
              <label>Supplier<select value={poDetail.supplierId} onChange={(e) => setPoDetail({ ...poDetail, supplierId: e.target.value })} disabled={poDetail.status !== 'Draft'}>{scoped.suppliers.map((supplierItem) => <option key={supplierItem.id} value={supplierItem.id}>{supplierItem.name} ({supplierItem.id})</option>)}</select></label>
              <label>Order date<input type="date" value={poDetail.orderDate || ''} onChange={(e) => setPoDetail({ ...poDetail, orderDate: e.target.value })} disabled={poDetail.status !== 'Draft'} /></label>
              <label>Received date<input value={poDetail.receivedDate || ''} disabled /></label>
              <label className="span-2">Notes<textarea rows="3" value={poDetail.notes || ''} onChange={(e) => { setPoDetail({ ...poDetail, notes: e.target.value }); setReceiveNotes(e.target.value); }} placeholder="PO notes / receiving notes" /></label>
            </div>
            {poDetail.status === 'Sent' ? <label>Receiving notes<textarea rows="3" value={receiveNotes} onChange={(e) => setReceiveNotes(e.target.value)} placeholder="Notes that will be saved when receiving this PO" /></label> : null}
            <div className="inline-panel">
              <div className="section-title"><div><h3>Items details</h3><p>All item and product details are returned exactly in the popup.</p></div>{poDetail.status === 'Draft' ? <button className="btn ghost small" onClick={addPoDetailLine}>Add line</button> : null}</div>
              <div className="stack small-stack">
                {poDetail.items.map((item, index) => {
                  const product = scoped.products.find((productRow) => productRow.id === item.productId);
                  return (
                    <div className="po-item-grid detail-grid" key={`${item.productId}-${index}`}>
                      <label>Product<select value={item.productId} onChange={(e) => updatePoDetailItem(index, 'productId', e.target.value)} disabled={poDetail.status !== 'Draft'}>{scoped.products.map((productRow) => <option key={productRow.id} value={productRow.id}>{productRow.code} - {productRow.name}</option>)}</select></label>
                      <label>Qty<input type="number" value={item.quantity} onChange={(e) => updatePoDetailItem(index, 'quantity', Number(e.target.value))} disabled={poDetail.status !== 'Draft'} /></label>
                      <label>Unit price<input type="number" value={item.cost} onChange={(e) => updatePoDetailItem(index, 'cost', Number(e.target.value))} disabled={poDetail.status !== 'Draft'} /></label>
                      <div className="line-total-box"><span>Line total</span><strong>{money(Number(item.quantity) * Number(item.cost))}</strong><small>{product?.id} • {product?.category}</small></div>
                    </div>
                  );
                })}
              </div>
              <div className="doc-total-row"><span>Total amount</span><strong>{money(poTotal(poDetail.items))}</strong></div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={documentOpen} onClose={() => setDocumentOpen(false)} title={documentPO ? `Supplier document — ${documentPO.poNumber}` : 'Supplier document'} subtitle="Beautiful printable draft document prepared for the supplier. If the PO is already sent, document generation is blocked." footer={<div className="row gap wrap"><button className="btn ghost" onClick={() => window.print()}>Print</button><button className="btn primary" onClick={() => setDocumentOpen(false)}>Done</button></div>}>
        {documentPO ? (() => {
          const supplierItem = getSupplierForPo(documentPO);
          return (
            <div className="supplier-document">
              <div className="doc-header">
                <div>
                  <span className="doc-kicker">Draft purchase order</span>
                  <h2>{documentPO.poNumber}</h2>
                  <p>Prepared for supplier dispatch in a clean formatted document.</p>
                </div>
                <Badge>{documentPO.status}</Badge>
              </div>
              <div className="summary-grid two-column-summary">
                <div className="summary-box"><span>Supplier</span><strong>{supplierItem?.name}</strong><small>{supplierItem?.email}</small></div>
                <div className="summary-box"><span>Supplier ID</span><strong>{supplierItem?.id}</strong><small>{supplierItem?.phone}</small></div>
                <div className="summary-box"><span>Order date</span><strong>{date(documentPO.orderDate || documentPO.date)}</strong><small>{supplierItem?.address}</small></div>
                <div className="summary-box"><span>Status</span><strong>{documentPO.status}</strong><small>{documentPO.notes || 'No notes'}</small></div>
              </div>
              <table>
                <thead><tr><th>Product ID</th><th>Code</th><th>Name</th><th>Qty</th><th>Unit price</th><th>Line total</th></tr></thead>
                <tbody>
                  {documentPO.items.map((item, index) => {
                    const product = scoped.products.find((productRow) => productRow.id === item.productId);
                    return (
                      <tr key={`${item.productId}-${index}`}>
                        <td>{product?.id}</td>
                        <td>{product?.code}</td>
                        <td>{product?.name}</td>
                        <td>{item.quantity}</td>
                        <td>{money(item.cost)}</td>
                        <td>{money(Number(item.quantity) * Number(item.cost))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="doc-total-row"><span>Total amount</span><strong>{money(poTotal(documentPO.items))}</strong></div>
            </div>
          );
        })() : null}
      </Modal>
    </Layout>
  );
}
