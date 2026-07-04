import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import AdminCourses from './AdminCourses';
import AdminUsers from './AdminUsers';
import AdminPayments from './AdminPayments';
import './Admin.css';

const TABS = [
  { id: 'courses',  label: 'Cursos' },
  { id: 'users',    label: 'Usuarios' },
  { id: 'payments', label: 'Pagos' },
];

export default function Admin() {
  const { user } = useApp();
  const [tab, setTab] = useState('courses');

  if (!user) return <Navigate to="/" />;
  if (user.role === 'instructor') return <Navigate to="/instructor" />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" />;

  return (
    <div className="admin-page">
      <div className="container">
        <p className="label" style={{marginBottom:8}}>Panel de administración</p>
        <h1 style={{fontFamily:'var(--display)',fontSize:32,fontWeight:800,letterSpacing:'-0.03em',marginBottom:24}}>Dashboard</h1>

        <div className="admin-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`admin-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'courses'  && <AdminCourses />}
      {tab === 'users'    && <AdminUsers />}
      {tab === 'payments' && <AdminPayments />}
    </div>
  );
}
