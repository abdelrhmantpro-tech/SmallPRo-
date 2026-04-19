import React from 'react';
import { Link } from 'react-router-dom';
import { demoAccounts } from '../data/seed';

export default function HomePage() {
  return (
    <div className="home-page refined-home">
      <header className="home-header">
        <div className="home-brand">
          <div className="home-brand-badge hero-logo-badge polished-logo"><img src="/logo.jfif" alt="Small Pro" /></div>
          <div>
            <strong>Small Pro ERP</strong>
            <p>Professional ERP presentation built on your exact modules and flow</p>
          </div>
        </div>
        <div className="row gap wrap">
          <a className="btn ghost" href="#modules">Modules</a>
          <Link className="btn primary" to="/login">Open demo</Link>
        </div>
      </header>

      <section className="hero-panel enterprise-hero calm-hero">
        <div>
          <span className="badge">ERP style presentation</span>
          <h1>One company ERP flow from lead to invoice, purchase, inventory, dashboard and AI.</h1>
          <p>
            This interface follows your system rules: CRM stages, quotation conversion, payment-based stock deduction,
            supplier and purchase order flow, inventory movements, user roles, and dashboard KPIs — all prepared without any live API dependency.
          </p>
          <div className="row gap wrap mt24">
            <Link className="btn primary" to="/login">Start presentation</Link>
            <a className="btn ghost" href="#accounts">Accounts</a>
          </div>
          <div className="mini-kpis mt24">
            <div><strong>4</strong><small>Real system roles</small></div>
            <div><strong>7</strong><small>Main modules</small></div>
            <div><strong>0</strong><small>Live API dependency</small></div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-card big enterprise-preview elevated-preview">
            <div className="visual-top"><span /><span /><span /></div>
            <div className="visual-grid">
              <div className="visual-stat"><strong>23</strong><small>Open leads</small></div>
              <div className="visual-stat"><strong>26.4k</strong><small>Paid invoices</small></div>
              <div className="visual-stat"><strong>2</strong><small>Low stock alerts</small></div>
              <div className="visual-stat"><strong>94%</strong><small>Collection health</small></div>
            </div>
            <div className="visual-bars clean-bars">
              <span style={{ height: '45%' }} />
              <span style={{ height: '62%' }} />
              <span style={{ height: '78%' }} />
              <span style={{ height: '65%' }} />
              <span style={{ height: '88%' }} />
              <span style={{ height: '74%' }} />
            </div>
          </div>
        </div>
      </section>

      <section className="module-strip" id="modules">
        {[
          ['Authentication', 'Admin creates users inside the same tenant with isolated company data.'],
          ['CRM', 'New Lead → Interested → Opportunity → Won / Lost with interaction history.'],
          ['Sales', 'Quotation, invoice, payment, unpaid follow-up and sales dashboard metrics.'],
          ['Inventory', 'Product master, low-stock alerts, stock value, movement tracking.'],
          ['Purchase', 'Supplier management and Draft → Sent → Received purchase order flow.'],
          ['AI Suite', 'AI insights and OCR mock results prepared for future integration.'],
        ].map(([title, text]) => (
          <article key={title} className="feature-card feature-card-large">
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="preview-panel" id="preview">
        <div className="section-head">
          <div>
            <h2>Calm layout for a cleaner presentation</h2>
            <p>More popup interactions, larger spacing, easier visual hierarchy, and the same final design direction you liked.</p>
          </div>
        </div>
        <div className="preview-grid">
          <div className="preview-card"><h3>Burger navigation</h3><p>Hidden sidebar opens only when needed so the workspace stays clean.</p></div>
          <div className="preview-card"><h3>Dashboard section chooser</h3><p>Open KPI groups through buttons before showing all details.</p></div>
          <div className="preview-card"><h3>Popup-first actions</h3><p>Create, view, and edit actions are centered in modals across modules.</p></div>
          <div className="preview-card"><h3>Prepared for backend later</h3><p>UI is aligned to your feature documentation without consuming any API now.</p></div>
        </div>
      </section>

      <section className="accounts-panel" id="accounts">
        <div className="section-head">
          <div>
            <h2>Demo accounts</h2>
            <p>These are the four roles from your own system design.</p>
          </div>
        </div>
        <div className="accounts-grid four-cols">
          {demoAccounts.map((account) => (
            <div key={account.email} className="account-showcase">
              <strong>{account.role}</strong>
              <span>{account.name}</span>
              <small>{account.email}</small>
              <b>123456</b>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
