import type { Metadata } from 'next';
import CarStudio from '@/components/CarStudio';

export const metadata: Metadata = {
  title: '3D Car Customizer',
  description:
    'Configure paint, wheels, stance and aero in realtime 3D, save your build, and generate a photoreal AI concept.',
  openGraph: {
    title: 'ShiftForge 3D Car Customizer',
    description: 'Realtime 3D tuning with optional AI photoreal rendering.',
  },
};

export default function StudioPage() {
  return <CarStudio />;
}
