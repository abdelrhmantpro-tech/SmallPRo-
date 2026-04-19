import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Card, Progress, SectionTitle, StatCard, Badge } from '../components/UI';
import { useApp } from '../context/AppContext';
import { money } from '../utils/format';
import { DoughnutChart, LineChart, MiniBarChart } from '../components/Charts';

const dashboardTabs = [
  ['overview', 'Overview', '◫', 'Executive view and fast shortcuts'],
  ['sales', 'Sales', '◧', 'Revenue, invoices, collections'],
  ['crm', 'CRM', '◎', 'Lead flow, conversion, pipeline'],
  ['inventory', 'Inventory', '◩', 'Stock health and product control'],
  ['purchase', 'Purchase', '◬', 'Suppliers and receiving'],
  ['alerts', 'Alerts', '✦', 'Items needing action now'],
];

export default function DashboardPage() {
  const { scoped, metrics, resetDemo, dashboardSeries, dashboardView, setDashboardView } = useApp();
  const [hidePanels, setHidePanels] = useState(false);

  useEffect(() => {
    const onScroll = () => setHidePanels(window.scrollY > 360);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const stageSegments = [
    { label: 'New Lead', value: scoped.customers.filter((c) => c.stage === 'New Lead').length, tone: 'default' },
    { label: 'Interested', value: scoped.customers.filter((c) => c.stage === 'Interested').length, tone: 'warning' },
    { label: 'Opportunity', value: scoped.customers.filter((c) => c.stage === 'Opportunity').length, tone: 'success' },
    { label: 'Won', value: scoped.customers.filter((c) => c.stage === 'Won').length, tone: 'success' },
    { label: 'Lost', value: scoped.customers.filter((c) => c.stage === 'Lost').length, tone: 'danger' },
  ];

  const lowStock = scoped.products.filter((p) => p.quantity <= p.minStock);
  const pendingPOs = scoped.purchaseOrders.filter((p) => p.status === 'Sent' || p.status === 'Draft');
  const unpaidInvoices = scoped.invoices.filter((i) => !i.isPaid && i.status !== 'Paid');
  const panelSummary = dashboardTabs.find(([key]) => key === dashboardView)?.[3] || 'Use these panels to move between dashboard sections.';

  return (
    <Layout title="Dashboard" actions={<button className="btn ghost" onClick={resetDemo}>Reset Demo</button>}>
      <div className={`dash-selector-wrap ${hidePanels ? 'is-hidden' : ''}`}>
        <Card className="large-card dash-selector-card">
          <SectionTitle title="Dashboard panels" subtitle={panelSummary} />
          <div className="grid six desktop-six">
            {dashboardTabs.map(([key, label, icon, desc]) => (
              <StatCard
                key={key}
                label={label}
                value={key === 'sales' ? money(metrics.revenue) : key === 'crm' ? scoped.customers.length : key === 'inventory' ? lowStock.length : key === 'purchase' ? pendingPOs.length : key === 'alerts' ? unpaidInvoices.length : 'Open'}
                hint={desc}
                icon={icon}
                onClick={() => setDashboardView(key)}
                active={dashboardView === key}
              />
            ))}
          </div>
        </Card>
      </div>

      <div className="dashboard-anchor-card" />

      {(dashboardView === 'overview' || dashboardView === 'sales') && (
        <div className="grid two mt24 balanced-grid">
          <Card className="large-card">
            <SectionTitle title="Revenue trend" subtitle="Monthly revenue and collection view" />
            <LineChart data={dashboardSeries.revenue} currency />
          </Card>
          <Card className="large-card">
            <SectionTitle title="Sales summary" subtitle="Financial snapshot for invoices and quotations" />
            <div className="grid two balanced-grid compact-metrics">
              <StatCard label="Collected" value={money(metrics.revenue)} hint="Paid invoices only" icon="REV" />
              <StatCard label="Outstanding" value={money(metrics.outstanding)} hint="Unpaid invoices" icon="DUE" />
              <StatCard label="Open quotations" value={metrics.openQuotes} hint="Draft + Sent" icon="QTN" />
              <StatCard label="Invoices" value={scoped.invoices.length} hint="Sales documents" icon="INV" />
            </div>
          </Card>
        </div>
      )}

      {(dashboardView === 'overview' || dashboardView === 'crm') && (
        <div className="grid two mt24 balanced-grid">
          <Card className="large-card">
            <SectionTitle title="CRM pipeline" subtitle="Exact stages from your system" />
            <DoughnutChart segments={stageSegments} />
          </Card>
          <Card className="large-card">
            <SectionTitle title="Lead flow focus" subtitle="What deserves attention now" />
            <div className="stack metric-stack">
              <div className="metric-row"><span>Interested leads ready for follow up</span><strong>{scoped.customers.filter((c) => c.stage === 'Interested').length}</strong><Progress value={58} /></div>
              <div className="metric-row"><span>Opportunities close to quotation stage</span><strong>{metrics.opportunities}</strong><Progress value={76} /></div>
              <div className="metric-row"><span>Closed deal conversion</span><strong>{metrics.won + metrics.lost > 0 ? Math.round((metrics.won / (metrics.won + metrics.lost)) * 100) : 0}%</strong><Progress value={metrics.won + metrics.lost > 0 ? Math.round((metrics.won / (metrics.won + metrics.lost)) * 100) : 0} /></div>
            </div>
          </Card>
        </div>
      )}

      {(dashboardView === 'overview' || dashboardView === 'inventory') && (
        <div className="grid two mt24 balanced-grid">
          <Card className="large-card">
            <SectionTitle title="Inventory by product" subtitle="Current stock quantities" />
            <MiniBarChart data={scoped.products.map((p) => ({ label: p.code, value: p.quantity }))} />
          </Card>
          <Card className="large-card">
            <SectionTitle title="Inventory health" subtitle="Value, low stock and movement readiness" />
            <div className="grid two balanced-grid compact-metrics">
              <StatCard label="Inventory value" value={money(metrics.inventoryValue)} hint="Based on product cost" icon="VAL" />
              <StatCard label="Low stock" value={metrics.lowStock} hint="Qty <= minimum stock" icon="LOW" />
              <StatCard label="Products" value={scoped.products.length} hint="Current catalog count" icon="PRD" />
              <StatCard label="Movements" value={scoped.movements.length} hint="Inventory audit rows" icon="MOV" />
            </div>
          </Card>
        </div>
      )}

      {(dashboardView === 'overview' || dashboardView === 'purchase') && (
        <div className="grid two mt24 balanced-grid">
          <Card className="large-card">
            <SectionTitle title="Purchase flow" subtitle="Draft, Sent and Received purchase orders" />
            <div className="stack">
              {['Draft', 'Sent', 'Received'].map((status) => (
                <div className="list-item emphasis-item" key={status}>
                  <div>
                    <strong>{status}</strong>
                    <p>{scoped.purchaseOrders.filter((po) => po.status === status).length} purchase orders</p>
                  </div>
                  <div className="right-meta"><Badge tone={status === 'Received' ? 'success' : status === 'Sent' ? 'warning' : 'default'}>{status}</Badge></div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="large-card">
            <SectionTitle title="Top suppliers" subtitle="Fast overview for purchasing decisions" />
            <div className="stack">
              {scoped.suppliers.map((supplier) => (
                <div className="list-item emphasis-item" key={supplier.id}>
                  <div>
                    <strong>{supplier.name}</strong>
                    <p>{supplier.email}</p>
                  </div>
                  <div className="right-meta"><strong>{scoped.purchaseOrders.filter((po) => po.supplierId === supplier.id).length} POs</strong></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {(dashboardView === 'overview' || dashboardView === 'alerts') && (
        <div className="grid three mt24 desktop-three">
          <Card>
            <SectionTitle title="Low stock alerts" subtitle="Items that need replenishment" />
            <div className="stack">
              {lowStock.map((product) => (
                <div key={product.id} className="list-item emphasis-item">
                  <div>
                    <strong>{product.name}</strong>
                    <p>{product.code}</p>
                  </div>
                  <div className="right-meta">
                    <Badge tone="danger">Low stock</Badge>
                    <strong>{product.quantity}</strong>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionTitle title="Recent invoices" subtitle="Latest payment status" />
            <div className="stack">
              {scoped.invoices.map((invoice) => (
                <div key={invoice.id} className="list-item emphasis-item">
                  <div>
                    <strong>{invoice.invoiceNumber || invoice.id}</strong>
                    <p>{scoped.customers.find((c) => c.id === invoice.customerId)?.name}</p>
                  </div>
                  <div className="right-meta">
                    <Badge tone={invoice.isPaid || invoice.status === 'Paid' ? 'success' : 'warning'}>{invoice.isPaid || invoice.status === 'Paid' ? 'Paid' : 'Unpaid'}</Badge>
                    <strong>{money(invoice.total)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionTitle title="Recent movements" subtitle="Inventory audit trail" />
            <div className="stack">
              {scoped.movements.slice(0, 5).map((move) => (
                <div key={move.id} className="list-item emphasis-item">
                  <div>
                    <strong>{move.reference}</strong>
                    <p>{scoped.products.find((p) => p.id === move.productId)?.name}</p>
                  </div>
                  <div className="right-meta">
                    <Badge tone={move.type === 'Sale' ? 'warning' : move.type === 'Adjustment' ? 'danger' : 'success'}>{move.type}</Badge>
                    <strong>{move.quantity}</strong>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}
