import { createContext, useContext, useState, useEffect } from 'react';
import { initialCourseContent } from '../data/courseContent';
import { authApi, paymentsApi } from '../services/api';

const AppContext = createContext();

// ── Feature flag: set to true once the backend is running ─
const USE_REAL_API = import.meta.env.VITE_USE_API === 'true';

// ── Mock fallback (used when USE_REAL_API = false) ────────
const MOCK_USERS = [
  { id:1, name:'Admin GO Travel Academy', email:'admin@gotravelacademy.com', password:'admin123', role:'admin', avatar:'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80', enrolledCourses:[1,2,3] },
  { id:2, name:'Juan Estudiante', email:'juan@email.com', password:'123456', role:'student', avatar:'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&q=80', enrolledCourses:[1,3] },
];

export function AppProvider({ children }) {
  const [user,               setUser]              = useState(() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } });
  const [users,              setUsers]             = useState(MOCK_USERS);
  const [toast,              setToast]             = useState(null);
  const [authModal,          setAuthModal]         = useState(null);
  const [pendingVerification, setPendingVerification] = useState(null); // { email }
  const [checkoutModal,      setCheckoutModal]     = useState(null); // { courseId } — mock checkout
  const [courseContent,      setCourseContent]     = useState(initialCourseContent);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
  }, [toast]);

  const showToast   = (message, type = 'success') => setToast({ message, type });

  // ── Auth ─────────────────────────────────────────────────

  const login = async (email, password) => {
    if (USE_REAL_API) {
      try {
        const data = await authApi.login(email, password);
        // Si el email no está verificado, el backend devuelve 403 con code EMAIL_NOT_VERIFIED
        // pero como lanzamos error en request(), lo manejamos en el catch
        const { token, user: apiUser } = data;
        localStorage.setItem('access_token', token);
        const normalized = { ...apiUser, role: apiUser.role.toLowerCase(), enrolledCourses: [] };
        setUser(normalized);
        showToast(`Bienvenido, ${normalized.name.split(' ')[0]}!`);
        setAuthModal(null);
        return { success: true };
      } catch (err) {
        // El backend devuelve { code: 'EMAIL_NOT_VERIFIED', email } para cuentas sin verificar
        if (err.code === 'EMAIL_NOT_VERIFIED' || err.message?.includes('Verificá tu email')) {
          setPendingVerification({ email });
          setAuthModal(null);
          return { success: false, requiresVerification: true, email };
        }
        showToast(err.message || 'Credenciales incorrectas', 'error');
        return { success: false };
      }
    }

    // Mock fallback
    const found = users.find(u => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...safe } = found;
      setUser(safe); showToast(`Bienvenido, ${safe.name.split(' ')[0]}!`); setAuthModal(null);
      return { success: true };
    }
    showToast('Credenciales incorrectas', 'error');
    return { success: false };
  };

  const register = async (name, email, password) => {
    if (USE_REAL_API) {
      try {
        const data = await authApi.register(name, email, password);
        if (data.requiresVerification) {
          setPendingVerification({ email });
          setAuthModal(null);
          return { success: false, requiresVerification: true, email };
        }
        // Fallback por si el backend devuelve token directo
        localStorage.setItem('access_token', data.token);
        const normalized = { ...data.user, role: data.user.role.toLowerCase(), enrolledCourses: [] };
        setUser(normalized);
        showToast(`Cuenta creada. Bienvenido, ${name.split(' ')[0]}!`);
        setAuthModal(null);
        return { success: true };
      } catch (err) {
        showToast(err.message || 'Error al crear la cuenta', 'error');
        return { success: false };
      }
    }

    // Mock fallback
    if (users.find(u => u.email === email)) { showToast('Email ya registrado', 'error'); return { success: false }; }
    const nu = { id: Date.now(), name, email, password, role: 'student', avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=5B21B6&color=fff`, enrolledCourses: [] };
    setUsers(p => [...p, nu]);
    const { password: _, ...safe } = nu;
    setUser(safe); showToast(`Cuenta creada. Bienvenido, ${name.split(' ')[0]}!`); setAuthModal(null);
    return { success: true };
  };

  const verifyEmail = async (email, code) => {
    try {
      const { token, user: apiUser } = await authApi.verifyEmail(email, code);
      localStorage.setItem('access_token', token);
      const normalized = { ...apiUser, role: apiUser.role.toLowerCase(), enrolledCourses: [] };
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
      await authApi.resendCode(email);
      showToast('Código reenviado. Revisá tu email.');
      return true;
    } catch (err) {
      showToast(err.message || 'Error al reenviar', 'error');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    showToast('Sesión cerrada');
  };

  // ── Enrollments ───────────────────────────────────────────

  const enrollCourse = async (courseId) => {
    if (!user) { setAuthModal('login'); return; }

    if (USE_REAL_API) {
      try {
        const { url } = await paymentsApi.checkout(courseId);
        window.location.href = url; // Redirect to Stripe Checkout
      } catch (err) {
        showToast(err.message || 'Error al procesar el pago', 'error');
      }
      return;
    }

    // Mock fallback — abre el modal de checkout simulado
    if (user.enrolledCourses.includes(courseId)) { showToast('Ya estás inscripto en este curso', 'info'); return; }
    setCheckoutModal({ courseId });
  };

  // Confirma la inscripción luego de que el mock checkout aprueba el pago
  const confirmMockEnroll = (courseId) => {
    if (!user) return;
    const updated = { ...user, enrolledCourses: [...user.enrolledCourses, courseId] };
    setUser(updated);
    setUsers(p => p.map(u => u.id === user.id ? { ...u, enrolledCourses: [...u.enrolledCourses, courseId] } : u));
    showToast('¡Inscripción exitosa!');
  };

  const isEnrolled = (courseId) => user?.enrolledCourses?.includes(courseId);

  // ── Content management (always local state for now) ───────

  const getCourseContent = (courseId) =>
    courseContent[courseId] ?? { modules: [] };

  const addModule = (courseId, data) => {
    const id = `mod_${Date.now()}`;
    setCourseContent(prev => {
      const cur = prev[courseId] ?? { modules: [] };
      return { ...prev, [courseId]: { ...cur, modules: [...cur.modules, { ...data, id, lessons: [] }] } };
    });
    showToast('Módulo creado');
  };

  const updateModule = (courseId, moduleId, data) => {
    setCourseContent(prev => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        modules: prev[courseId].modules.map(m => m.id === moduleId ? { ...m, ...data } : m),
      },
    }));
    showToast('Módulo actualizado');
  };

  const deleteModule = (courseId, moduleId) => {
    setCourseContent(prev => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        modules: prev[courseId].modules.filter(m => m.id !== moduleId),
      },
    }));
    showToast('Módulo eliminado', 'info');
  };

  const reorderModules = (courseId, modules) => {
    setCourseContent(prev => ({ ...prev, [courseId]: { ...prev[courseId], modules } }));
  };

  const addLesson = (courseId, moduleId, data) => {
    const id = `les_${Date.now()}`;
    setCourseContent(prev => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        modules: prev[courseId].modules.map(m =>
          m.id === moduleId ? { ...m, lessons: [...m.lessons, { ...data, id }] } : m
        ),
      },
    }));
    showToast('Clase creada');
  };

  const updateLesson = (courseId, moduleId, lessonId, data) => {
    setCourseContent(prev => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        modules: prev[courseId].modules.map(m =>
          m.id === moduleId
            ? { ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, ...data } : l) }
            : m
        ),
      },
    }));
    showToast('Clase actualizada');
  };

  const deleteLesson = (courseId, moduleId, lessonId) => {
    setCourseContent(prev => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        modules: prev[courseId].modules.map(m =>
          m.id === moduleId ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) } : m
        ),
      },
    }));
    showToast('Clase eliminada', 'info');
  };

  const reorderLessons = (courseId, moduleId, lessons) => {
    setCourseContent(prev => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        modules: prev[courseId].modules.map(m => m.id === moduleId ? { ...m, lessons } : m),
      },
    }));
  };

  return (
    <AppContext.Provider value={{
      user, login, register, logout,
      verifyEmail, resendVerificationCode,
      pendingVerification, setPendingVerification,
      checkoutModal, setCheckoutModal, confirmMockEnroll,
      enrollCourse, isEnrolled,
      toast, showToast,
      authModal, setAuthModal,
      getCourseContent,
      addModule, updateModule, deleteModule, reorderModules,
      addLesson, updateLesson, deleteLesson, reorderLessons,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
