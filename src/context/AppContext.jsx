import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { seedData } from '../data/seed';
import { id, today } from '../utils/format';

const AppContext = createContext(null);
const STORAGE_KEY = 'smallpro-erp-state-v6';
const AUTH_KEY = 'smallpro-erp-auth-v6';
const THEME_KEY = 'smallpro-erp-theme-v3';
const DASHBOARD_KEY = 'smallpro-erp-dashboard-view-v2';

const loadJSON = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};

const slugify = (value = '') => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 22) || `tenant-${Math.random().toString(36).slice(2, 8)}`;
const normalizeNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const toRoleName = (value) => ({ 1: 'Admin', 2: 'Manager', 3: 'Salesperson', 4: 'Inventory Manager', Admin: 'Admin', Manager: 'Manager', Salesperson: 'Salesperson', 'Inventory Manager': 'Inventory Manager' }[value] || 'Salesperson');

export function AppProvider({ children }) {
  const [state, setState] = useState(() => loadJSON(STORAGE_KEY, seedData));
  const [currentUser, setCurrentUser] = useState(() => loadJSON(AUTH_KEY, null));
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light');
  const [dashboardView, setDashboardView] = useState(() => localStorage.getItem(DASHBOARD_KEY) || 'overview');
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Presentation demo ready', message: 'ERP flow prepared from your own modules and business rules.', tone: 'success' },
  ]);

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(state)), [state]);
  useEffect(() => localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser)), [currentUser]);
  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => localStorage.setItem(DASHBOARD_KEY, dashboardView), [dashboardView]);

  const tenantId = currentUser?.tenantId;
  const scoped = useMemo(() => {
    if (!tenantId) return state;
    const scopedFilter = (arr) => arr.filter((item) => item.tenantId === tenantId);
    return {
      ...state,
      users: scopedFilter(state.users),
      customers: scopedFilter(state.customers),
      interactions: scopedFilter(state.interactions),
      suppliers: scopedFilter(state.suppliers),
      products: scopedFilter(state.products),
      quotations: scopedFilter(state.quotations),
      invoices: scopedFilter(state.invoices),
      purchaseOrders: scopedFilter(state.purchaseOrders),
      movements: scopedFilter(state.movements),
      aiInsights: scopedFilter(state.aiInsights),
      ocrResults: scopedFilter(state.ocrResults),
    };
  }, [state, tenantId]);

  const pushNotification = (title, message, tone = 'default') => {
    setNotifications((prev) => [{ id: Date.now() + Math.random(), title, message, tone }, ...prev].slice(0, 6));
  };

  const removeNotification = (notificationId) => setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
  const saveCollection = (key, items) => setState((prev) => ({ ...prev, [key]: items }));

  const getSupplierById = (supplierId) => state.suppliers.find((supplier) => supplier.id === supplierId);
  const getProductById = (productId) => state.products.find((product) => product.id === productId);

  const getProductReferences = (productId) => {
    const quotationCount = state.quotations.filter((quotation) => quotation.items?.some((item) => item.productId === productId)).length;
    const invoiceCount = state.invoices.filter((invoice) => invoice.items?.some((item) => item.productId === productId)).length;
    const poCount = state.purchaseOrders.filter((po) => po.items?.some((item) => item.productId === productId)).length;
    const movementCount = state.movements.filter((movement) => movement.productId === productId).length;
    return { quotationCount, invoiceCount, poCount, movementCount, total: quotationCount + invoiceCount + poCount + movementCount };
  };

  const getSupplierReferences = (supplierId) => {
    const productCount = state.products.filter((product) => product.supplierId === supplierId).length;
    const purchaseOrderCount = state.purchaseOrders.filter((po) => po.supplierId === supplierId).length;
    return { productCount, purchaseOrderCount, total: productCount + purchaseOrderCount };
  };

  const sanitizeUser = (user) => ({ ...user, name: user.fullName || user.name, fullName: user.fullName || user.name, role: toRoleName(user.role) });

  const login = (identifier, password) => {
    const identity = String(identifier || '').trim().toLowerCase();
    const user = state.users.find((u) => {
      const email = String(u.email || '').toLowerCase();
      const username = String(u.username || '').toLowerCase();
      return (email === identity || username === identity) && u.password === password;
    });
    if (!user) return { ok: false, message: 'Invalid email/username or password.' };
    const hydrated = sanitizeUser(user);
    setCurrentUser(hydrated);
    pushNotification('Welcome back', `${hydrated.fullName || hydrated.name} signed in successfully.`, 'success');
    return { ok: true, user: hydrated };
  };

  const logout = () => {
    setCurrentUser(null);
    pushNotification('Signed out', 'Session closed successfully.', 'default');
  };

  const resetDemo = () => {
    setState(seedData);
    setCurrentUser(null);
    setDashboardView('overview');
    pushNotification('Demo reset', 'All sample data returned to its original state.', 'warning');
  };

  const registerTenant = (payload) => {
    const companyEmail = String(payload.companyEmail || '').trim().toLowerCase();
    const adminEmail = String(payload.adminEmail || '').trim().toLowerCase();
    const adminUsername = String(payload.adminUsername || '').trim().toLowerCase();
    if (!payload.companyName || !companyEmail || !payload.companyPhone || !adminUsername || !adminEmail || !payload.adminPassword || !payload.adminFullName) {
      return { ok: false, message: 'Please complete all tenant registration fields.' };
    }
    if (state.tenants.some((tenant) => String(tenant.email || '').toLowerCase() === companyEmail)) {
      pushNotification('Registration blocked', 'Company email must be unique across tenants.', 'danger');
      return { ok: false, message: 'Company email already exists.' };
    }
    if (state.users.some((user) => String(user.email || '').toLowerCase() === adminEmail)) {
      pushNotification('Registration blocked', 'Admin email must be unique.', 'danger');
      return { ok: false, message: 'Admin email already exists.' };
    }
    if (state.users.some((user) => String(user.username || '').toLowerCase() === adminUsername)) {
      pushNotification('Registration blocked', 'Admin username must be unique.', 'danger');
      return { ok: false, message: 'Admin username already exists.' };
    }

    const newTenantId = slugify(payload.companyName);
    const tenant = {
      id: newTenantId,
      tenantId: newTenantId,
      name: payload.companyName,
      companyName: payload.companyName,
      email: payload.companyEmail,
      phone: payload.companyPhone,
      status: 'Active',
      plan: payload.plan || 'Professional',
      subscriptionStartDate: today(),
      createdAt: today(),
    };
    const admin = sanitizeUser({
      id: Date.now(),
      tenantId: newTenantId,
      username: payload.adminUsername,
      email: payload.adminEmail,
      password: payload.adminPassword,
      fullName: payload.adminFullName,
      phoneNumber: payload.adminPhoneNumber || payload.companyPhone,
      role: 'Admin',
      createdAt: today(),
      isActive: true,
      createdBy: null,
      type: 'tenant',
    });

    setState((prev) => ({
      ...prev,
      tenants: [tenant, ...prev.tenants],
      users: [admin, ...prev.users],
    }));
    setCurrentUser(admin);
    pushNotification('Company registered', `${tenant.companyName} and its admin user were created successfully.`, 'success');
    return { ok: true, tenant, user: admin };
  };

  const ensureAdmin = () => {
    if (currentUser?.role !== 'Admin') {
      pushNotification('Permission denied', 'Only admin users can register additional users.', 'danger');
      return false;
    }
    return true;
  };

  const addUser = (payload) => {
    if (!ensureAdmin()) return { ok: false };
    const email = String(payload.email || '').trim().toLowerCase();
    const username = String(payload.username || '').trim().toLowerCase();
    if (!username || !email || !payload.password || !(payload.fullName || payload.name)) {
      pushNotification('User not created', 'Username, full name, email, and password are required.', 'danger');
      return { ok: false };
    }
    const scopedUsers = state.users.filter((user) => user.tenantId === tenantId);
    if (scopedUsers.some((user) => String(user.username || '').toLowerCase() === username)) {
      pushNotification('User not created', 'Username must be unique within the tenant.', 'danger');
      return { ok: false };
    }
    if (scopedUsers.some((user) => String(user.email || '').toLowerCase() === email)) {
      pushNotification('User not created', 'Email must be unique within the tenant.', 'danger');
      return { ok: false };
    }

    const item = sanitizeUser({
      id: Date.now(),
      tenantId,
      username: payload.username,
      email: payload.email,
      password: payload.password || '123456',
      phoneNumber: payload.phoneNumber || '',
      role: toRoleName(payload.role),
      fullName: payload.fullName || payload.name,
      createdAt: today(),
      createdBy: currentUser?.id || null,
      isActive: payload.isActive ?? true,
      type: 'tenant',
    });
    saveCollection('users', [item, ...state.users]);
    pushNotification('User created', `${item.fullName} added successfully.`, 'success');
    return { ok: true, user: item };
  };

  const updateUser = (userId, updates) => {
    saveCollection('users', state.users.map((item) => item.id === userId ? sanitizeUser({ ...item, ...updates }) : item));
    if (currentUser?.id === userId) setCurrentUser((prev) => sanitizeUser({ ...prev, ...updates }));
    pushNotification('User updated', 'User account saved.', 'success');
  };

  const addCustomer = (payload) => {
    const item = {
      id: id('C'),
      tenantId,
      createdAt: today(),
      updatedAt: today(),
      stage: 'New Lead',
      value: normalizeNumber(payload.value, 0),
      ...payload,
    };
    saveCollection('customers', [item, ...state.customers]);
    pushNotification('Lead created', `${item.name} added to the CRM pipeline.`, 'success');
  };

  const updateCustomer = (customerId, updates) => {
    saveCollection('customers', state.customers.map((item) => item.id === customerId ? { ...item, ...updates, updatedAt: today() } : item));
    pushNotification('Customer updated', 'Lead profile saved successfully.', 'success');
  };

  const updateCustomerStage = (customerId, stage) => {
    saveCollection('customers', state.customers.map((item) => item.id === customerId ? { ...item, stage, updatedAt: today() } : item));
    pushNotification('Stage changed', `Lead moved to ${stage}.`, stage === 'Lost' ? 'danger' : 'default');
  };

  const addInteraction = (payload) => {
    const item = { id: id('INT'), tenantId, interactionDate: today(), ...payload };
    saveCollection('interactions', [item, ...state.interactions]);
    pushNotification('Interaction logged', 'Customer communication added to timeline.', 'default');
  };

  const addSupplier = (payload) => {
    if (!payload.name || !payload.phone) {
      pushNotification('Supplier not created', 'Supplier name and phone are required.', 'danger');
      return { ok: false };
    }
    const item = { id: id('SUP'), tenantId, createdAt: today(), ...payload };
    saveCollection('suppliers', [item, ...state.suppliers]);
    pushNotification('Supplier added', `${item.name} saved successfully.`, 'success');
    return { ok: true, supplier: item };
  };

  const updateSupplier = (supplierId, updates) => {
    saveCollection('suppliers', state.suppliers.map((item) => item.id === supplierId ? { ...item, ...updates } : item));
    pushNotification('Supplier updated', 'Supplier profile updated.', 'success');
  };

  const deleteSupplier = (supplierId) => {
    const supplier = state.suppliers.find((item) => item.id === supplierId);
    const refs = getSupplierReferences(supplierId);
    if (refs.total > 0) {
      pushNotification('Delete rejected', `${supplier?.name || 'Supplier'} cannot be deleted because it is linked to ${refs.productCount} product(s) and ${refs.purchaseOrderCount} purchase order(s).`, 'danger');
      return { ok: false, refs };
    }
    saveCollection('suppliers', state.suppliers.filter((item) => item.id !== supplierId));
    pushNotification('Supplier deleted', `${supplier?.name || supplierId} was removed successfully.`, 'warning');
    return { ok: true };
  };

  const addProduct = (payload) => {
    const code = String(payload.code || '').trim();
    if (!code || !payload.name || !payload.supplierId) {
      pushNotification('Product not created', 'Code, name, and supplier are required.', 'danger');
      return { ok: false };
    }
    if (scoped.products.some((product) => String(product.code || '').toLowerCase() === code.toLowerCase())) {
      pushNotification('Product not created', 'Product code must be unique within the tenant.', 'danger');
      return { ok: false };
    }
    const price = normalizeNumber(payload.price, 0);
    const cost = normalizeNumber(payload.cost, 0);
    if (price < cost) {
      pushNotification('Product not created', 'Selling price must be greater than or equal to purchase price.', 'danger');
      return { ok: false };
    }
    const item = {
      id: id('PR'),
      tenantId,
      createdAt: today(),
      updatedAt: today(),
      quantity: normalizeNumber(payload.quantity, 0),
      minStock: normalizeNumber(payload.minStock, 5),
      price,
      cost,
      unit: payload.unit || 'pcs',
      ...payload,
      code,
    };
    saveCollection('products', [item, ...state.products]);
    pushNotification('Product created', `${item.name} added to inventory.`, 'success');
    return { ok: true, product: item };
  };

  const updateProduct = (productId, updates) => {
    const original = state.products.find((item) => item.id === productId);
    if (!original) return { ok: false };
    const nextCode = String(updates.code || original.code || '').trim();
    if (scoped.products.some((product) => product.id !== productId && String(product.code || '').toLowerCase() === nextCode.toLowerCase())) {
      pushNotification('Product not updated', 'Product code must remain unique.', 'danger');
      return { ok: false };
    }
    const nextPrice = normalizeNumber(updates.price ?? original.price, original.price);
    const nextCost = normalizeNumber(updates.cost ?? original.cost, original.cost);
    if (nextPrice < nextCost) {
      pushNotification('Product not updated', 'Selling price must be greater than or equal to purchase price.', 'danger');
      return { ok: false };
    }
    const next = {
      ...original,
      ...updates,
      id: original.id,
      quantity: original.quantity,
      price: nextPrice,
      cost: nextCost,
      code: nextCode,
      minStock: normalizeNumber(updates.minStock ?? original.minStock, original.minStock),
      updatedAt: today(),
    };
    saveCollection('products', state.products.map((item) => item.id === productId ? next : item));
    pushNotification('Product updated', 'Product data saved. Product ID stayed locked.', 'success');
    return { ok: true };
  };

  const deleteProduct = (productId) => {
    const product = state.products.find((item) => item.id === productId);
    const refs = getProductReferences(productId);
    if (refs.total > 0) {
      pushNotification('Delete rejected', `${product?.name || productId} cannot be deleted because it is linked to quotation, invoice, purchase-order, or inventory-movement records.`, 'danger');
      return { ok: false, refs };
    }
    saveCollection('products', state.products.filter((item) => item.id !== productId));
    pushNotification('Product removed', `${product?.name || productId} deleted from inventory.`, 'warning');
    return { ok: true };
  };

  const adjustStock = (productId, quantityChange, reason = 'Adjustment', notes = 'Manual stock adjustment', referenceNumber = 'ADJ-001') => {
    const product = state.products.find((item) => item.id === productId);
    if (!product) return { ok: false };
    const nextQty = Number(product.quantity) + Number(quantityChange);
    if (nextQty < 0) {
      pushNotification('Adjustment rejected', 'Final quantity cannot be negative.', 'danger');
      return { ok: false };
    }
    saveCollection('products', state.products.map((item) => item.id === productId ? { ...item, quantity: nextQty, updatedAt: today() } : item));
    saveCollection('movements', [{
      id: id('MOV'), tenantId, productId, type: 'Adjustment', quantity: Number(quantityChange), reference: referenceNumber, notes, reason, date: today(),
    }, ...state.movements]);
    pushNotification('Stock adjusted', `${product.name} quantity changed to ${nextQty}.`, quantityChange >= 0 ? 'success' : 'warning');
    return { ok: true };
  };

  const addQuotation = (payload) => {
    const items = (payload.items || []).map((item) => ({ ...item, quantity: Number(item.quantity), price: Number(item.price) }));
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const tax = Number(payload.tax || subtotal * 0.1);
    const record = {
      id: id('Q'), tenantId, quotationNumber: id('QTN'), createdAt: today(), quotationDate: today(), validUntil: payload.validUntil || '',
      status: payload.status || 'Draft', customerId: payload.customerId, tax, subtotal, total: subtotal + tax, items,
    };
    saveCollection('quotations', [record, ...state.quotations]);
    pushNotification('Quotation created', `${record.quotationNumber} added successfully.`, 'success');
  };

  const updateQuotation = (quotationId, updates) => {
    saveCollection('quotations', state.quotations.map((item) => {
      if (item.id !== quotationId) return item;
      const items = updates.items || item.items;
      const subtotal = items.reduce((sum, row) => sum + Number(row.quantity) * Number(row.price), 0);
      const tax = Number(updates.tax ?? item.tax ?? 0);
      return { ...item, ...updates, items, subtotal, tax, total: subtotal + tax };
    }));
    pushNotification('Quotation updated', 'Quotation saved successfully.', 'success');
  };

  const convertQuotationToInvoice = (quotationId) => {
    const quotation = state.quotations.find((item) => item.id === quotationId);
    if (!quotation) return;
    const record = {
      id: id('INV'), tenantId, invoiceNumber: id('INV'), quotationId, customerId: quotation.customerId,
      subtotal: quotation.subtotal, tax: quotation.tax, total: quotation.total, isPaid: false,
      status: 'Unpaid', paymentMethod: '', paymentNotes: '', dueDate: '', invoiceDate: today(), createdAt: today(), items: quotation.items,
    };
    saveCollection('invoices', [record, ...state.invoices]);
    saveCollection('quotations', state.quotations.map((item) => item.id === quotationId ? { ...item, status: 'Accepted' } : item));
    pushNotification('Converted to invoice', `${quotation.quotationNumber || quotation.id} is now a sales invoice.`, 'success');
  };

  const addInvoice = (payload) => {
    const items = (payload.items || []).map((item) => ({ ...item, quantity: Number(item.quantity), price: Number(item.price) }));
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const tax = Number(payload.tax || subtotal * 0.1);
    const record = {
      id: id('INV'), tenantId, invoiceNumber: id('INV'), customerId: payload.customerId, quotationId: payload.quotationId || null,
      subtotal, tax, total: subtotal + tax, isPaid: false, status: 'Unpaid', paymentMethod: '', paymentNotes: '', dueDate: payload.dueDate || '', invoiceDate: today(), items,
    };
    saveCollection('invoices', [record, ...state.invoices]);
    pushNotification('Invoice created', `${record.invoiceNumber} saved as unpaid.`, 'success');
  };

  const updateInvoice = (invoiceId, updates) => {
    saveCollection('invoices', state.invoices.map((item) => {
      if (item.id !== invoiceId) return item;
      const items = updates.items || item.items;
      const subtotal = items.reduce((sum, row) => sum + Number(row.quantity) * Number(row.price), 0);
      const tax = Number(updates.tax ?? item.tax ?? 0);
      return { ...item, ...updates, items, subtotal, tax, total: subtotal + tax };
    }));
    pushNotification('Invoice updated', 'Sales invoice updated.', 'success');
  };

  const recordPayment = (invoiceId, paymentMethod = 'Cash', paymentNotes = '') => {
    const invoice = state.invoices.find((item) => item.id === invoiceId);
    if (!invoice || invoice.isPaid) return;
    saveCollection('invoices', state.invoices.map((item) => item.id === invoiceId ? { ...item, isPaid: true, status: 'Paid', paidDate: today(), paymentMethod, paymentNotes } : item));

    let nextProducts = [...state.products];
    let nextMovements = [...state.movements];
    invoice.items.forEach((row) => {
      nextProducts = nextProducts.map((product) => product.id === row.productId ? { ...product, quantity: Math.max(0, Number(product.quantity) - Number(row.quantity)), updatedAt: today() } : product);
      nextMovements = [{ id: id('MOV'), tenantId, productId: row.productId, type: 'Sale', quantity: -Number(row.quantity), reference: invoice.invoiceNumber || invoice.id, notes: 'Sale to customer', reason: 'Invoice marked as paid', date: today() }, ...nextMovements];
    });
    saveCollection('products', nextProducts);
    saveCollection('movements', nextMovements);
    pushNotification('Payment recorded', `${invoice.invoiceNumber || invoice.id} marked as paid.`, 'success');
  };

  const normalizePurchaseItems = (items = []) => items
    .filter((item) => item.productId)
    .map((item) => ({ productId: item.productId, quantity: normalizeNumber(item.quantity, 1), cost: normalizeNumber(item.cost, 0) }));

  const addPurchaseOrder = (payload) => {
    const items = normalizePurchaseItems(payload.items);
    if (!payload.supplierId || !items.length) {
      pushNotification('PO not created', 'Supplier and at least one item are required.', 'danger');
      return { ok: false };
    }
    const total = items.reduce((sum, item) => sum + item.quantity * item.cost, 0);
    const record = {
      id: id('PO'),
      tenantId,
      poNumber: id('PO'),
      supplierId: payload.supplierId,
      status: payload.status || 'Draft',
      date: today(),
      orderDate: payload.orderDate || today(),
      total,
      notes: payload.notes || '',
      items,
    };
    saveCollection('purchaseOrders', [record, ...state.purchaseOrders]);
    pushNotification('Purchase order created', `${record.poNumber} added in draft status.`, 'success');
    return { ok: true, purchaseOrder: record };
  };

  const updatePurchaseOrder = (poId, updates) => {
    const current = state.purchaseOrders.find((item) => item.id === poId);
    if (!current) return { ok: false };
    if (current.status !== 'Draft') {
      pushNotification('Update blocked', 'Only draft purchase orders can be updated.', 'danger');
      return { ok: false };
    }
    const items = normalizePurchaseItems(updates.items || current.items);
    const total = items.reduce((sum, row) => sum + Number(row.quantity) * Number(row.cost), 0);
    saveCollection('purchaseOrders', state.purchaseOrders.map((item) => item.id === poId ? { ...item, ...updates, items, total, status: 'Draft' } : item));
    pushNotification('Purchase order updated', 'Purchase order saved successfully.', 'success');
    return { ok: true };
  };

  const deletePurchaseOrder = (poId) => {
    const po = state.purchaseOrders.find((item) => item.id === poId);
    if (!po) return { ok: false };
    if (po.status !== 'Draft') {
      pushNotification('Delete blocked', 'Only draft purchase orders can be deleted. Sent or received orders stay protected.', 'danger');
      return { ok: false };
    }
    saveCollection('purchaseOrders', state.purchaseOrders.filter((item) => item.id !== poId));
    pushNotification('Purchase order deleted', `${po.poNumber || po.id} removed successfully.`, 'warning');
    return { ok: true };
  };

  const sendPurchaseOrder = (poId) => {
    const po = state.purchaseOrders.find((item) => item.id === poId);
    if (!po) return { ok: false };
    if (po.status !== 'Draft') {
      pushNotification('Send blocked', 'Only draft purchase orders can be sent.', 'danger');
      return { ok: false };
    }
    saveCollection('purchaseOrders', state.purchaseOrders.map((item) => item.id === poId ? { ...item, status: 'Sent', sentAt: today() } : item));
    pushNotification('PO sent', 'Purchase order moved from Draft to Sent.', 'default');
    return { ok: true };
  };

  const receivePurchaseOrder = (poId, notes = '') => {
    const po = state.purchaseOrders.find((item) => item.id === poId);
    if (!po) return { ok: false };
    if (po.status !== 'Sent') {
      pushNotification('Receive blocked', 'Only sent purchase orders can be received.', 'danger');
      return { ok: false };
    }
    saveCollection('purchaseOrders', state.purchaseOrders.map((item) => item.id === poId ? { ...item, status: 'Received', receivedDate: today(), notes: notes || item.notes || '' } : item));
    let nextProducts = [...state.products];
    let nextMovements = [...state.movements];
    po.items.forEach((row) => {
      nextProducts = nextProducts.map((product) => product.id === row.productId ? { ...product, quantity: Number(product.quantity) + Number(row.quantity), updatedAt: today() } : product);
      nextMovements = [{ id: id('MOV'), tenantId, productId: row.productId, type: 'Purchase', quantity: Number(row.quantity), reference: po.poNumber || po.id, notes: notes || 'Received from supplier', reason: 'Purchase order received', date: today() }, ...nextMovements];
    });
    saveCollection('products', nextProducts);
    saveCollection('movements', nextMovements);
    pushNotification('Goods received', `${po.poNumber || po.id} received into inventory.`, 'success');
    return { ok: true };
  };

  const runAIInsight = () => {
    const opportunities = scoped.customers.filter((item) => item.stage === 'Opportunity').length;
    const lowStockCount = scoped.products.filter((item) => item.quantity <= item.minStock).length;
    const text = lowStockCount > 0
      ? `There are ${lowStockCount} low-stock products while ${opportunities} opportunities are active. Prioritize replenishment before closing larger deals.`
      : `Pipeline is healthy with ${opportunities} active opportunities. Push accepted quotations into paid invoices to improve cash collection.`;
    saveCollection('aiInsights', [{ id: id('AI'), tenantId, type: 'Daily Insight', title: 'AI business brief', text, confidence: 91, createdAt: today() }, ...state.aiInsights]);
    pushNotification('AI insight created', 'Fresh recommendation added to AI suite.', 'success');
  };

  const runOCRDemo = () => {
    saveCollection('ocrResults', [{ id: id('OCR'), tenantId, imagePath: '/samples/mock-invoice.png', rawText: 'PO and invoice mock extraction', extractedData: { vendor: 'TechSource', total: 1240, matchedSupplier: true, lineItems: 3 }, status: 'Success', createdAt: today() }, ...state.ocrResults]);
    pushNotification('OCR demo executed', 'Mock extraction result generated successfully.', 'success');
  };

  const metrics = useMemo(() => {
    const revenue = scoped.invoices.filter((item) => item.isPaid || item.status === 'Paid').reduce((sum, item) => sum + Number(item.total), 0);
    const outstanding = scoped.invoices.filter((item) => !(item.isPaid || item.status === 'Paid')).reduce((sum, item) => sum + Number(item.total), 0);
    const inventoryValue = scoped.products.reduce((sum, item) => sum + Number(item.cost) * Number(item.quantity), 0);
    const won = scoped.customers.filter((item) => item.stage === 'Won').length;
    const lost = scoped.customers.filter((item) => item.stage === 'Lost').length;
    const opportunities = scoped.customers.filter((item) => item.stage === 'Opportunity').length;
    const lowStock = scoped.products.filter((item) => item.quantity <= item.minStock).length;
    const openQuotes = scoped.quotations.filter((item) => ['Draft', 'Sent'].includes(item.status)).length;
    return { revenue, outstanding, inventoryValue, won, lost, opportunities, lowStock, openQuotes };
  }, [scoped]);

  const dashboardSeries = useMemo(() => ({
    revenue: [
      { label: 'Jan', value: 12800 },
      { label: 'Feb', value: 16400 },
      { label: 'Mar', value: 17200 },
      { label: 'Apr', value: 19600 },
      { label: 'May', value: 21900 },
      { label: 'Jun', value: 23400 },
    ],
    collections: [
      { label: 'Paid', value: scoped.invoices.filter((item) => item.isPaid || item.status === 'Paid').length },
      { label: 'Unpaid', value: scoped.invoices.filter((item) => !(item.isPaid || item.status === 'Paid')).length },
      { label: 'Quotes', value: scoped.quotations.length },
      { label: 'POs', value: scoped.purchaseOrders.length },
    ],
  }), [scoped]);

  const value = {
    state,
    scoped,
    currentUser,
    theme,
    setTheme,
    login,
    logout,
    resetDemo,
    registerTenant,
    notifications,
    removeNotification,
    dashboardView,
    setDashboardView,
    metrics,
    dashboardSeries,
    addCustomer,
    updateCustomer,
    updateCustomerStage,
    addInteraction,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    addQuotation,
    updateQuotation,
    convertQuotationToInvoice,
    addInvoice,
    updateInvoice,
    recordPayment,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    sendPurchaseOrder,
    receivePurchaseOrder,
    addUser,
    updateUser,
    runAIInsight,
    runOCRDemo,
    pushNotification,
    getProductReferences,
    getSupplierReferences,
    getProductById,
    getSupplierById,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
