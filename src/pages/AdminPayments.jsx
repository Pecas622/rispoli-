import { Fragment, useState, useEffect, useCallback } from 'react';
import { Loader, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Check, X, Trash2 } from 'lucide-react';
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
  const [togglingId,        setTogglingId]        = useState(null); // id en vuelo al incluir/excluir del total
  const [deletingPayment,   setDeletingPayment]   = useState(null); // pago a confirmar antes de eliminar
  const [removingId,        setRemovingId]        = useState(null); // id en vuelo mientras se elimina

  const [expandedId,     setExpandedId]     = useState(null); // pago con el detalle de cuotas abierto
  const [installments,   setInstallments]   = useState({});   // enrollmentId -> cuotas[]
  const [loadingCuotas,  setLoadingCuotas]   = useState(false);
  const [togglingCuotaId, setTogglingCuotaId] = useState(null);

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

  // No toca el acceso del alumno ni borra el pago: solo lo saca (o lo vuelve
  // a meter) en las cuentas de recaudado/promedio de acá abajo.
  const toggleExclude = async (payment) => {
    setTogglingId(payment.id);
    const nextValue = !payment.excludeFromStats;
    try {
      await paymentsApi.toggleExclude(payment.id, nextValue);
      setPayments(prev => prev.map(p => p.id === payment.id ? { ...p, excludeFromStats: nextValue } : p));
      showToast(nextValue ? 'Excluido del total' : 'Vuelve a contar en el total');
    } catch (err) {
      showToast(err.message || 'No se pudo actualizar', 'error');
    } finally {
      setTogglingId(null);
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

  const toggleExpand = async (payment) => {
    const next = expandedId === payment.id ? null : payment.id;
    setExpandedId(next);
    if (next && !installments[payment.id]) {
      setLoadingCuotas(true);
      try {
        const res = await paymentsApi.getInstallments(payment.id);
        setInstallments(prev => ({ ...prev, [payment.id]: res.installments }));
      } catch (err) {
        showToast(err.message || 'No se pudieron cargar las cuotas', 'error');
        setExpandedId(null);
      } finally {
        setLoadingCuotas(false);
      }
    }
  };

  const toggleCuotaPaid = async (enrollmentId, cuota) => {
    setTogglingCuotaId(cuota.id);
    const nextPaid = !cuota.paidAt;
    try {
      const res = await paymentsApi.markInstallment(cuota.id, nextPaid);
      setInstallments(prev => ({
        ...prev,
        [enrollmentId]: prev[enrollmentId].map(c => c.id === cuota.id ? res.installment : c),
      }));
    } catch (err) {
      showToast(err.message || 'No se pudo actualizar la cuota', 'error');
    } finally {
      setTogglingCuotaId(null);
    }
  };

  // Recaudado/promedio se calculan aparte por moneda (mezclar ARS y USD en
  // una sola suma no significa nada) y sin contar reembolsados ni excluidos.
  const countedPayments = payments.filter(p => p.status !== 'reembolsado' && !p.excludeFromStats);
  const arsPayments = countedPayments.filter(p => (p.currency ?? 'ARS') === 'ARS');
  const usdPayments = countedPayments.filter(p => p.currency === 'USD');
  const cuotasPayments = countedPayments.filter(p => (p.installments ?? 1) > 1);
  const sum = (arr) => arr.reduce((a, p) => a + (p.amount || 0), 0);

  const stats = [
    { label: 'Recaudado en pesos',   val: `$${sum(arsPayments).toLocaleString('es-AR')}` },
    { label: 'Recaudado en dólares', val: `USD ${sum(usdPayments).toLocaleString('es-AR')}` },
    { label: 'Pagos en cuotas',      val: cuotasPayments.length },
    { label: 'Pagos (esta página)',  val: payments.length },
  ];

  return (
    <div className="container">
      <div className="admin-stats">
        {stats.map(({ label, val }) => (
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
                    <th>Cuotas</th>
                    <th>Proveedor</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <Fragment key={p.id}>
                    <tr style={p.excludeFromStats ? { opacity: 0.5 } : undefined}>
                      <td>
                        <div style={{fontSize:13,fontWeight:600}}>{p.user?.name ?? '—'}</div>
                        <div style={{fontSize:11,color:'var(--text-3)'}}>{p.user?.email}</div>
                      </td>
                      <td style={{fontSize:13}}>{p.course?.title ?? '—'}</td>
                      <td style={{fontSize:13,fontWeight:700}}>
                        {p.currency === 'USD' ? 'USD ' : '$'}{(p.amount ?? 0).toLocaleString()}
                      </td>
                      <td style={{fontSize:13,color:'var(--text-2)'}}>
                        {p.installments > 1 ? (
                          <button
                            onClick={() => toggleExpand(p)}
                            style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', color:'var(--violet)', fontSize:13, fontWeight:600, padding:0 }}
                          >
                            {p.installments}x
                            {expandedId === p.id ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                          </button>
                        ) : p.installments === 1 ? 'Único' : '—'}
                      </td>
                      <td style={{fontSize:13,color:'var(--text-2)',textTransform:'capitalize'}}>{p.provider ?? '—'}</td>
                      <td style={{fontSize:13,color:'var(--text-2)'}}>{p.paidAt ? new Date(p.paidAt).toLocaleDateString('es-AR') : '—'}</td>
                      <td>
                        {p.status === 'reembolsado'
                          ? <span className="badge badge-red">Reembolsado</span>
                          : <span className="badge badge-green">Aprobado</span>}
                        {p.excludeFromStats && <div style={{fontSize:10,color:'var(--text-3)',marginTop:2}}>Excluido del total</div>}
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
                            onClick={() => toggleExclude(p)}
                            disabled={togglingId === p.id}
                            title="No toca el acceso del alumno, solo lo saca del total/promedio"
                          >
                            {togglingId === p.id ? 'Guardando...' : p.excludeFromStats ? 'Incluir en el total' : 'Excluir del total'}
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setDeletingPayment(p)}
                            disabled={removingId === p.id}
                            title="Borra el registro por completo — para cargas de prueba, no para reembolsos reales"
                            style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                          >
                            {removingId === p.id ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }}/> : <Trash2 size={12}/>}
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === p.id && (
                      <tr>
                        <td colSpan={8} style={{ background:'var(--bg-2)', padding:'12px 16px' }}>
                          {loadingCuotas && !installments[p.id] ? (
                            <div style={{ display:'flex', justifyContent:'center', padding:'12px 0' }}>
                              <Loader size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--violet)' }} />
                            </div>
                          ) : (
                            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                              {(installments[p.id] ?? []).map(c => (
                                <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12, fontSize:13 }}>
                                  <span style={{ width:60, color:'var(--text-2)' }}>Cuota {c.number}/{p.installments}</span>
                                  <span style={{ width:100, fontWeight:600 }}>
                                    {p.currency === 'USD' ? 'USD ' : '$'}{c.amount.toLocaleString()}
                                  </span>
                                  <span style={{ width:110, color:'var(--text-3)' }}>
                                    {c.dueDate ? new Date(c.dueDate).toLocaleDateString('es-AR') : '—'}
                                  </span>
                                  {c.paidAt
                                    ? <span className="badge badge-green">Pagada {new Date(c.paidAt).toLocaleDateString('es-AR')}</span>
                                    : <span className="badge badge-red">Pendiente</span>}
                                  <button
                                    className="btn btn-outline btn-sm"
                                    onClick={() => toggleCuotaPaid(p.id, c)}
                                    disabled={togglingCuotaId === c.id}
                                    style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4 }}
                                  >
                                    {togglingCuotaId === c.id
                                      ? 'Guardando...'
                                      : c.paidAt
                                        ? <><X size={12}/> Marcar pendiente</>
                                        : <><Check size={12}/> Marcar pagada</>}
                                  </button>
                                </div>
                              ))}
                              {(installments[p.id] ?? []).length === 0 && (
                                <span style={{ fontSize:13, color:'var(--text-3)' }}>Sin cuotas registradas.</span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  ))}
                  {payments.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign:'center', padding:'32px 0', color:'var(--text-3)' }}>Sin pagos todavía</td></tr>
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
              Se borra por completo el pago de <strong style={{ color: 'var(--text)' }}>{deletingPayment.user?.name}</strong> por
              {' '}<strong style={{ color: 'var(--text)' }}>{deletingPayment.course?.title}</strong>, junto con su acceso al curso
              y el detalle de cuotas si tenía. No queda en el historial. Usá esto solo para cargas de prueba —
              para un reembolso real usá "Revocar acceso", que sí deja registro. Esta acción no se puede deshacer.
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
                Eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
