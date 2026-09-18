import type { Metadata } from 'next';
import GarageClient from '@/components/GarageClient';

export const metadata: Metadata = {
  title: 'My Garage',
  description: 'Review locally saved ShiftForge concepts and sync cloud build copies.',
};

export default function GaragePage() {
  return (
    <main className="page-shell">
      <section className="page-hero compact-hero">
        <span className="eyebrow">BUILD HISTORY</span>
        <h1>Your garage.</h1>
        <p>Local by default. Cloud sync only when you ask for it.</p>
      </section>
      <GarageClient />
    </main>
  );
}
