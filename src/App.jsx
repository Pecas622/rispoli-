import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import './index.css';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import CompleteProfileModal from './components/CompleteProfileModal';
import VerifyEmailModal from './components/VerifyEmailModal';
import CheckoutModal from './components/CheckoutModal';
import Toast from './components/Toast';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Instructor from './pages/Instructor';
import CourseContent from './pages/CourseContent';
import Learn from './pages/Learn';
import ResetPassword from './pages/ResetPassword';
import { Empresas, Nosotros, Blog, Contacto, Privacidad, Terminos, Cookies } from './pages/StaticPages';
import { Certificaciones, Descargas, Perfil, Pagos } from './pages/UserPages';
import { loadPixel, pixelTrack } from './lib/pixel';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// Meta Pixel: carga una vez y dispara PageView en cada cambio de página
function PixelTracker() {
  const { pathname } = useLocation();
  useEffect(() => { loadPixel(); }, []);
  useEffect(() => { pixelTrack('PageView'); }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '200px 24px' }}>
      <div style={{ fontSize: 80, fontWeight: 900 }}>404</div>
      <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Página no encontrada</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>La página que buscás no existe.</p>
      <a href="/" className="btn btn-primary">Volver al inicio</a>
    </div>
  );
}

function Layout() {
  return (
    <AppProvider>
      <ScrollToTop />
      <PixelTracker />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <AuthModal />
      <CompleteProfileModal />
      <VerifyEmailModal />
      <CheckoutModal />
      <Toast />
    </AppProvider>
  );
}

// vite-react-ssg espera las rutas en formato "data router" (array de objetos
// con path/element/children), no el <Routes><Route> declarativo de antes —
// así puede generar HTML estático por ruta en el build. El componente y el
// comportamiento en el navegador son los mismos que antes.
export const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'cursos', element: <Courses /> },
      { path: 'cursos/:id', element: <CourseDetail /> },
      { path: 'cursos/:id/aprender', element: <Learn /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'admin', element: <Admin /> },
      { path: 'instructor', element: <Instructor /> },
      { path: 'admin/courses/:id/content', element: <CourseContent /> },
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'certificaciones', element: <Certificaciones /> },
      { path: 'descargas', element: <Descargas /> },
      { path: 'pagos', element: <Pagos /> },
      { path: 'perfil', element: <Perfil /> },
      { path: 'empresas', element: <Empresas /> },
      { path: 'nosotros', element: <Nosotros /> },
      { path: 'blog', element: <Blog /> },
      { path: 'contacto', element: <Contacto /> },
      { path: 'privacidad', element: <Privacidad /> },
      { path: 'terminos', element: <Terminos /> },
      { path: 'cookies', element: <Cookies /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];
