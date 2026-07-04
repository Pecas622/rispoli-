import { useState, useEffect, useCallback } from 'react';
import { Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { paymentsApi } from '../services/api';

export default function AdminPayments() {
  const { showToast } = useApp();

  const [payments,   setPayments]   = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    paymentsApi.adminList({ page, limit: 20 })
      .then(res => { setPayments(res.payments); setTotal(res.total); setTotalPages(res.totalPages); })
      .catch(() => { setError(true); showToast('Error al cargar los pagos', 'error'); })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const totalRecaudado = payments.reduce((a, p) => a + (p.amount || 0), 0);

  return (
    <div className="container">
      <div className="admin-stats">
        {[
          { label: 'Pagos (esta página)', val: payments.length },
          { label: 'Total de pagos',       val: total },
          { label: 'Recaudado (esta página)', val: `$${totalRecaudado.toLocaleString()}` },
          { label: 'Promedio por pago', val: payments.length ? `$${Math.round(totalRecaudado / payments.length).toLocaleString()}` : '$0' },
        ].map(({ label, val }) => (
          <div key={label} className="admin-stat">
            <div className="admin-stat-label">{label}</div>
            <div className="admin-stat-val">{val}</div>
          </div>
        ))}
      </div>

      <div className="admin-table-card">
        <div className="admin-table-head">
          <span className="admin-table-head-title">Pagos {total ? `(${total})` : ''}</span>
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
            <Loader size={26} style={{ animation: 'spin 1s linear infinite', color: 'var(--violet)' }} />
          </div>
        ) : error ? (
          <p style={{ textAlign:'center', padding:'40px 0', color:'var(--text-3)' }}>No se pudieron cargar los pagos.</p>
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Curso</th>
                    <th>Monto</th>
                    <th>Proveedor</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{fontSize:13,fontWeight:600}}>{p.user?.name ?? '—'}</div>
                        <div style={{fontSize:11,color:'var(--text-3)'}}>{p.user?.email}</div>
                      </td>
                      <td style={{fontSize:13}}>{p.course?.title ?? '—'}</td>
                      <td style={{fontSize:13,fontWeight:700}}>
                        {p.currency === 'USD' ? 'USD ' : '$'}{(p.amount ?? 0).toLocaleString()}
                      </td>
                      <td style={{fontSize:13,color:'var(--text-2)',textTransform:'capitalize'}}>{p.provider ?? '—'}</td>
                      <td style={{fontSize:13,color:'var(--text-2)'}}>{p.paidAt ? new Date(p.paidAt).toLocaleDateString('es-AR') : '—'}</td>
                      <td><span className="badge badge-green">Aprobado</span></td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign:'center', padding:'32px 0', color:'var(--text-3)' }}>Sin pagos todavía</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:14, padding:'16px 0' }}>
                <button className="action-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14}/></button>
                <span style={{ fontSize:13, color:'var(--text-3)' }}>Página {page} de {totalPages}</span>
                <button className="action-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14}/></button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
