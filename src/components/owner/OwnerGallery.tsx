'use client';

import { useState } from 'react';

export default function OwnerGallery({ photos, title }: { photos: string[]; title: string }) {
  const [i, setI] = useState(0);
  if (!photos.length) return <div className="gallery-main" />;
  return (
    <div>
      <div className="gallery-main">
        <img src={photos[i]} alt={`${title} — photo ${i + 1} of ${photos.length}`} />
      </div>
      {photos.length > 1 && (
        <div className="thumbs" role="group" aria-label="Photos">
          {photos.map((p, k) => (
            <button key={p} aria-pressed={k === i} aria-label={`Show photo ${k + 1}`} onClick={() => setI(k)}>
              <img src={p} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
