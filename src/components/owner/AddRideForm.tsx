'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { api } from '@/lib/client-api';

const MAX = 8;
const MAX_BYTES = 6 * 1024 * 1024;

export default function AddRideForm({ models }: { models: { id: number; label: string; from: number; to: number | null }[] }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const add = (list: FileList | null) => {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      if (!/^image\/(png|jpeg|webp)$/.test(f.type)) {
        setError(`${f.name}: only PNG, JPEG or WebP images`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        setError(`${f.name}: larger than 6 MB`);
        continue;
      }
      if (next.length >= MAX) {
        setError(`Up to ${MAX} photos`);
        break;
      }
      next.push(f);
    }
    setFiles(next);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    form.delete('photos');
    if (!files.length) return setError('Add at least one photo of your car');
    files.forEach((f) => form.append('photos', f));
    setBusy(true);
    try {
      const r = await api<{ href: string }>('/api/owner-builds', { form });
      router.push(r.href);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <form className="form panel" onSubmit={submit} noValidate>
      <div className="field">
        <span className="label">Photos (up to {MAX})</span>
        <div
          className={`dropzone${drag ? ' drag' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => input.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            add(e.dataTransfer.files);
          }}
        >
          <ImagePlus size={28} aria-hidden style={{ margin: '0 auto 8px' }} />
          Drop photos here or <span className="accent">browse</span>
          <div style={{ fontSize: 12, marginTop: 4 }}>PNG, JPEG or WebP · max 6 MB each</div>
        </div>
        <input ref={input} type="file" name="photos" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(e) => add(e.target.files)} data-testid="photo-input" />
        {previews.length > 0 && (
          <div className="upload-previews">
            {previews.map((p, i) => (
              <figure key={p}>
                <img src={p} alt={`Selected photo ${i + 1}`} />
                <button type="button" className="icon-btn glass" style={{ width: 26, height: 26 }} aria-label={`Remove photo ${i + 1}`} onClick={() => setFiles(files.filter((_, k) => k !== i))}>
                  <X size={14} aria-hidden />
                </button>
              </figure>
            ))}
          </div>
        )}
      </div>
      <div className="field">
        <label htmlFor="title">Title</label>
        <input id="title" name="title" className="input" required minLength={2} maxLength={80} placeholder="e.g. Silverstone Daily" />
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="modelId">Car</label>
          <select id="modelId" name="modelId" className="select" defaultValue="">
            <option value="">Other / not listed</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="year">Year</label>
          <input id="year" name="year" className="input" type="number" min={1950} max={2027} placeholder="2021" />
        </div>
        <div className="field">
          <label htmlFor="usage">Use</label>
          <select id="usage" name="usage" className="select" defaultValue="Daily">
            {['Daily', 'Weekend', 'Track', 'Show', 'Project'].map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="mods">Mods</label>
        <input id="mods" name="mods" className="input" maxLength={500} placeholder="Wheels, tires, suspension, aero…" />
      </div>
      <div className="field">
        <label htmlFor="description">Story</label>
        <textarea id="description" name="description" className="textarea" maxLength={2000} placeholder="How did you get it, what have you done, what is next?" />
      </div>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <div>
        <button className="btn btn-primary btn-lg" disabled={busy}>
          {busy ? 'Uploading…' : 'Publish to Owner’s Club'}
        </button>
      </div>
    </form>
  );
}
