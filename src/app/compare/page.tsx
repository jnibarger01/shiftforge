import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { comparisons } from '@/lib/comparisons';

export const metadata: Metadata = {
  title: 'Best Car Customization Tools & Alternatives in 2026',
  description:
    'Compare ShiftForge with MODS Nation, 3DTuning, STuner, CarModSnap, TunedRides and ModMyCar for 3D car customization, AI rendering, pricing and workflow.',
  openGraph: {
    title: 'Best Car Customization Tools & Alternatives in 2026',
    description:
      'Current side-by-side comparisons for 3D configurators and AI car visualizers.',
  },
  alternates: {
    canonical: 'https://jnibarger01.github.io/shiftforge/compare/',
  },
};

export default function ComparePage() {
  return (
    <main className="page-shell compare-hub">
      <section className="page-hero compare-hero">
        <span className="eyebrow accent">COMPARISON HUB · 2026</span>
        <h1>The right car visualizer depends on what you need to see.</h1>
        <p>
          Some products are deep 3D configurators. Others modify photos with AI.
          ShiftForge sits between them: live 3D exploration first, optional
          photoreal rendering second.
        </p>
      </section>

      <section className="compare-principles">
        <div>
          <CheckCircle2 size={19} />
          <strong>Current product facts</strong>
          <span>Official product and pricing pages checked September 17, 2026.</span>
        </div>
        <div>
          <CheckCircle2 size={19} />
          <strong>Different jobs stay different</strong>
          <span>Photo AI tools are not treated as interchangeable with 3D tuners.</span>
        </div>
        <div>
          <CheckCircle2 size={19} />
          <strong>No fake weaknesses</strong>
          <span>Competitor advantages are called out when they are genuinely stronger.</span>
        </div>
      </section>

      <section className="comparison-list">
        {comparisons.map((item, index) => (
          <article className="comparison-card" key={item.slug}>
            <div className="comparison-index">0{index + 1}</div>
            <div className="comparison-copy">
              <span className="eyebrow">{item.category}</span>
              <h2>ShiftForge vs {item.name}</h2>
              <p>{item.intro}</p>
              <div className="compare-mini-grid">
                <div><span>Best ShiftForge edge</span><strong>{item.shiftforgeEdge}</strong></div>
                <div><span>{item.name} edge</span><strong>{item.competitorEdge}</strong></div>
              </div>
            </div>
            <Link className="compare-arrow" href={'/compare/' + item.slug} aria-label={'Compare ShiftForge with ' + item.name}>
              <ArrowRight size={21} />
            </Link>
          </article>
        ))}
      </section>

      <section className="notice-card compare-notice">
        <div>
          <strong>Want to evaluate the workflow instead of reading about it?</strong>
          <p>Open the live 3D studio, change a build, save it, then decide whether the optional AI step adds anything useful.</p>
        </div>
        <Link className="btn btn-primary" href="/studio">Try ShiftForge <ArrowRight size={16} /></Link>
      </section>
    </main>
  );
}
