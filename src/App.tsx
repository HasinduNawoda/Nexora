import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop"; 
import Homepage from "./pages/Homepage";
import ArticlePage from "./pages/ArticlePage";
import About from "./pages/About";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ArticleList from "./pages/admin/ArticleList";
import ArticleEditor from "./pages/admin/ArticleEditor";
import CategoryManager from "./pages/admin/CategoryManager";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("nexora_admin_token");
  return token ? <>{children}</> : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Homepage />} />
        <Route path="/articles/:slug" element={<ArticlePage />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />

        {/* Admin auth */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected admin routes */}
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/articles" element={<ProtectedRoute><ArticleList /></ProtectedRoute>} />
        <Route path="/admin/articles/new" element={<ProtectedRoute><ArticleEditor /></ProtectedRoute>} />
        <Route path="/admin/articles/:id/edit" element={<ProtectedRoute><ArticleEditor /></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute><CategoryManager /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
