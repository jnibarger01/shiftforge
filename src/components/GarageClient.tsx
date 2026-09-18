'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cloud, RefreshCw, Trash2 } from 'lucide-react';
import { CAR_NAMES, type SavedBuild } from '@/lib/types';

export default function GarageClient() {
  const [builds, setBuilds] = useState<SavedBuild[]>([]);
  const [message, setMessage] = useState('Saved builds on this device');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = JSON.parse(
        window.localStorage.getItem('shiftforge-builds') || '[]',
      ) as SavedBuild[];
      setBuilds(saved);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const syncCloud = async () => {
    const puter = window.puter;
    if (!puter) {
      setMessage('Cloud service is still loading.');
      return;
    }
    try {
      if (!puter.auth.isSignedIn()) await puter.auth.signIn();
      const raw = await puter.kv.get('shiftforge:build-index');
      const cloud = Array.isArray(raw) ? (raw as SavedBuild[]) : [];
      const local = JSON.parse(
        window.localStorage.getItem('shiftforge-builds') || '[]',
      ) as SavedBuild[];
      const merged = [...cloud, ...local].filter(
        (item, index, all) => all.findIndex((other) => other.id === item.id) === index,
      ).slice(0, 30);
      window.localStorage.setItem('shiftforge-builds', JSON.stringify(merged));
      await puter.kv.set('shiftforge:build-index', merged);
      setBuilds(merged);
      setMessage('Local and cloud builds are synchronized.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Cloud sync failed.');
    }
  };

  const clearLocal = () => {
    if (!window.confirm('Clear saved builds from this device? Cloud copies are not deleted.')) return;
    window.localStorage.removeItem('shiftforge-builds');
    setBuilds([]);
    setMessage('Local garage cleared.');
  };

  return (
    <>
      <div className="garage-toolbar">
        <span>{message}</span>
        <div>
          <button className="btn btn-secondary" onClick={syncCloud}>
            <RefreshCw size={16} /> Sync cloud
          </button>
          <button className="btn btn-ghost-danger" onClick={clearLocal}>
            <Trash2 size={16} /> Clear local
          </button>
        </div>
      </div>

      {builds.length ? (
        <div className="build-grid">
          {builds.map((build) => (
            <article className="build-card" key={build.id}>
              <div
                className="build-swatch"
                style={{ background: build.config.paint }}
              >
                <span>{build.config.wheelSize}″</span>
              </div>
              <div>
                <span className="eyebrow">
                  {new Date(build.createdAt).toLocaleDateString()}
                </span>
                <h3>{CAR_NAMES[build.config.car]}</h3>
                <p>
                  {build.config.paintName} · {build.config.finish} · {build.config.wheel}
                  {' · '}{build.config.aero}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Cloud size={28} />
          <h2>Your garage is ready.</h2>
          <p>Save a build from the studio and it will appear here immediately.</p>
          <Link className="btn btn-primary" href="/studio">Create first build</Link>
        </div>
      )}
    </>
  );
}
