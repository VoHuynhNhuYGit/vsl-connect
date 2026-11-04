import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';

export function ReviewPage() {
  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12"><h1 className="mb-7 text-headline-xl">Ôn tập</h1><EmptyState icon="style" title="Chưa có nội dung ôn tập" description="Nội dung ôn tập sẽ được bổ sung sau."><Link to="/tu-dien-ky-hieu" className="inline-flex rounded-lg bg-primary px-4 py-2.5 text-label-md text-on-primary">Xem từ điển</Link></EmptyState></div>;
}
