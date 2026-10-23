import { useState } from 'react';
import { ApiError } from '../../services/adminApi';

type MediaResult = { url: string; public_id: string; resource_type: 'image' | 'video' };
type Props = { csrfToken: string; onUploaded: (result: MediaResult) => void; onBusyChange?: (busy: boolean) => void; videoOnly?: boolean };

export function MediaUpload({ csrfToken, onUploaded, onBusyChange, videoOnly = false }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function upload() {
    if (!file) return;
    const limit = file.type.startsWith('image/') ? 10 : 50;
    if (file.size > limit * 1024 * 1024) {
      setMessage(`Tệp vượt quá giới hạn ${limit} MB.`);
      return;
    }
    setBusy(true);
    onBusyChange?.(true);
    setMessage('');
    try {
      const response = await fetch('/api/v1/admin/media/upload', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-CSRF-Token': csrfToken },
        body: file,
      });
      const payload = await response.json().catch(() => null) as (MediaResult & { detail?: string }) | null;
      if (!response.ok || !payload) throw new ApiError(response.status, payload?.detail || 'Không thể tải tệp lên.');
      onUploaded(payload);
      setMessage('Đã tải lên Cloudinary.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể tải tệp lên.');
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  }

  return <div className="mt-4 rounded-xl border border-outline-variant p-3">
    <label className="block text-label-md">{videoOnly ? 'Chọn video từ máy' : 'Chọn ảnh hoặc video từ máy'}
      <input type="file" accept={videoOnly ? 'video/mp4,video/webm,video/quicktime' : 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime'} disabled={busy} onChange={(event) => { setFile(event.target.files?.[0] ?? null); setMessage(''); }} className="mt-2 block w-full text-body-sm" />
    </label>
    <p className="mt-2 text-label-sm text-on-surface-variant">Ảnh tối đa 10 MB; video tối đa 50 MB.</p>
    <button type="button" disabled={!file || busy} onClick={upload} className="mt-3 rounded-lg bg-secondary-container px-3 py-2 text-label-md text-on-secondary-container disabled:opacity-50">{busy ? 'Đang tải lên...' : 'Tải lên Cloudinary'}</button>
    {message && <p role="status" className="mt-2 text-body-sm">{message}</p>}
  </div>;
}

export function MediaManager({ csrfToken }: { csrfToken: string }) {
  const [result, setResult] = useState<MediaResult | null>(null);
  const [copyMessage, setCopyMessage] = useState('');

  async function copyUrl() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.url);
      setCopyMessage('Đã sao chép đường dẫn.');
    } catch {
      setCopyMessage('Không thể sao chép tự động; hãy chọn và sao chép đường dẫn bên dưới.');
    }
  }

  return <section aria-labelledby="media-title">
    <h2 id="media-title" className="text-headline-lg">Hình ảnh &amp; video</h2>
    <p className="mt-1 text-body-sm text-on-surface-variant">Tải tệp lên Cloudinary và sao chép đường dẫn để sử dụng trong nội dung.</p>
    <div className="mt-6 max-w-2xl rounded-2xl border border-surface-container bg-surface-container-lowest p-5 shadow-card">
      <MediaUpload csrfToken={csrfToken} onUploaded={(uploaded) => { setResult(uploaded); setCopyMessage(''); }} />
      {result && <div className="mt-5">
        <label className="block text-label-md">Đường dẫn tệp<input readOnly value={result.url} className="mt-2 w-full rounded-lg border border-outline-variant px-3 py-2 text-body-sm" /></label>
        <button type="button" onClick={copyUrl} className="mt-3 rounded-lg bg-primary px-3 py-2 text-label-md text-on-primary">Sao chép đường dẫn</button>
        {copyMessage && <p role="status" className="mt-2 text-body-sm">{copyMessage}</p>}
        {result.resource_type === 'image' ? <img src={result.url} alt="Ảnh vừa tải lên" className="mt-4 max-h-80 max-w-full rounded-lg" /> : <video src={result.url} controls className="mt-4 max-h-80 max-w-full rounded-lg" />}
      </div>}
    </div>
  </section>;
}
