import Link from 'next/link';
import {
  ArrowRight,
  Boxes,
  Camera,
  Check,
  Gauge,
  Layers3,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { comparisons } from '@/lib/comparisons';

const featuredParts = [
  ['R-19 Mesh GT', 'Wheel concept', '$420 / wheel', '19 × 9.5'],
  ['Streetline V2', 'Aero package', '$1,850', 'splitter + skirts'],
  ['Coil-4', 'Suspension concept', '$1,290', '32-way adjustable'],
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow accent">REALTIME 3D · OPTIONAL AI</span>
          <h1>Build it before<br />you buy it.</h1>
          <p>
            Tune paint, wheels, stance and aero in a live 3D studio. When the
            spec is right, turn that exact viewport into a photoreal AI concept.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary btn-large" href="/studio">
              Open 3D Studio <ArrowRight size={18} />
            </Link>
            <Link className="btn btn-secondary btn-large" href="/compare">
              Compare tools
            </Link>
          </div>
          <div className="hero-proof">
            <span><Check size={15} /> No login for 3D</span>
            <span><Check size={15} /> Saves on device</span>
            <span><Check size={15} /> Real AI generation</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="ShiftForge concept car">
          <div className="hero-grid" />
          <div className="concept-car">
            <span className="car-cabin" />
            <span className="car-body" />
            <span className="car-wheel front" />
            <span className="car-wheel rear" />
            <span className="car-light" />
          </div>
          <div className="hud hud-top">
            <span>APEX S2</span><strong>BUILD 001</strong>
          </div>
          <div className="hud hud-bottom">
            <span>19″ MESH</span><span>-28 MM</span><span>PORCELAIN</span>
          </div>
        </div>
      </section>

      <section className="metric-strip">
        <div><strong>&lt; 1 sec</strong><span>3D changes</span></div>
        <div><strong>3</strong><span>original platforms</span></div>
        <div><strong>0</strong><span>required subscriptions</span></div>
        <div><strong>1 flow</strong><span>3D → AI concept</span></div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <span className="eyebrow">THE CORE LOOP</span>
          <h2>Experiment fast. Render only when it matters.</h2>
          <p>
            The expensive part of a build should not be finding out the idea
            looked better in your head.
          </p>
        </div>
        <div className="feature-grid">
          <article className="feature-card">
            <span className="feature-number">01</span>
            <Layers3 size={25} />
            <h3>Configure live</h3>
            <p>Switch platforms, paint finishes, wheel styles, diameter, stance and aero with instant feedback.</p>
          </article>
          <article className="feature-card">
            <span className="feature-number">02</span>
            <Gauge size={25} />
            <h3>Inspect from every angle</h3>
            <p>Orbit and zoom the actual 3D scene. Save variants locally before choosing a direction.</p>
          </article>
          <article className="feature-card">
            <span className="feature-number">03</span>
            <Sparkles size={25} />
            <h3>Photorealize the winner</h3>
            <p>Send the configured viewport into a real image model to produce an editorial concept render.</p>
          </article>
        </div>
      </section>

      <section className="dark-band">
        <div className="band-copy">
          <span className="eyebrow accent">THE STUDIO</span>
          <h2>A tuning desk, not a prompt box.</h2>
          <p>
            The 3D state is the source of truth. AI is the final visualization
            layer, not a random image generator pretending to be a configurator.
          </p>
          <Link className="text-link" href="/studio">Launch the studio <ArrowRight size={16} /></Link>
        </div>
        <div className="band-specs">
          <div><Boxes size={20} /><span>Body</span><strong>3 platforms</strong></div>
          <div><Gauge size={20} /><span>Stance</span><strong>0–70 range</strong></div>
          <div><Camera size={20} /><span>Scenes</span><strong>3 environments</strong></div>
          <div><Sparkles size={20} /><span>AI</span><strong>GPT Image via Puter</strong></div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading split-heading">
          <div>
            <span className="eyebrow">SAMPLE CATALOG</span>
            <h2>Build around plausible parts.</h2>
          </div>
          <p>
            Seeded concept data keeps the marketplace useful without pretending
            these are verified fitment listings.
          </p>
        </div>
        <div className="product-grid">
          {featuredParts.map(([name, type, price, spec], index) => (
            <article className="product-card" key={name}>
              <div className={'product-art art-' + (index + 1)}>
                <span>{type}</span>
              </div>
              <div className="product-meta">
                <span className="eyebrow">{type}</span>
                <h3>{name}</h3>
                <div><strong>{price}</strong><span>{spec}</span></div>
              </div>
            </article>
          ))}
        </div>
        <div className="center-cta">
          <Link className="btn btn-secondary" href="/marketplace">Browse sample marketplace</Link>
        </div>
      </section>

      <section className="compare-teaser">
        <div>
          <span className="eyebrow accent">BUYER’S GUIDE</span>
          <h2>Not every car visualizer does the same job.</h2>
          <p>
            We compared ShiftForge with realtime 3D configurators and photo-first AI
            tools using current product information checked September 17, 2026.
          </p>
          <Link className="btn btn-primary" href="/compare">Open comparison hub</Link>
        </div>
        <div className="compare-link-grid">
          {comparisons.map((item) => (
            <Link href={'/compare/' + item.slug} key={item.slug}>
              <span>ShiftForge vs</span>
              <strong>{item.name}</strong>
              <ArrowRight size={17} />
            </Link>
          ))}
        </div>
      </section>

      <section className="trust-strip">
        <ShieldCheck size={24} />
        <div>
          <strong>Concept visualization only.</strong>
          <span>
            Always verify real dimensions, clearances, load ratings, legality
            and manufacturer fitment data before buying or installing parts.
          </span>
        </div>
      </section>
    </main>
  );
}
