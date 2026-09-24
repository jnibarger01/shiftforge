export default function Loading() {
  return (
    <div className="container page" aria-busy="true" aria-label="Loading">
      <div className="skeleton" style={{ height: 34, width: 280, marginBottom: 20 }} />
      <div className="grid">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="skeleton" style={{ aspectRatio: '16 / 12' }} />
        ))}
      </div>
    </div>
  );
}
