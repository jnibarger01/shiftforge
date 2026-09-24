import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { listModels, modelLabel } from '@/lib/catalog';
import AddRideForm from '@/components/owner/AddRideForm';

export const metadata: Metadata = { title: 'Add your ride', robots: { index: false } };

export default async function NewOwnerBuildPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/signin?next=/owners-builds/new');
  return (
    <div className="container page" style={{ maxWidth: 760 }}>
      <h1 className="page-title">
        Add your ride<span className="accent">.</span>
      </h1>
      <p className="section-sub" style={{ marginBottom: 20 }}>
        Real cars go to the Owner&apos;s Club and enter this week&apos;s Real Cars division.
      </p>
      <AddRideForm models={listModels().map((m) => ({ id: m.id, label: modelLabel(m), from: m.yearFrom, to: m.yearTo }))} />
    </div>
  );
}
