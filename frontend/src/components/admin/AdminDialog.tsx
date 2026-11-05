import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../ui/Icon';

type Props = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export function AdminDialog({ open, title, children, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  if (!open) return null;
  return createPortal(<div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/35 p-3 backdrop-blur-sm sm:items-center sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title" className="my-auto w-full max-w-xl rounded-3xl border border-white/80 bg-surface-container-lowest p-5 shadow-modal sm:p-6">
      <div className="-mt-5 -mx-5 mb-5 flex items-center justify-between gap-4 border-b border-surface-container bg-surface-container-lowest px-5 py-4 sm:-mt-6 sm:-mx-6 sm:px-6">
        <h3 id="admin-dialog-title" className="text-headline-md">{title}</h3>
        <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface" aria-label="Đóng cửa sổ"><Icon name="close" className="text-[22px]" /></button>
      </div>
      {children}
    </section>
  </div>, document.body);
}
