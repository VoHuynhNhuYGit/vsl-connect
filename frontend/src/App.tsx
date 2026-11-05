import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
import { LearningPathPage } from './pages/LearningPathPage';
import { CoursePage } from './pages/CoursePage';
import { DictionaryPage } from './pages/DictionaryPage';
import { LessonPage } from './pages/LessonPage';
import { ReviewPage } from './pages/ReviewPage';
import { CommunicationPage } from './pages/CommunicationPage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { useEffect } from 'react';

function AdminRedirect() {
  useEffect(() => {
    const url = new URL(window.location.href);
    url.hostname = 'admin.localhost';
    url.pathname = '/';
    window.location.replace(url.href);
  }, []);
  return <p>Đang chuyển đến trang quản trị...</p>;
}

export default function App() {
  const hostname = window.location.hostname.toLowerCase();
  if (hostname === 'admin.localhost') {
    return (
      <div className="admin-app min-h-screen">
        <Routes>
          <Route path="/" element={<AdminPage />} />
          <Route path="*" element={<Navigate to={{ pathname: '/', search: window.location.search }} replace />} />
        </Routes>
      </div>
    );
  }
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="lo-trinh-hoc-tap" element={<LearningPathPage />} />
        <Route path="lo-trinh-hoc-tap/:slug" element={<CoursePage />} />
        <Route path="tu-dien-ky-hieu" element={<DictionaryPage />} />
        <Route path="luyen-tap" element={<LessonPage />} />
        <Route path="on-tap" element={<ReviewPage />} />
        <Route path="giao-tiep" element={<CommunicationPage />} />
        <Route path="admin" element={hostname === 'localhost' || hostname === '127.0.0.1' ? <AdminRedirect /> : <AdminPage />} />
        <Route path="dang-nhap" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
