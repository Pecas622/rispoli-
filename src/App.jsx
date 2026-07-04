import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import './index.css';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
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
import ResetPassword from './pages/ResetPassword';
import { Empresas, Nosotros, Blog, Contacto } from './pages/StaticPages';
import { Certificaciones, Descargas, Perfil } from './pages/UserPages';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Layout() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cursos" element={<Courses />} />
          <Route path="/cursos/:id" element={<CourseDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/instructor" element={<Instructor />} />
          <Route path="/admin/courses/:id/content" element={<CourseContent />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/certificaciones" element={<Certificaciones />} />
          <Route path="/descargas" element={<Descargas />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/empresas" element={<Empresas />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="*" element={
            <div style={{ textAlign: 'center', padding: '200px 24px' }}>
              <div style={{ fontSize: 80, fontWeight: 900 }}>404</div>
              <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Página no encontrada</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>La página que buscás no existe.</p>
              <a href="/" className="btn btn-primary">Volver al inicio</a>
            </div>
          } />
        </Routes>
      </main>
      <Footer />
      <AuthModal />
      <VerifyEmailModal />
      <CheckoutModal />
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AppProvider>
  );
}
