import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
import { LearningPathPage } from './pages/LearningPathPage';
import { DictionaryPage } from './pages/DictionaryPage';
import { LessonPage } from './pages/LessonPage';
import { ReviewPage } from './pages/ReviewPage';
import { CommunicationPage } from './pages/CommunicationPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="lo-trinh-hoc-tap" element={<LearningPathPage />} />
        <Route path="tu-dien-ky-hieu" element={<DictionaryPage />} />
        <Route path="luyen-tap" element={<LessonPage />} />
        <Route path="on-tap" element={<ReviewPage />} />
        <Route path="giao-tiep" element={<CommunicationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
