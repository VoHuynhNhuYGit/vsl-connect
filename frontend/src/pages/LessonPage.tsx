import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';

export function LessonPage() {
  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12"><h1 className="mb-7 text-headline-xl">Luyện tập</h1><EmptyState icon="play_lesson" title="Chọn một bài học" description="Bài học có trong các khóa học đã xuất bản."><Link to="/lo-trinh-hoc-tap" className="inline-flex rounded-lg bg-primary px-4 py-2.5 text-label-md text-on-primary">Xem khóa học</Link></EmptyState></div>;
}
