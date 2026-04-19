import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from './context/AppContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CRMPage from './pages/CRMPage';
import SalesPage from './pages/SalesPage';
import InventoryPage from './pages/InventoryPage';
import PurchasePage from './pages/PurchasePage';
import UsersPage from './pages/UsersPage';
import AIPage from './pages/AIPage';

function Protected({ children }) {
  const { currentUser } = useApp();
  return currentUser ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { currentUser } = useApp();
  return (
    <Routes>
      <Route path="/home" element={<HomePage />} />
      <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/crm" element={<Protected><CRMPage /></Protected>} />
      <Route path="/sales" element={<Protected><SalesPage /></Protected>} />
      <Route path="/inventory" element={<Protected><InventoryPage /></Protected>} />
      <Route path="/purchase" element={<Protected><PurchasePage /></Protected>} />
      <Route path="/users" element={<Protected><UsersPage /></Protected>} />
      <Route path="/ai" element={<Protected><AIPage /></Protected>} />
      <Route path="/quotations" element={<Navigate to="/sales" replace />} />
      <Route path="/invoices" element={<Navigate to="/sales" replace />} />
      <Route path="*" element={<Navigate to={currentUser ? '/' : '/home'} replace />} />
    </Routes>
  );
}
