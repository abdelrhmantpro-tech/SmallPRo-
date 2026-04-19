import React, { useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { Card, SectionTitle, Badge, Modal } from '../components/UI';
import { useApp } from '../context/AppContext';
import { date, money } from '../utils/format';

const blankProduct = {
  code: '',
  name: '',
  category: 'General',
  supplierId: '',
  price: 0,
  cost: 0,
  quantity: 0,
  minStock: 5,
  unit: 'pcs',
  description: '',
};

const blankAdjustment = {
  quantityChange: 0,
  reason: 'Damaged items',
  notes: '',
  referenceNumber: 'ADJ-001',
};

export default function InventoryPage() {
  const {
    scoped,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    getProductReferences,
  } = useApp();

  const [view, setView] = useState('products');
  const [createOpen, setCreateOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [movementType, setMovementType] = useState('All');
  const [movementSearch, setMovementSearch] = useState('');
  const [movementFrom, setMovementFrom] = useState('');
  const [movementTo, setMovementTo] = useState('');
  const [form, setForm] = useState({ ...blankProduct, supplierId: scoped.suppliers[0]?.id || '' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustment, setAdjustment] = useState(blankAdjustment);

  const categories = useMemo(() => Array.from(new Set(scoped.products.map((product) => product.category).filter(Boolean))).sort(), [scoped.products]);
  const lowStockProducts = useMemo(() => scoped.products.filter((product) => Number(product.quantity) <= Number(product.minStock)), [scoped.products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped.products.filter((product) => {
      const supplier = scoped.suppliers.find((supplierItem) => supplierItem.id === product.supplierId);
      const matchesText = !q || [
        product.id,
        product.code,
        product.name,
        product.category,
        product.description,
        supplier?.id,
        supplier?.name,
      ].filter(Boolean).join(' ').toLowerCase().includes(q);
      const health = product.quantity <= product.minStock ? 'Low stock' : 'Healthy';
      const matchesStatus = statusFilter === 'All' || health === statusFilter;
      const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
      return matchesText && matchesStatus && matchesCategory;
    });
  }, [scoped.products, scoped.suppliers, search, statusFilter, categoryFilter]);

  const filteredMovements = useMemo(() => {
    const q = movementSearch.trim().toLowerCase();
    return scoped.movements.filter((move) => {
      const product = scoped.products.find((item) => item.id === move.productId);
      const matchesText = !q || [move.id, move.reference, move.notes, move.reason, move.type, product?.id, product?.code, product?.name, product?.category].filter(Boolean).join(' ').toLowerCase().includes(q);
      const matchesType = movementType === 'All' || move.type === movementType;
      const moveDate = move.date || move.movementDate || '';
      const matchesFrom = !movementFrom || moveDate >= movementFrom;
      const matchesTo = !movementTo || moveDate <= movementTo;
      return matchesText && matchesType && matchesFrom && matchesTo;
    });
  }, [scoped.movements, scoped.products, movementSearch, movementType, movementFrom, movementTo]);

  const saveNewProduct = () => {
    const res = addProduct({
      ...form,
      price: Number(form.price),
      cost: Number(form.cost),
      quantity: Number(form.quantity),
      minStock: Number(form.minStock),
    });
    if (res?.ok) {
      setCreateOpen(false);
      setForm({ ...blankProduct, supplierId: scoped.suppliers[0]?.id || '' });
    }
  };

  const saveProductChanges = () => {
    if (!selectedProduct) return;
    const res = updateProduct(selectedProduct.id, selectedProduct);
    if (res?.ok) setProductOpen(false);
  };

  const deleteSelectedProduct = () => {
    if (!selectedProduct) return;
    const res = deleteProduct(selectedProduct.id);
    if (res?.ok) setProductOpen(false);
  };

  const confirmAdjustment = () => {
    if (!selectedProduct) return;
    const res = adjustStock(
      selectedProduct.id,
      Number(adjustment.quantityChange),
      adjustment.reason,
      adjustment.notes || adjustment.reason,
      adjustment.referenceNumber,
    );
    if (res?.ok) {
      setAdjustOpen(false);
      setAdjustment(blankAdjustment);
    }
  };

  const openProduct = (product) => {
    setSelectedProduct({ ...product });
    setProductOpen(true);
  };

  return (
    <Layout
      title="Inventory"
      actions={
        <div className="row gap wrap">
          <button className={`btn ${view === 'products' ? 'primary' : 'ghost'}`} onClick={() => setView('products')}>Products</button>
          <button className={`btn ${view === 'movements' ? 'primary' : 'ghost'}`} onClick={() => setView('movements')}>Inventory movements</button>
          <button className="btn ghost" onClick={() => setCategoriesOpen(true)}>Get categories</button>
          <button className="btn primary" onClick={() => setCreateOpen(true)}>Add product</button>
        </div>
      }
    >
      {view === 'products' ? (
        <>
          <Card className="large-card">
            <SectionTitle title="Product & inventory management" subtitle="Search by product code, ID, category, supplier ID, supplier name, or any free text. Low-stock products open from the alert panel." />
            <div className="module-filters three-grid-filters">
              <label className="filter-field"><span>Product search</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by code, ID, category, supplier ID, or any letter..." /></label>
              <label className="filter-field"><span>Status</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option>All</option><option>Healthy</option><option>Low stock</option></select></label>
              <label className="filter-field"><span>Category</span><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option>All</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
            </div>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Supplier</th>
                  <th>Qty</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const supplier = scoped.suppliers.find((supplierItem) => supplierItem.id === product.supplierId);
                  return (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>{product.code}</td>
                      <td>
                        <strong>{product.name}</strong>
                        <div className="table-subtle">{product.description || 'No description'}</div>
                      </td>
                      <td>{product.category}</td>
                      <td>
                        <strong>{supplier?.name || 'No supplier'}</strong>
                        <div className="table-subtle">{supplier?.id || '-'}</div>
                      </td>
                      <td>{product.quantity} {product.unit || 'pcs'}</td>
                      <td>{product.quantity <= product.minStock ? <Badge tone="danger">Low stock</Badge> : <Badge tone="success">Healthy</Badge>}</td>
                      <td>
                        <div className="row gap wrap">
                          <button className="btn ghost small" onClick={() => openProduct(product)}>Open</button>
                          <button className="btn small" onClick={() => { setSelectedProduct(product); setAdjustment(blankAdjustment); setAdjustOpen(true); }}>Adjust</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <div className="grid two mt24 balanced-grid">
            <Card>
              <SectionTitle title="Low stock alerts" subtitle="Click any product to open its full product details." action={<Badge tone="danger">{lowStockProducts.length} alert(s)</Badge>} />
              <div className="stack">
                {lowStockProducts.length ? lowStockProducts.map((product) => (
                  <button key={product.id} className="interactive-list-item" onClick={() => openProduct(product)}>
                    <div>
                      <strong>{product.name}</strong>
                      <p>{product.code} • Min {product.minStock}</p>
                    </div>
                    <div className="right-meta">
                      <Badge tone="danger">{product.quantity}</Badge>
                    </div>
                  </button>
                )) : <div className="empty-inline">No low-stock products right now.</div>}
              </div>
            </Card>
            <Card>
              <SectionTitle title="Recent inventory movements" subtitle="Use the full Inventory movements view for type and date-range queries." action={<button className="btn ghost small" onClick={() => setView('movements')}>Open full list</button>} />
              <div className="stack">
                {scoped.movements.slice(0, 8).map((move) => {
                  const product = scoped.products.find((item) => item.id === move.productId);
                  return (
                    <div key={move.id} className="list-item emphasis-item">
                      <div>
                        <strong>{move.reference}</strong>
                        <p>{product?.name} • {move.reason || move.notes}</p>
                      </div>
                      <div className="right-meta">
                        <Badge tone={move.type === 'Purchase' ? 'success' : move.type === 'Sale' ? 'warning' : 'danger'}>{move.type}</Badge>
                        <strong>{move.quantity}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </>
      ) : (
        <Card className="large-card">
          <SectionTitle title="Inventory movements" subtitle="Dedicated movement explorer with get-by-type and get-by-date-range filters." />
          <div className="module-filters movement-grid-filters">
            <label className="filter-field"><span>Search</span><input value={movementSearch} onChange={(e) => setMovementSearch(e.target.value)} placeholder="Search by product, reference, reason, code, or ID..." /></label>
            <label className="filter-field"><span>Type</span><select value={movementType} onChange={(e) => setMovementType(e.target.value)}><option>All</option><option>Purchase</option><option>Sale</option><option>Adjustment</option></select></label>
            <label className="filter-field"><span>From</span><input type="date" value={movementFrom} onChange={(e) => setMovementFrom(e.target.value)} /></label>
            <label className="filter-field"><span>To</span><input type="date" value={movementTo} onChange={(e) => setMovementTo(e.target.value)} /></label>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Product</th>
                <th>Reference</th>
                <th>Qty</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map((move) => {
                const product = scoped.products.find((item) => item.id === move.productId);
                return (
                  <tr key={move.id}>
                    <td>{date(move.date || move.movementDate)}</td>
                    <td><Badge tone={move.type === 'Purchase' ? 'success' : move.type === 'Sale' ? 'warning' : 'danger'}>{move.type}</Badge></td>
                    <td>
                      <strong>{product?.name}</strong>
                      <div className="table-subtle">{product?.code} • {product?.id}</div>
                    </td>
                    <td>{move.reference}</td>
                    <td>{move.quantity}</td>
                    <td>{move.reason || move.notes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add product"
        subtitle="Matches the documented product structure including description, prices, quantity, category, supplier, and low-stock threshold."
        footer={<button className="btn primary" onClick={saveNewProduct}>Save product</button>}
      >
        <div className="grid two balanced-grid">
          <label>ID<input value="Auto generated" disabled /></label>
          <label>Code<input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="PRD-001" /></label>
          <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Category<input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>
          <label>Supplier<select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>{scoped.suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name} ({supplier.id})</option>)}</select></label>
          <label>Unit<input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></label>
          <label>Selling price<input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
          <label>Purchase price<input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></label>
          <label>Opening quantity<input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></label>
          <label>Minimum stock<input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} /></label>
          <label className="span-2">Description<textarea rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Product description" /></label>
        </div>
      </Modal>

      <Modal
        open={productOpen}
        onClose={() => setProductOpen(false)}
        title={selectedProduct?.name || 'Product details'}
        subtitle="Product ID is locked during update. Quantity edits happen only through Adjust stock to preserve inventory movement history."
        footer={
          <div className="row gap wrap">
            <button className="btn danger" onClick={deleteSelectedProduct}>Delete</button>
            <button className="btn primary" onClick={saveProductChanges}>Save changes</button>
          </div>
        }
      >
        {selectedProduct ? (() => {
          const refs = getProductReferences(selectedProduct.id);
          const supplier = scoped.suppliers.find((item) => item.id === selectedProduct.supplierId);
          return (
            <div className="stack">
              <div className="grid two balanced-grid">
                <label>ID<input value={selectedProduct.id} disabled /></label>
                <label>Created at<input value={selectedProduct.createdAt || ''} disabled /></label>
                <label>Code<input value={selectedProduct.code} onChange={(e) => setSelectedProduct({ ...selectedProduct, code: e.target.value })} /></label>
                <label>Name<input value={selectedProduct.name} onChange={(e) => setSelectedProduct({ ...selectedProduct, name: e.target.value })} /></label>
                <label>Category<input value={selectedProduct.category} onChange={(e) => setSelectedProduct({ ...selectedProduct, category: e.target.value })} /></label>
                <label>Supplier<select value={selectedProduct.supplierId} onChange={(e) => setSelectedProduct({ ...selectedProduct, supplierId: e.target.value })}>{scoped.suppliers.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.id})</option>)}</select></label>
                <label>Selling price<input type="number" value={selectedProduct.price} onChange={(e) => setSelectedProduct({ ...selectedProduct, price: Number(e.target.value) })} /></label>
                <label>Purchase price<input type="number" value={selectedProduct.cost} onChange={(e) => setSelectedProduct({ ...selectedProduct, cost: Number(e.target.value) })} /></label>
                <label>Quantity<input type="number" value={selectedProduct.quantity} disabled /></label>
                <label>Minimum stock<input type="number" value={selectedProduct.minStock} onChange={(e) => setSelectedProduct({ ...selectedProduct, minStock: Number(e.target.value) })} /></label>
                <label>Unit<input value={selectedProduct.unit || ''} onChange={(e) => setSelectedProduct({ ...selectedProduct, unit: e.target.value })} /></label>
                <label>Supplier details<input value={supplier ? `${supplier.name} • ${supplier.id}` : 'No supplier'} disabled /></label>
                <label className="span-2">Description<textarea rows="4" value={selectedProduct.description || ''} onChange={(e) => setSelectedProduct({ ...selectedProduct, description: e.target.value })} /></label>
              </div>
              <div className="summary-grid three-column-summary">
                <div className="summary-box"><span>Quotation refs</span><strong>{refs.quotationCount}</strong></div>
                <div className="summary-box"><span>Invoice refs</span><strong>{refs.invoiceCount}</strong></div>
                <div className="summary-box"><span>PO / Movement refs</span><strong>{refs.poCount + refs.movementCount}</strong></div>
              </div>
            </div>
          );
        })() : null}
      </Modal>

      <Modal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title={selectedProduct ? `Adjust stock for ${selectedProduct.name}` : 'Adjust stock'}
        subtitle="Adjustment creates a dedicated inventory movement with type = Adjustment and the selected reason."
        footer={<button className="btn primary" onClick={confirmAdjustment}>Confirm adjustment</button>}
      >
        <div className="stack">
          <label>Quantity change<input type="number" value={adjustment.quantityChange} onChange={(e) => setAdjustment({ ...adjustment, quantityChange: e.target.value })} /></label>
          <label>Reason<select value={adjustment.reason} onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })}><option>Damaged items</option><option>Manual correction</option><option>Returned to stock</option><option>Stock count reconciliation</option><option>Lost / missing items</option></select></label>
          <label>Reference number<input value={adjustment.referenceNumber} onChange={(e) => setAdjustment({ ...adjustment, referenceNumber: e.target.value })} /></label>
          <label>Notes<textarea rows="4" value={adjustment.notes} onChange={(e) => setAdjustment({ ...adjustment, notes: e.target.value })} placeholder="Explain the adjustment details" /></label>
        </div>
      </Modal>

      <Modal
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
        title="All categories"
        subtitle="Click any category to filter the product table instantly."
      >
        <div className="stack">
          {categories.map((category) => (
            <button key={category} className="interactive-list-item" onClick={() => { setCategoryFilter(category); setCategoriesOpen(false); setView('products'); }}>
              <div><strong>{category}</strong><p>{scoped.products.filter((product) => product.category === category).length} product(s)</p></div>
              <Badge>{category}</Badge>
            </button>
          ))}
          <button className="btn ghost" onClick={() => { setCategoryFilter('All'); setCategoriesOpen(false); }}>Clear category filter</button>
        </div>
      </Modal>
    </Layout>
  );
}
