import { Icon } from '../components/ui/Icon';

type PlaceholderPageProps = { title: string };

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <section className="w-full max-w-2xl rounded-2xl bg-surface-container-lowest p-10 text-center shadow-card">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-container"><Icon name="construction" className="text-[28px]" /></div>
        <p className="mb-2 text-label-sm uppercase tracking-[0.18em] text-primary">Nhóm trang tiếp theo</p>
        <h1 className="text-headline-lg">{title}</h1>
        <p className="mx-auto mt-3 max-w-lg text-body-lg text-on-surface-variant">Layout chung và điều hướng đã sẵn sàng. Nội dung chi tiết của màn hình này sẽ được chuyển từ Stitch ở bước tiếp theo.</p>
      </section>
    </div>
  );
}
