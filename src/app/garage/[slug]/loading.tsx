export default function LabLoading() {
  return (
    <div className="lab" aria-busy="true" aria-label="Loading the 3D Mods Lab">
      <div className="lab-panel" style={{ padding: 16, gap: 12 }}>
        <div className="skeleton" style={{ height: 30 }} />
        <div className="skeleton" style={{ height: 40 }} />
        <div className="skeleton" style={{ flex: 1 }} />
      </div>
      <div className="lab-stage">
        <div className="car-viewer-state">
          <span className="spinner" aria-hidden /> Loading 3D Mods Lab…
        </div>
      </div>
    </div>
  );
}
