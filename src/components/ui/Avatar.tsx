type Props = { name: string; color: string; size?: number; round?: boolean };

export default function Avatar({ name, color, size = 22, round = false }: Props) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('');
  return (
    <span className={`avatar${round ? ' round' : ''}`} style={{ width: size, height: size, background: color, fontSize: Math.max(9, size * 0.42) }} aria-hidden>
      {initials || '?'}
    </span>
  );
}
