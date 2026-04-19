import React from 'react';
import { cls } from '../utils/format';

export function Card({ children, className='' }) { return <div className={cls('card', className)}>{children}</div>; }
export function StatCard({ label, value, hint, icon, onClick, active=false }) {
  return (
    <Card className={cls('motion-card', onClick && 'clickable-card', active && 'active-card')}>
      <button className="card-button-reset" onClick={onClick} disabled={!onClick}>
        <div className="stat-top"><div className="stat-label">{label}</div>{icon && <span className="stat-icon">{icon}</span>}</div>
        <div className="stat-value">{value}</div>
        <div className="stat-hint">{hint}</div>
      </button>
    </Card>
  );
}
export function Badge({ children, tone='default' }) { return <span className={`badge ${tone}`}>{children}</span>; }
export function SectionTitle({ title, subtitle, action }) {
  return <div className="section-title"><div><h3>{title}</h3><p>{subtitle}</p></div><div>{action}</div></div>;
}
export function Empty({ text='No data yet.' }) { return <Card><div className="empty">{text}</div></Card>; }
export function Progress({ value }) { return <div className="progress"><span style={{ width: `${value}%` }} /></div>; }
export function Toasts({ items = [], onClose }) {
  return (
    <div className="toast-stack">
      {items.map((item) => (
        <div key={item.id} className={`toast ${item.tone || 'default'}`}>
          <div>
            <strong>{item.title}</strong>
            <p>{item.message}</p>
          </div>
          <button className="toast-close" onClick={() => onClose(item.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

export function Modal({ open, title, subtitle, children, onClose, footer }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="section-title modal-header">
          <div>
            <h3>{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button className="btn ghost small" onClick={onClose}>Close</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
