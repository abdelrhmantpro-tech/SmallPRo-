export const money = (n = 0) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(n || 0));
export const date = (v) => new Date(v).toLocaleDateString();
export const id = (prefix='ID') => `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
export const today = () => new Date().toISOString().slice(0,10);
export const cls = (...v) => v.filter(Boolean).join(' ');
