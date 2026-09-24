import { Gauge, Wind, CircleDot } from 'lucide-react';
import WheelIcon from './WheelIcon';

/** Catalog artwork: vector wheel face for wheels, category glyph for everything else. */
export default function PartArt({ category, style, color }: { category: string; style: string; color?: string }) {
  if (category === 'wheels') return <WheelIcon style={style} color={color} />;
  if (category === 'tires')
    return (
      <svg viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="46" fill="#111" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="#2a2a2e" strokeWidth="6" strokeDasharray="4 3" />
        <circle cx="50" cy="50" r="30" fill="#1a1a1d" stroke="#333" strokeWidth="2" />
        <circle cx="50" cy="50" r="12" fill="#26262a" />
      </svg>
    );
  const Icon = category === 'suspension' ? Gauge : category === 'aero' ? Wind : CircleDot;
  return <Icon strokeWidth={1.1} color="#9ca3af" aria-hidden />;
}
