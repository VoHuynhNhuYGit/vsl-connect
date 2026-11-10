import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { Icon } from '../../components/ui/Icon';
import { UserAvatar } from '../../components/common/UserAvatar';
import { removeAvatar, uploadAvatar, type AdminUser } from '../../services/adminApi';

type Preview = { url: string; image: HTMLImageElement };

export function AvatarEditor({ user, csrfToken, onSaved, onBusyChange }: { user: AdminUser; csrfToken: string; onSaved: (user: AdminUser) => void; onBusyChange: (busy: boolean) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const selection = useRef(0);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [crop, setCrop] = useState({ zoom: 1, x: 50, y: 50 });
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const headingId = useId();
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);
  useEffect(() => () => { selection.current += 1; request.current?.abort(); }, []);

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const selectionId = ++selection.current;
    setError(''); setMessage('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Vui lòng chọn ảnh JPEG, PNG hoặc WebP.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Ảnh vượt quá 5 MB. Hãy chọn ảnh nhỏ hơn.'); return; }
    const url = URL.createObjectURL(file);
    setReading(true);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (minDimension(image) < 32 || image.naturalWidth * image.naturalHeight > 32_000_000) throw new Error('Ảnh cần từ 32 × 32 và không quá 32 triệu điểm ảnh.');
      if (selectionId !== selection.current) { URL.revokeObjectURL(url); return; }
      setCrop({ zoom: 1, x: 50, y: 50 }); setPreview({ url, image });
    } catch (failure) {
      URL.revokeObjectURL(url);
      if (selectionId === selection.current) setError(failure instanceof Error && failure.message.startsWith('Ảnh cần') ? failure.message : 'Không đọc được ảnh này. Hãy thử tệp khác.');
    } finally { if (selectionId === selection.current) setReading(false); }
  }

  function cropBounds() {
    if (!preview) return { size: 1, x: 0, y: 0 };
    const size = minDimension(preview.image) / crop.zoom;
    return { size, x: (preview.image.naturalWidth - size) * crop.x / 100, y: (preview.image.naturalHeight - size) * crop.y / 100 };
  }
  async function save() {
    if (!preview || busy) return;
    setBusy(true); onBusyChange(true); setError(''); setMessage('');
    const controller = new AbortController(); request.current = controller;
    try {
      const bounds = cropBounds();
      const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Trình duyệt chưa hỗ trợ xử lý ảnh.');
      context.drawImage(preview.image, bounds.x, bounds.y, bounds.size, bounds.size, 0, 0, 512, 512);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Không thể xử lý ảnh này.')), 'image/webp', .9));
      const updated = await uploadAvatar(blob, csrfToken, controller.signal);
      onSaved(updated); setPreview(null); setMessage('Đã cập nhật ảnh đại diện.');
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Không thể lưu ảnh đại diện.');
    } finally { if (!controller.signal.aborted) { setBusy(false); onBusyChange(false); } request.current = null; }
  }
  async function remove() {
    if (busy) return;
    setBusy(true); onBusyChange(true); setError(''); setMessage('');
    try { onSaved(await removeAvatar(csrfToken)); setMessage('Đã xóa ảnh đại diện.'); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Không thể xóa ảnh đại diện.'); }
    finally { setBusy(false); onBusyChange(false); }
  }
  const bounds = cropBounds();
  return <section className="account-card avatar-editor" aria-labelledby={headingId}>
    <div className="account-card-heading"><span><Icon name="add_a_photo" /></span><div><h2 id={headingId}>Ảnh đại diện</h2><p>Một hình ảnh nhỏ, mang dấu ấn của bạn.</p></div></div>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectFile} disabled={busy || reading} className="sr-only" aria-label="Chọn ảnh đại diện từ máy" />
    <div className="avatar-edit-stage">{preview ? <div className="avatar-crop-surface" aria-label="Xem trước vùng ảnh đại diện"><img src={preview.url} alt="Ảnh đại diện đang căn chỉnh" style={{ width: `${preview.image.naturalWidth / bounds.size * 100}%`, height: `${preview.image.naturalHeight / bounds.size * 100}%`, left: `${-bounds.x / bounds.size * 100}%`, top: `${-bounds.y / bounds.size * 100}%` }} /></div> : <UserAvatar name={user.display_name} src={user.avatar_url} className="h-36 w-36 text-4xl" label={`Ảnh đại diện của ${user.display_name}`} />}</div>
    <button type="button" className="account-button account-button--quiet" disabled={busy || reading} onClick={() => input.current?.click()}><Icon name="upload" />{reading ? 'Đang đọc ảnh…' : preview || user.avatar_url ? 'Chọn ảnh khác' : 'Chọn ảnh từ máy'}</button>
    <p className="avatar-file-hint">JPEG, PNG hoặc WebP · Tối đa 5 MB</p>
    {preview && <div className="avatar-crop-controls"><p>Điều chỉnh để khuôn mặt nằm gọn trong khung tròn.</p>{([{ key: 'zoom', label: 'Phóng to', min: 1, max: 3, step: .05 }, { key: 'x', label: 'Vị trí ngang', min: 0, max: 100, step: 1 }, { key: 'y', label: 'Vị trí dọc', min: 0, max: 100, step: 1 }] as const).map(control => <label key={control.key}><span>{control.label}<output>{control.key === 'zoom' ? `${Math.round(crop.zoom * 100)}%` : `${Math.round(crop[control.key])}%`}</output></span><input type="range" aria-label={control.label} min={control.min} max={control.max} step={control.step} value={crop[control.key]} disabled={busy} onChange={event => setCrop({ ...crop, [control.key]: Number(event.target.value) })} /></label>)}<p className="avatar-file-hint">Ảnh xem trước chưa được lưu.</p><div className="avatar-save-actions"><button type="button" className="account-button" disabled={busy} onClick={save}><Icon name="check" />{busy ? 'Đang lưu ảnh…' : 'Lưu ảnh'}</button><button type="button" className="account-button account-button--quiet" disabled={busy} onClick={() => { setPreview(null); setError(''); }}>Hủy</button></div></div>}
    {!preview && user.avatar_url && <button type="button" className="avatar-remove" disabled={busy || reading} onClick={remove}>{busy ? 'Đang cập nhật…' : 'Xóa ảnh hiện tại'}</button>}
    {error && <p className="account-message account-message--error" role="alert">{error}</p>}{message && <p className="account-message" role="status">{message}</p>}
  </section>;
}

function minDimension(image: HTMLImageElement) { return Math.min(image.naturalWidth, image.naturalHeight); }
