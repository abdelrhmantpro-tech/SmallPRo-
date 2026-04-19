import React, { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Modal, Toasts } from "./UI";

const linksByRole = {
  Admin: [
    ["/", "Dashboard", "◫"],
    ["/crm", "CRM", "◎"],
    ["/sales", "Sales", "◧"],
    ["/inventory", "Inventory", "◩"],
    ["/purchase", "Purchase", "◬"],
    ["/users", "Users", "◉"],
    ["/ai", "AI Suite", "✦"],
  ],
  Manager: [
    ["/", "Dashboard", "◫"],
    ["/crm", "CRM", "◎"],
    ["/sales", "Sales", "◧"],
    ["/inventory", "Inventory", "◩"],
    ["/purchase", "Purchase", "◬"],
    ["/ai", "AI Suite", "✦"],
  ],
  Salesperson: [
    ["/", "Dashboard", "◫"],
    ["/crm", "CRM", "◎"],
    ["/sales", "Sales", "◧"],
    ["/ai", "AI Suite", "✦"],
  ],
  "Inventory Manager": [
    ["/", "Dashboard", "◫"],
    ["/inventory", "Inventory", "◩"],
    ["/purchase", "Purchase", "◬"],
    ["/ai", "AI Suite", "✦"],
  ],
};

const routeMeta = {
  "/": { title: "Dashboard", subtitle: "KPI groups, revenue trends, CRM funnel, inventory health, and operational alerts." },
  "/crm": { title: "CRM", subtitle: "Customers, lead flow, interactions, and opportunity tracking." },
  "/sales": { title: "Sales", subtitle: "Quotations, invoices, payments, and collection follow-up." },
  "/inventory": { title: "Inventory", subtitle: "Products, stock levels, stock movement history, and alerts." },
  "/purchase": { title: "Purchase", subtitle: "Suppliers, purchase orders, and receiving workflow." },
  "/users": { title: "Users", subtitle: "Tenant users, roles, and admin controls." },
  "/ai": { title: "AI Suite", subtitle: "Business insight summaries and OCR mock outputs for later integration." },
};

export default function Layout({ children, title, actions }) {
  const { currentUser, logout, theme, setTheme, notifications, removeNotification, updateUser } = useApp();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [form, setForm] = useState(() => ({ name: currentUser?.name || '', email: currentUser?.email || '', role: currentUser?.role || '' }));
  const links = useMemo(() => linksByRole[currentUser?.role] || linksByRole.Admin, [currentUser]);
  const pageMeta = routeMeta[location.pathname] || { title, subtitle: 'Professional ERP interface prepared around your own documented modules.' };

  return (
    <div className="layout-shell">
      <Toasts items={notifications} onClose={removeNotification} />
      <aside className={`sidebar floating-sidebar ${open ? 'open' : ''}`}>
        <div className="brand-card brand-card-strong">
          <div className="brand brand-vertical">
            <div className="brand-logo-wrap enhanced-logo">
              <img src="/logo.jfif" alt="Small Pro" />
            </div>
            <div>
              <h2>Small Pro ERP</h2>
              <p>{currentUser?.tenantId === 'tenant-1' ? 'Nile Agency Workspace' : 'ERP Workspace'}</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map(([to, label, icon]) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}>
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="usercard clickable-surface" onClick={() => { setForm({ name: currentUser?.name || '', email: currentUser?.email || '', role: currentUser?.role || '' }); setProfileOpen(true); }}>
          <strong>{currentUser?.name}</strong>
          <span>{currentUser?.role}</span>
          <small>{currentUser?.email}</small>
          <div className="row gap wrap mt16">
            <button className="btn ghost small" onClick={(e) => { e.stopPropagation(); setTheme(theme === 'light' ? 'dark' : 'light'); }}>
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </button>
            <button className="btn ghost small" onClick={(e) => { e.stopPropagation(); logout(); }}>Logout</button>
          </div>
        </div>
      </aside>

      {open ? <button className="sidebar-overlay" aria-label="close sidebar" onClick={() => setOpen(false)} /> : null}

      <main className="main wide-main with-hidden-sidebar">
        <header className="topbar compact-topbar">
          <div className="topbar-main">
            <div className="row gap wrap">
              <button className="burger-btn" onClick={() => setOpen(true)} aria-label="open menu">
                <span />
                <span />
                <span />
              </button>
              <div>
                <h1>{title || pageMeta.title}</h1>
                <p>{pageMeta.subtitle}</p>
              </div>
            </div>
          </div>
          <div className="row gap wrap">{actions}</div>
        </header>
        <section>{children}</section>
      </main>

      <Modal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        title="User profile"
        subtitle="Review account details and edit the visible information"
        footer={<button className="btn primary" onClick={() => { updateUser(currentUser.id, form); setProfileOpen(false); }}>Save changes</button>}
      >
        <div className="stack">
          <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Email<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>Role<input value={form.role} disabled /></label>
        </div>
      </Modal>
    </div>
  );
}
