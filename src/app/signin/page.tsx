import type { Metadata } from 'next';
import AccountPanel from '@/components/AccountPanel';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Connect an optional Puter account for cloud build copies and AI generation.',
};

export default function SignInPage() {
  return (
    <main className="page-shell account-page">
      <AccountPanel />
    </main>
  );
}
