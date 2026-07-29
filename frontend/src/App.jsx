import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { statsAPI } from './services/api.js';
import Cursor from './components/Cursor.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Catalogue from './pages/Catalogue.jsx';
import LivreSemaine from './pages/LivreSemaine.jsx';
import Apropos from './pages/Apropos.jsx';
import Emprunts from './pages/Emprunts.jsx';
import GrandsHommes from './pages/GrandsHommes.jsx';
import AdminLogin    from './pages/admin/AdminLogin.jsx';
import AdminLayout   from './pages/admin/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminLivres   from './pages/admin/AdminLivres.jsx';
import AdminEmprunts from './pages/admin/AdminEmprunts.jsx';
import AdminMembres  from './pages/admin/AdminMembres.jsx';
import AdminSemaine  from './pages/admin/AdminSemaine.jsx';
import AdminLogs     from './pages/admin/AdminLogs.jsx';
import AdminGestion  from './pages/admin/AdminGestion.jsx';
import AdminParametres from './pages/admin/AdminParametres.jsx';
import AdminGrandsHommes from './pages/admin/AdminGrandsHommes.jsx';
import AdminDonations from './pages/admin/AdminDonations.jsx';
import LivreDetail from './pages/LivreDetail.jsx';
import Benevoles from './pages/Benevoles.jsx';

function ProtectedAdmin() {
  const { isAuth, loading } = useAuth();
  console.log('ProtectedAdmin render', { isAuth, loading, pathname: window.location.pathname });
  if (loading) return null; // Attend que le contexte soit initialisé
  return isAuth ? <AdminLayout /> : <Navigate to="/admin/login" replace />;
}

function PublicLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/"               element={<Home />} />
          <Route path="/catalogue"      element={<Catalogue />} />
          <Route path="/livre/:id"      element={<LivreDetail />} />
          <Route path="/livre-semaine"  element={<LivreSemaine />} />
          <Route path="/apropos"        element={<Apropos />} />
          <Route path="/emprunts"       element={<Emprunts />} />
          <Route path="/grands-hommes"  element={<GrandsHommes />} />
          <Route path="/benevoles"      element={<Benevoles />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  useEffect(() => {
    const key = 'cci_visited_' + new Date().toISOString().split('T')[0];
    if (!sessionStorage.getItem(key)) {
      statsAPI.trackVisit();
      sessionStorage.setItem(key, '1');
    }
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Cursor />
          <Routes>
            {/* Page de connexion admin */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Zone protégée admin avec sous-routes */}
            <Route path="/admin/*" element={<ProtectedAdmin />}>
              <Route index                 element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard"      element={<AdminDashboard />} />
              <Route path="livres"         element={<AdminLivres />} />
              <Route path="emprunts"       element={<AdminEmprunts />} />
              <Route path="membres"        element={<AdminMembres />} />
              <Route path="semaine"        element={<AdminSemaine />} />
              <Route path="logs"           element={<AdminLogs />} />
              <Route path="gestion-admins" element={<AdminGestion />} />
              <Route path="parametres"     element={<AdminParametres />} />
              <Route path="grands-hommes"  element={<AdminGrandsHommes />} />
              <Route path="donations"      element={<AdminDonations />} />
            </Route>

            {/* Pages publiques */}
            <Route path="/*" element={<PublicLayout />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}