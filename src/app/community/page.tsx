import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Heart, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Community Builds',
  description: 'Browse seeded ShiftForge build journals and tuning concepts.',
};

const builds = [
  ['Night Shift', 'Apex S2', 'Midnight · 20″ deep dish · street aero', '143', '28'],
  ['Signal Run', 'Vector RS', 'Signal Red · 19″ mesh · track aero', '211', '41'],
  ['Acid Test', 'Rook T', 'Acid Lime · 18″ five spoke · wing', '97', '19'],
  ['Copper Mile', 'Apex S2', 'Copper · 21″ aero disc · clean body', '184', '33'],
  ['White Noise', 'Vector RS', 'Porcelain · 20″ mesh · low stance', '260', '54'],
  ['Paddock Blue', 'Rook T', 'Electric Blue · 19″ mesh · track aero', '156', '25'],
];

export default function CommunityPage() {
  return (
    <main className="page-shell">
      <section className="page-hero">
        <span className="eyebrow">COMMUNITY JOURNALS</span>
        <h1>Steal the idea.<br />Not the parts list.</h1>
        <p>
          Seeded build journals keep every screen useful while making it clear
          these are concept specs, not customer testimonials or verified fitment.
        </p>
      </section>
      <section className="journal-grid">
        {builds.map(([title, car, spec, likes, comments], index) => (
          <article className="journal-card" key={title}>
            <div className={'journal-art journal-art-' + ((index % 3) + 1)}>
              <span className="mini-car-shape" />
              <span className="journal-index">0{index + 1}</span>
            </div>
            <div className="journal-copy">
              <span className="eyebrow">{car}</span>
              <h2>{title}</h2>
              <p>{spec}</p>
              <div className="social-row">
                <span><Heart size={15} /> {likes}</span>
                <span><MessageCircle size={15} /> {comments}</span>
              </div>
            </div>
          </article>
        ))}
      </section>
      <div className="center-cta">
        <Link className="btn btn-primary" href="/studio">
          Start your build <ArrowRight size={16} />
        </Link>
      </div>
    </main>
  );
}
