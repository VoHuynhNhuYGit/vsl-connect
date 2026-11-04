import { FormEvent, useEffect, useRef, useState } from 'react';
import { Icon } from '../ui/Icon';
import { AdminPagination } from './AdminPagination';
import { Status } from './CourseManager';
import { MediaUpload } from './MediaUpload';
import { apiRequest, type AdminLesson, useAdminCourses, usePagedAdminResource } from '../../services/adminApi';

type LessonForm = Omit<AdminLesson, 'id'>;
const blankForm: LessonForm = { course_id: 0, title: '', description: '', position: 1, video_url: null, captions_url: null, is_published: false };
const inputClass = 'mt-1.5 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm';

export function LessonManager({ csrfToken }: { csrfToken: string }) {
  const { data: lessons, loading, error, refresh, offset, setOffset, pageSize } = usePagedAdminResource<AdminLesson>('/admin/lessons');
  const { data: courses, error: coursesError, retry: retryCourses } = useAdminCourses();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<LessonForm>(blankForm);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const formVersion = useRef(0);
  const currentVersion = formVersion.current;
  const courseById = new Map(courses?.map((course) => [course.id, course.title]));

  useEffect(() => { if (!form.course_id && courses?.[0]) setForm((previous) => ({ ...previous, course_id: courses[0].id })); }, [courses, form.course_id]);
  function reset() { formVersion.current += 1; setEditingId(null); setForm({ ...blankForm, course_id: courses?.[0]?.id ?? 0 }); setMessage(''); }
  function edit(lesson: AdminLesson) { formVersion.current += 1; setEditingId(lesson.id); setForm({ ...lesson }); setMessage(''); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploading) return;
    setSaving(true); setMessage('');
    try { await apiRequest(`/admin/lessons${editingId ? `/${editingId}` : ''}`, { method: editingId ? 'PUT' : 'POST', body: form, csrfToken }); reset(); refresh(); }
    catch (requestError) { setMessage(requestError instanceof Error ? requestError.message : 'Không thể lưu bài học.'); }
    finally { setSaving(false); }
  }

  async function remove(lesson: AdminLesson) {
    if (!window.confirm(`Xóa bài học “${lesson.title}”? Thao tác này không thể hoàn tác.`)) return;
    setMessage('');
    try { await apiRequest(`/admin/lessons/${lesson.id}`, { method: 'DELETE', csrfToken }); if (editingId === lesson.id) reset(); refresh(); }
    catch (requestError) { setMessage(requestError instanceof Error ? requestError.message : 'Không thể xóa bài học.'); }
  }

  if (coursesError) return <div role="alert" className="rounded-2xl bg-surface-container-lowest p-6 text-error">{coursesError} <button type="button" onClick={retryCourses} className="ml-2 rounded-lg bg-surface-container px-3 py-2 text-label-md text-primary">Thử lại</button></div>;
  return <section aria-labelledby="lessons-title">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h2 id="lessons-title" className="text-headline-lg">Bài học</h2><p className="mt-1 text-body-sm text-on-surface-variant">Quản lý bài học, video và trạng thái xuất bản.</p></div><button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-label-md text-on-primary"><Icon name="add" />Bài học mới</button></div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"><div><div className="overflow-x-auto rounded-2xl border border-surface-container bg-surface-container-lowest shadow-card">
      {loading ? <p role="status" className="p-6">Đang tải bài học...</p> : error ? <div className="p-6"><p role="alert" className="text-error">{error}</p><button type="button" onClick={refresh} className="mt-3 text-primary">Thử lại</button></div> : lessons?.length ? <table className="w-full min-w-[42rem] text-left"><thead className="bg-surface-container-low text-label-sm"><tr><th className="p-4">Bài học</th><th className="p-4">Khóa học</th><th className="p-4">Thứ tự</th><th className="p-4">Trạng thái</th><th className="p-4">Thao tác</th></tr></thead><tbody>{lessons.map((lesson) => <tr key={lesson.id} className="border-t border-surface-container"><td className="p-4">{lesson.title}</td><td className="p-4">{courseById.get(lesson.course_id) || `Khóa học #${lesson.course_id}`}</td><td className="p-4">{lesson.position}</td><td className="p-4"><Status published={lesson.is_published} /></td><td className="p-4"><button type="button" onClick={() => edit(lesson)} className="p-2 text-primary" aria-label={`Sửa ${lesson.title}`}><Icon name="edit" /></button><button type="button" onClick={() => remove(lesson)} className="p-2 text-error" aria-label={`Xóa ${lesson.title}`}><Icon name="delete" /></button></td></tr>)}</tbody></table> : <p className="p-6">Chưa có bài học nào.</p>}
    </div>{!loading && !error && <AdminPagination offset={offset} pageSize={pageSize} count={lessons?.length ?? 0} onChange={setOffset} />}</div>
    <form onSubmit={submit} className="h-fit rounded-2xl border border-surface-container bg-surface-container-lowest p-5 shadow-card"><div className="flex justify-between"><h3 className="text-headline-sm">{editingId ? 'Chỉnh sửa bài học' : 'Bài học mới'}</h3>{editingId && <button type="button" onClick={reset} className="text-primary">Hủy</button>}</div>{message && <p role="alert" className="mt-4 rounded-lg bg-error-container p-3 text-error">{message}</p>}
      <label className="mt-5 block text-label-md">Khóa học<select required value={form.course_id} onChange={(event) => setForm({ ...form, course_id: Number(event.target.value) })} disabled={!courses?.length} className={inputClass}><option value={0}>Chọn khóa học</option>{courses?.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>{courses && !courses.length && <p className="mt-2 text-error">Hãy tạo khóa học trước khi thêm bài học.</p>}
      <label className="mt-4 block text-label-md">Tên bài học<input required maxLength={200} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={inputClass} /></label>
      <label className="mt-4 block text-label-md">Thứ tự<input required type="number" min={1} max={1000000} value={form.position} onChange={(event) => setForm({ ...form, position: Number(event.target.value) })} className={inputClass} /></label>
      <label className="mt-4 block text-label-md">URL video<input maxLength={2048} value={form.video_url ?? ''} onChange={(event) => setForm({ ...form, video_url: event.target.value || null })} className={inputClass} /></label>
      <MediaUpload csrfToken={csrfToken} videoOnly onBusyChange={setUploading} onUploaded={(result) => {
        if (formVersion.current !== currentVersion) {
          setMessage('Biểu mẫu đã thay đổi trong khi tải lên. Video có trong Cloudinary Media Library nhưng chưa được gắn vào bài học.');
          return;
        }
        setForm((previous) => ({ ...previous, video_url: result.url }));
      }} />
      <label className="mt-4 block text-label-md">URL phụ đề<input maxLength={2048} value={form.captions_url ?? ''} onChange={(event) => setForm({ ...form, captions_url: event.target.value || null })} className={inputClass} /></label>
      <label className="mt-4 block text-label-md">Mô tả<textarea rows={3} maxLength={10000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={inputClass} /></label>
      <label className="mt-4 flex items-center gap-2 text-label-md"><input type="checkbox" checked={form.is_published} onChange={(event) => setForm({ ...form, is_published: event.target.checked })} />Xuất bản ngay</label>
      <button disabled={saving || uploading || !courses?.length || !form.course_id} type="submit" className="mt-5 w-full rounded-lg bg-primary px-4 py-2.5 text-label-md text-on-primary disabled:opacity-60">{saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Tạo bài học'}</button>
    </form></div>
  </section>;
}
