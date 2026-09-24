import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import SettingsForm from '@/components/auth/SettingsForm';

export const metadata: Metadata = { title: 'Settings', robots: { index: false } };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/signin?next=/settings');
  return (
    <div className="container page" style={{ maxWidth: 680 }}>
      <h1 className="page-title" style={{ marginBottom: 16 }}>
        Settings<span className="accent">.</span>
      </h1>
      <SettingsForm user={{ name: user.name, email: user.email, bio: user.bio, location: user.location, womenBuilder: user.womenBuilder, id: user.id }} />
    </div>
  );
}
