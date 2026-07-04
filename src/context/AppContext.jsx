import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, enrollmentsApi, usersApi } from '../services/api';

const AppContext = createContext();

// ── Feature flag: set to true once the backend is running ─
const USE_REAL_API = import.meta.env.VITE_USE_API === 'true';

export function AppProvider({ children }) {
  const [user,               setUser]              = useState(() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } });
  const [toast,              setToast]             = useState(null);
  const [authModal,          setAuthModal]         = useState(null);
  const [pendingVerification, setPendingVerification] = useState(null); // { email }
  const [enrollments,        setEnrollments]       = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [region,             setRegion]            = useState(() => localStorage.getItem('region') || null);
  const [showRegionModal,    setShowRegionModal]   = useState(false);
  const [checkoutModal,      setCheckoutModal]     = useState(null); // curso en checkout demo, o null

  const selectRegion = (code, silent = false) => {
    localStorage.setItem('region', code);
    setRegion(code);
    setShowRegionModal(false);
    if (!silent) {
      const label = code === 'AR' ? '🇦🇷 Argentina · ARS' : '🌍 Internacional · USD';
      setToast({ message: `Región: ${label}`, type: 'success' });
    }
  };

  // Auto-detección de región por IP (solo la primera vez)
  useEffect(() => {
    if (localStorage.getItem('region')) return;
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        const code = data.country_code === 'AR' ? 'AR' : 'WORLD';
        selectRegion(code, false);
      })
      .catch(() => selectRegion('AR', true));
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  // El token vive en una cookie httpOnly (no accesible desde JS): confirmamos
  // la sesión contra el backend al montar en vez de confiar en el cache local.
  useEffect(() => {
    authApi.me()
      .then(({ user: apiUser }) => {
        setUser({ ...apiUser, role: apiUser.role.toLowerCase() });
      })
      .catch(() => setUser(null));
  }, []);

  // Inscripciones reales del usuario (para isEnrolled, Dashboard, Certificaciones, Descargas, Perfil)
  const refreshEnrollments = useCallback(() => {
    if (!USE_REAL_API || !user) { setEnrollments([]); return; }
    setEnrollmentsLoading(true);
    enrollmentsApi.mine()
      .then(({ enrollments }) => setEnrollments(enrollments))
      .catch(() => setEnrollments([]))
      .finally(() => setEnrollmentsLoading(false));
  }, [user?.id]);

  useEffect(() => { refreshEnrollments(); }, [refreshEnrollments]);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
  }, [toast]);

  const showToast   = (message, type = 'success') => setToast({ message, type });

  // ── Auth ─────────────────────────────────────────────────

  const showDevCode = (devCode) => {
    if (devCode) showToast(`[DEV] Tu código: ${devCode}`, 'info');
  };

  const login = async (email, password) => {
    try {
      const data = await authApi.login(email, password);
      // Login exitoso (credenciales válidas) → backend envía OTP al email
      if (data.requiresLoginCode) {
        setPendingVerification({ email, type: 'login', devCode: data.devCode });
        showDevCode(data.devCode);
        setAuthModal(null);
        return { success: false, requiresLoginCode: true, email };
      }
      return { success: false };
    } catch (err) {
      if (err.code === 'EMAIL_NOT_VERIFIED' || err.message?.includes('Verificá tu email')) {
        setPendingVerification({ email, type: 'registration', devCode: err.devCode });
        showDevCode(err.devCode);
        setAuthModal(null);
        return { success: false, requiresVerification: true, email };
      }
      showToast(err.message || 'Credenciales incorrectas', 'error');
      return { success: false };
    }
  };

  // Verifica el código OTP de login (paso 2 del 2FA)
  const verifyLoginCode = async (email, code) => {
    try {
      const { user: apiUser } = await authApi.verifyLogin(email, code);
      const normalized = { ...apiUser, role: apiUser.role.toLowerCase() };
      setUser(normalized);
      setPendingVerification(null);
      showToast(`Bienvenido, ${normalized.name.split(' ')[0]}!`);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'Código incorrecto' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const data = await authApi.register(name, email, password);
      if (data.requiresVerification) {
        setPendingVerification({ email, type: 'registration', devCode: data.devCode });
        showDevCode(data.devCode);
        setAuthModal(null);
        return { success: false, requiresVerification: true, email };
      }
      // Fallback por si el backend devuelve el usuario directo (sin verificación)
      const normalized = { ...data.user, role: data.user.role.toLowerCase() };
      setUser(normalized);
      showToast(`Cuenta creada. Bienvenido, ${name.split(' ')[0]}!`);
      setAuthModal(null);
      return { success: true };
    } catch (err) {
      showToast(err.message || 'Error al crear la cuenta', 'error');
      return { success: false };
    }
  };

  const verifyEmail = async (email, code) => {
    try {
      const { user: apiUser } = await authApi.verifyEmail(email, code);
      const normalized = { ...apiUser, role: apiUser.role.toLowerCase() };
      setUser(normalized);
      setPendingVerification(null);
      showToast(`¡Bienvenido, ${normalized.name.split(' ')[0]}! Cuenta verificada.`);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'Código incorrecto' };
    }
  };

  const resendVerificationCode = async (email) => {
    try {
      const data = await authApi.resendCode(email);
      showToast('Código reenviado. Revisá tu email.');
      if (data?.devCode) {
        setPendingVerification(prev => prev ? { ...prev, devCode: data.devCode } : prev);
        showDevCode(data.devCode);
      }
      return true;
    } catch (err) {
      showToast(err.message || 'Error al reenviar', 'error');
      return false;
    }
  };

  const forgotPassword = async (email) => {
    try {
      const data = await authApi.forgotPassword(email);
      showToast(data.message || 'Si el email existe, te enviamos instrucciones');
      return { success: true };
    } catch (err) {
      showToast(err.message || 'Error al solicitar el restablecimiento', 'error');
      return { success: false };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      const data = await authApi.resetPassword(token, password);
      showToast(data.message || 'Contraseña actualizada');
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'No se pudo restablecer la contraseña' };
    }
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    setUser(null);
    showToast('Sesión cerrada');
  };

  const updateProfile = async (data) => {
    try {
      const res = await usersApi.update(user.id, data);
      setUser(prev => ({ ...prev, ...res.user, role: res.user.role.toLowerCase() }));
      showToast('Perfil actualizado');
      return { success: true };
    } catch (err) {
      showToast(err.message || 'Error al actualizar el perfil', 'error');
      return { success: false };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const data = await authApi.changePassword(currentPassword, newPassword);
      showToast(data.message || 'Contraseña actualizada');
      return { success: true };
    } catch (err) {
      showToast(err.message || 'Error al cambiar la contraseña', 'error');
      return { success: false };
    }
  };

  // ── Enrollments ───────────────────────────────────────────

  const enrolledCourseIds = enrollments.map(e => e.courseId);

  // La pasarela de pago real (Stripe/Mercado Pago) todavía no está conectada
  // con credenciales productivas — por ahora esto abre un checkout de demo
  // que no procesa ningún cargo real ni otorga inscripción.
  const enrollCourse = (course) => {
    if (!user) { setAuthModal('login'); return; }
    if (enrolledCourseIds.includes(course.id)) { showToast('Ya estás inscripto en este curso', 'info'); return; }
    setCheckoutModal(course);
  };

  const isEnrolled = (courseId) => enrolledCourseIds.includes(courseId);

  return (
    <AppContext.Provider value={{
      user, login, register, logout,
      verifyEmail, verifyLoginCode, resendVerificationCode,
      forgotPassword, resetPassword, changePassword, updateProfile,
      pendingVerification, setPendingVerification,
      enrollCourse, isEnrolled,
      enrollments, enrollmentsLoading, refreshEnrollments,
      toast, showToast,
      authModal, setAuthModal,
      checkoutModal, setCheckoutModal,
      region, selectRegion, showRegionModal, setShowRegionModal,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
