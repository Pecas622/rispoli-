import { useState, useEffect, useCallback } from 'react';
import { Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { paymentsApi, enrollmentsApi } from '../services/api';

export default function AdminPayments() {
  const { showToast } = useApp();

  const [payments,   setPayments]   = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(null); // pago a confirmar antes de revocar
  const [revokingId,        setRevokingId]        = useState(null); // id en vuelo mientras se procesa
  const [deletingPayment,   setDeletingPayment]   = useState(null); // pago a confirmar antes de eliminar
  const [removingId,        setRemovingId]        = useState(null); // id en vuelo mientras se elimina

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    paymentsApi.adminList({ page, limit: 20 })
      .then(res => { setPayments(res.payments); setTotal(res.total); setTotalPages(res.totalPages); })
      .catch(() => { setError(true); showToast('Error al cargar los pagos', 'error'); })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const confirmRevoke = async () => {
    const payment = confirmingPayment;
    setConfirmingPayment(null);
    setRevokingId(payment.id);
    try {
      await enrollmentsApi.revoke(payment.id);
      setPayments(prev => prev.map(p => p.id === payment.id ? { ...p, status: 'reembolsado', refundedAt: new Date().toISOString() } : p));
      showToast('Acceso revocado. Le avisamos por mail al alumno.');
    } catch (err) {
      showToast(err.message || 'No se pudo revocar el acceso', 'error');
    } finally {
      setRevokingId(null);
    }
  };

  const confirmDelete = async () => {
    const payment = deletingPayment;
    setDeletingPayment(null);
    setRemovingId(payment.id);
    try {
      await paymentsApi.remove(payment.id);
      setPayments(prev => prev.filter(p => p.id !== payment.id));
      setTotal(prev => Math.max(0, prev - 1));
      showToast('Pago eliminado');
    } catch (err) {
      showToast(err.message || 'No se pudo eliminar el pago', 'error');
    } finally {
      setRemovingId(null);
    }
  };

  const paymentsOk  = payments.filter(p => p.status !== 'reembolsado');
  const totalRecaudado = paymentsOk.reduce((a, p) => a + (p.amount || 0), 0);

  return (
    <div className="container">
      <div className="admin-stats">
        {[
          { label: 'Pagos (esta página)', val: payments.length },
          { label: 'Total de pagos',       val: total },
          { label: 'Recaudado (esta página)', val: `$${totalRecaudado.toLocaleString()}` },
          { label: 'Promedio por pago', val: paymentsOk.length ? `$${Math.round(totalRecaudado / paymentsOk.length).toLocaleString()}` : '$0' },
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
                    <th>Acciones</th>
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
                      <td>
                        {p.status === 'reembolsado'
                          ? <span className="badge badge-red">Reembolsado</span>
                          : <span className="badge badge-green">Aprobado</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {p.status !== 'reembolsado' && (
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => setConfirmingPayment(p)}
                              disabled={revokingId === p.id}
                            >
                              {revokingId === p.id ? 'Revocando...' : 'Revocar acceso'}
                            </button>
                          )}
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                            onClick={() => setDeletingPayment(p)}
                            disabled={removingId === p.id}
                            title="Elimina el registro por completo (no queda en el historial)"
                          >
                            {removingId === p.id ? 'Eliminando...' : 'Eliminar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign:'center', padding:'32px 0', color:'var(--text-3)' }}>Sin pagos todavía</td></tr>
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

      {confirmingPayment && (
        <div className="modal-overlay" onClick={() => setConfirmingPayment(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <p className="modal-title">¿Revocar acceso?</p>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24, lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text)' }}>{confirmingPayment.user?.name}</strong> va a perder el
              acceso a <strong style={{ color: 'var(--text)' }}>{confirmingPayment.course?.title}</strong> y le
              va a volver a aparecer la opción de comprarlo. Le mandamos un mail avisándole. Esta acción no se
              puede deshacer desde acá.
            </p>
            <div className="form-actions">
              <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setConfirmingPayment(null)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center', background: 'var(--red)', borderColor: 'var(--red)' }}
                onClick={confirmRevoke}
              >
                Revocar acceso
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingPayment && (
        <div className="modal-overlay" onClick={() => setDeletingPayment(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <p className="modal-title">¿Eliminar este pago?</p>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24, lineHeight: 1.6 }}>
              Se borra por completo el registro de <strong style={{ color: 'var(--text)' }}>{deletingPayment.user?.name}</strong> —{' '}
              <strong style={{ color: 'var(--text)' }}>{deletingPayment.course?.title}</strong>. A diferencia de
              "Revocar acceso", esto <strong style={{ color: 'var(--text)' }}>no deja rastro en el historial</strong> —
              usalo para limpiar cargas de prueba o datos erróneos, no para reembolsos reales. El alumno pierde el
              acceso igual. No se puede deshacer.
            </p>
            <div className="form-actions">
              <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setDeletingPayment(null)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center', background: 'var(--red)', borderColor: 'var(--red)' }}
                onClick={confirmDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
