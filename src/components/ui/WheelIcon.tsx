import type { WheelStyle } from '@/lib/build-config';

const SPOKES: Record<WheelStyle, { n: number; w: number; pair?: boolean; cross?: boolean }> = {
  'five-spoke': { n: 5, w: 9 },
  'six-spoke': { n: 6, w: 7 },
  'split-spoke': { n: 5, w: 3.5, pair: true },
  'multi-spoke': { n: 10, w: 3.5 },
  mesh: { n: 10, w: 2, cross: true },
  monoblock: { n: 7, w: 3.5, pair: true },
  'deep-dish': { n: 5, w: 8 },
  turbofan: { n: 18, w: 2.5 },
};

/** Flat front-view illustration of a wheel design, used in catalog cards and the Lab picker. */
export default function WheelIcon({ style, color = '#c6c8cb', className, title }: { style: string; color?: string; className?: string; title?: string }) {
  const s = SPOKES[style as WheelStyle] ?? SPOKES['five-spoke'];
  const spokes: React.ReactNode[] = [];
  for (let i = 0; i < s.n; i++) {
    const a = (i * 360) / s.n;
    const offs = s.pair ? [-7, 7] : s.cross ? [-12, 12] : [0];
    offs.forEach((o, k) =>
      spokes.push(<rect key={`${i}-${k}`} x={50 - s.w / 2} y={s.cross ? 14 : 12} width={s.w} height={s.cross ? 24 : 26} rx={s.w / 3} fill={color} transform={`rotate(${a + o} 50 50)`} />),
    );
  }
  return (
    <svg viewBox="0 0 100 100" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <circle cx="50" cy="50" r="48" fill="#0b0b0d" />
      <circle cx="50" cy="50" r="38" fill="#1c1c20" stroke={style === 'deep-dish' ? '#e5e7ea' : color} strokeWidth={style === 'deep-dish' ? 6 : 2.5} />
      {style === 'turbofan' && <circle cx="50" cy="50" r="33" fill="#141417" />}
      {spokes}
      {(style === 'mesh' || style === 'turbofan') && <circle cx="50" cy="50" r="33" fill="none" stroke={color} strokeWidth="2" />}
      <circle cx="50" cy="50" r="10" fill={color} />
      <circle cx="50" cy="50" r="4.5" fill="#222" />
    </svg>
  );
}
