import { createContext, useContext, useState, useEffect } from 'react';
import { initialCourseContent } from '../data/courseContent';

const AppContext = createContext();

const MOCK_USERS = [
  { id:1, name:'Admin EduTech', email:'admin@edutech.com', password:'admin123', role:'admin', avatar:'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80', enrolledCourses:[1,2,3] },
  { id:2, name:'Juan Estudiante', email:'juan@email.com', password:'123456', role:'student', avatar:'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&q=80', enrolledCourses:[1,3] },
];

export function AppProvider({ children }) {
  const [theme, setTheme]     = useState(() => localStorage.getItem('theme') || 'dark');
  const [user,  setUser]      = useState(() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } });
  const [users, setUsers]     = useState(MOCK_USERS);
  const [toast, setToast]     = useState(null);
  const [authModal, setAuthModal] = useState(null);
  const [courseContent, setCourseContent] = useState(initialCourseContent);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
  }, [toast]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const showToast   = (message, type = 'success') => setToast({ message, type });

  const login = (email, password) => {
    const found = users.find(u => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...safe } = found;
      setUser(safe); showToast(`Bienvenido, ${safe.name.split(' ')[0]}!`); setAuthModal(null); return true;
    }
    showToast('Credenciales incorrectas', 'error'); return false;
  };

  const register = (name, email, password) => {
    if (users.find(u => u.email === email)) { showToast('Email ya registrado', 'error'); return false; }
    const nu = { id: Date.now(), name, email, password, role: 'student', avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=5B21B6&color=fff`, enrolledCourses: [] };
    setUsers(p => [...p, nu]);
    const { password: _, ...safe } = nu;
    setUser(safe); showToast(`Cuenta creada. Bienvenido, ${name.split(' ')[0]}!`); setAuthModal(null); return true;
  };

  const logout = () => { setUser(null); showToast('Sesión cerrada'); };

  const enrollCourse = (courseId) => {
    if (!user) { setAuthModal('login'); return; }
    if (user.enrolledCourses.includes(courseId)) { showToast('Ya estás inscripto en este curso', 'info'); return; }
    const updated = { ...user, enrolledCourses: [...user.enrolledCourses, courseId] };
    setUser(updated);
    setUsers(p => p.map(u => u.id === user.id ? { ...u, enrolledCourses: [...u.enrolledCourses, courseId] } : u));
    showToast('¡Inscripción exitosa!');
  };

  const isEnrolled = (courseId) => user?.enrolledCourses?.includes(courseId);

  // ── Content management ─────────────────────────────────────────────────────

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
      theme, toggleTheme,
      user, login, register, logout,
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
