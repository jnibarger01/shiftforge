'use client';

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { api } from '@/lib/client-api';

export default function DeleteOwnerBuild({ id, title }: { id: number; title: string }) {
  const router = useRouter();
  return (
    <button
      className="btn btn-danger"
      onClick={async () => {
        if (!confirm(`Delete “${title}” and its photos? This cannot be undone.`)) return;
        try {
          await api(`/api/owner-builds/${id}`, { method: 'DELETE' });
          router.push('/community-builds');
          router.refresh();
        } catch (err) {
          alert((err as Error).message);
        }
      }}
    >
      <Trash2 size={15} aria-hidden /> Delete
    </button>
  );
}
