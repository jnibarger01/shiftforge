import type { Metadata } from 'next';
import { Suspense } from 'react';
import AuthForm from '@/components/auth/AuthForm';

export const metadata: Metadata = { title: 'New password', robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <AuthForm mode="reset" />
    </Suspense>
  );
}
