import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { demoAccounts } from '../data/seed';

const blankTenant = {
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  adminUsername: '',
  adminEmail: '',
  adminPassword: '123456',
  adminFullName: '',
};

export default function LoginPage() {
  const { login, resetDemo, theme, setTheme, registerTenant } = useApp();
  const [activeTab, setActiveTab] = useState('login');
  const [identifier, setIdentifier] = useState('admin@nileagency.com');
  const [password, setPassword] = useState('123456');
  const [tenantForm, setTenantForm] = useState(blankTenant);
  const [error, setError] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const res = login(identifier, password);
    if (!res.ok) setError(res.message);
    else setError('');
  };

  const submitTenant = (e) => {
    e.preventDefault();
    const res = registerTenant(tenantForm);
    if (res?.ok) {
      setRegisterMessage('Company and admin registered successfully. You are now signed in.');
      setTenantForm(blankTenant);
      setActiveTab('login');
    } else {
      setRegisterMessage(res?.message || 'Registration failed.');
    }
  };

  return (
    <div className="login-page refined wider-login">
      <div className="login-card hero refined-hero">
        <div className="row spread top-tools">
          <Link to="/home" className="btn ghost small">Back to home</Link>
          <button className="btn ghost small" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} type="button">
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
        </div>
        <div className="hero-branding wide-branding">
          <div className="hero-logo-shell large-logo-shell"><img src="/logo.jfif" alt="Small Pro" className="hero-logo" /></div>
          <div>
            <h1>Small Pro ERP</h1>
            <p>Authentication demo now supports sign in by email or username, register-tenant, and admin-only register-user from the Users page.</p>
          </div>
        </div>
        <div className="hero-highlight-grid mt16">
          <div className="highlight-box"><strong>Register Tenant</strong><span>Company + admin in one flow</span></div>
          <div className="highlight-box"><strong>Login</strong><span>Email or username supported</span></div>
          <div className="highlight-box"><strong>Users</strong><span>Admin registers users inside the same tenant</span></div>
          <div className="highlight-box"><strong>Isolation</strong><span>Tenant-scoped demo data and roles</span></div>
        </div>
        <div className="grid two mt16">
          {demoAccounts.map((acc) => (
            <button key={acc.email} className="account-card" onClick={() => { setIdentifier(acc.email); setPassword(acc.password); setActiveTab('login'); }} type="button">
              <strong>{acc.role}</strong>
              <span>{acc.email}</span>
              <small>@{acc.username} • {acc.name}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="login-card sign-panel">
        <div className="auth-tabs">
          <button className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('login')}>Sign in</button>
          <button className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('register')}>Register tenant</button>
        </div>

        {activeTab === 'login' ? (
          <form onSubmit={submit} className="stack">
            <h2>Sign in</h2>
            <p className="muted-copy">Use email or username with the password.</p>
            <label>Email or username<input value={identifier} onChange={(e) => setIdentifier(e.target.value)} /></label>
            <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            {error && <p className="error">{error}</p>}
            {registerMessage && <p className="success-copy">{registerMessage}</p>}
            <button className="btn primary full" type="submit">Enter workspace</button>
            <button className="btn ghost full" type="button" onClick={resetDemo}>Reset demo data</button>
          </form>
        ) : (
          <form onSubmit={submitTenant} className="stack">
            <h2>Register tenant</h2>
            <p className="muted-copy">Matches the documented register-tenant flow: company data plus admin user in one request.</p>
            <label>Company name<input value={tenantForm.companyName} onChange={(e) => setTenantForm({ ...tenantForm, companyName: e.target.value })} /></label>
            <label>Company email<input value={tenantForm.companyEmail} onChange={(e) => setTenantForm({ ...tenantForm, companyEmail: e.target.value })} /></label>
            <label>Company phone<input value={tenantForm.companyPhone} onChange={(e) => setTenantForm({ ...tenantForm, companyPhone: e.target.value })} /></label>
            <label>Admin username<input value={tenantForm.adminUsername} onChange={(e) => setTenantForm({ ...tenantForm, adminUsername: e.target.value })} /></label>
            <label>Admin full name<input value={tenantForm.adminFullName} onChange={(e) => setTenantForm({ ...tenantForm, adminFullName: e.target.value })} /></label>
            <label>Admin email<input value={tenantForm.adminEmail} onChange={(e) => setTenantForm({ ...tenantForm, adminEmail: e.target.value })} /></label>
            <label>Admin password<input value={tenantForm.adminPassword} onChange={(e) => setTenantForm({ ...tenantForm, adminPassword: e.target.value })} /></label>
            {registerMessage && <p className={registerMessage.includes('successfully') ? 'success-copy' : 'error'}>{registerMessage}</p>}
            <button className="btn primary full" type="submit">Create company and admin</button>
          </form>
        )}
      </div>
    </div>
  );
}
