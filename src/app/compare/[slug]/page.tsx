import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Check, ExternalLink, Minus, X } from 'lucide-react';
import { comparisons, getComparison } from '@/lib/comparisons';

const SITE = process.env.SITE_URL ?? 'http://localhost:3000';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return comparisons.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const comparison = getComparison(slug);
  if (!comparison) return {};

  const title =
    'ShiftForge vs ' + comparison.name + ': Features, Pricing & Which Fits in 2026';
  const description =
    'Compare ShiftForge and ' + comparison.name +
    ' for car visualization: 3D workflow, AI rendering, pricing, free options, speed, accuracy, ease of use, pros and cons.';

  return {
    title,
    description,
    alternates: {
      canonical: SITE + '/compare/' + slug,
    },
    openGraph: {
      type: 'article',
      title,
      description,
    },
  };
}

function valueIcon(value: string) {
  const normalized = value.toLowerCase();
  if (normalized === 'yes' || normalized.startsWith('yes,')) {
    return <Check size={15} aria-hidden="true" />;
  }
  if (normalized === 'no' || normalized.startsWith('no ')) {
    return <X size={15} aria-hidden="true" />;
  }
  return <Minus size={15} aria-hidden="true" />;
}

export default async function ComparisonPage({ params }: PageProps) {
  const { slug } = await params;
  const comparison = getComparison(slug);
  if (!comparison) notFound();

  const title = 'ShiftForge vs ' + comparison.name;
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'ShiftForge',
    category: 'Automotive visualization software',
    description:
      'A realtime 3D car customization tool with optional AI concept rendering.',
    brand: {
      '@type': 'Brand',
      name: 'ShiftForge',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: SITE + '/garage',
      description: 'Realtime 3D studio access',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: comparison.faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE + '/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Compare',
        item: SITE + '/compare/',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: title,
        item: SITE + '/compare/' + slug,
      },
    ],
  };

  const peers = comparisons.filter((item) => item.slug !== slug);

  return (
    <main className="page-shell comparison-detail">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span>/</span>
        <Link href="/compare">Compare</Link><span>/</span>
        <span>{comparison.name}</span>
      </nav>

      <section className="compare-detail-hero">
        <span className="eyebrow accent">2026 COMPARISON</span>
        <h1>ShiftForge vs {comparison.name}</h1>
        <p>{comparison.intro}</p>
        <div className="compare-hero-actions">
          <Link className="btn btn-primary btn-large" href="/garage">
            Try ShiftForge <ArrowRight size={17} />
          </Link>
          <a
            className="btn btn-secondary btn-large"
            href={comparison.sourceUrl}
            target="_blank"
            rel="noreferrer nofollow"
          >
            Visit {comparison.name} <ExternalLink size={16} />
          </a>
        </div>
      </section>

      <section className="comparison-summary-grid">
        <article>
          <span>Pricing</span>
          <p>{comparison.pricing}</p>
        </article>
        <article>
          <span>Free option</span>
          <p>{comparison.freeOption}</p>
        </article>
        <article>
          <span>Speed</span>
          <p>{comparison.speed}</p>
        </article>
        <article>
          <span>Accuracy</span>
          <p>{comparison.accuracy}</p>
        </article>
        <article>
          <span>Ease of use</span>
          <p>{comparison.ease}</p>
        </article>
        <article>
          <span>Best for</span>
          <p>{comparison.bestFor}</p>
        </article>
      </section>

      <section className="comparison-table-wrap">
        <div className="section-heading">
          <span className="eyebrow">FEATURES SIDE BY SIDE</span>
          <h2>What is actually different?</h2>
        </div>
        <div className="comparison-table" role="table" aria-label={'ShiftForge compared with ' + comparison.name}>
          <div className="comparison-row comparison-head" role="row">
            <span role="columnheader">Capability</span>
            <strong role="columnheader">ShiftForge</strong>
            <strong role="columnheader">{comparison.name}</strong>
          </div>
          {comparison.features.map((row) => (
            <div className="comparison-row" role="row" key={row.label}>
              <span role="cell">{row.label}</span>
              <strong role="cell">{valueIcon(row.shiftforge)} {row.shiftforge}</strong>
              <strong role="cell">{valueIcon(row.competitor)} {row.competitor}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="verdict-grid">
        <article className="verdict-card shiftforge-card">
          <span className="eyebrow accent">CHOOSE SHIFTFORGE WHEN</span>
          <h2>{comparison.shiftforgeEdge}</h2>
          <p>
            ShiftForge makes the most sense when the main decision is visual:
            body proportion, wheel style, diameter, ride height, color and aero,
            with AI used only after the live 3D direction is settled.
          </p>
          <Link className="text-link" href="/garage">Open the 3D studio <ArrowRight size={16} /></Link>
        </article>
        <article className="verdict-card">
          <span className="eyebrow">CHOOSE {comparison.name.toUpperCase()} WHEN</span>
          <h2>{comparison.competitorEdge}</h2>
          <p>
            That is a real advantage, not a manufactured weakness. The better
            tool is the one whose core workflow matches the actual decision you
            are trying to make.
          </p>
          <a className="text-link" href={comparison.sourceUrl} target="_blank" rel="noreferrer nofollow">
            Check current product details <ExternalLink size={15} />
          </a>
        </article>
      </section>

      <section className="faq-section">
        <span className="eyebrow">FAQ</span>
        <h2>What people ask before switching.</h2>
        <div className="faq-list">
          {comparison.faqs.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="source-box">
        <strong>Research source</strong>
        <p>{comparison.sourceLabel}.</p>
        <a href={comparison.sourceUrl} target="_blank" rel="noreferrer nofollow">
          {comparison.sourceUrl} <ExternalLink size={13} />
        </a>
        <span>
          Product features and pricing can change. The page is written as a
          workflow comparison, not a fitment or engineering claim.
        </span>
      </section>

      <section className="related-compare">
        <div className="section-heading">
          <span className="eyebrow">KEEP COMPARING</span>
          <h2>Other alternatives.</h2>
        </div>
        <div className="related-grid">
          {peers.slice(0, 4).map((item) => (
            <Link key={item.slug} href={'/compare/' + item.slug}>
              <span>ShiftForge vs</span>
              <strong>{item.name}</strong>
              <ArrowRight size={16} />
            </Link>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <span className="eyebrow accent">TRY THE CORE FEATURE</span>
        <h2>Build one car before deciding.</h2>
        <p>The live 3D studio needs no account. Save locally, then use AI only if the concept needs a photoreal pass.</p>
        <div className="render-actions">
          <Link className="btn btn-primary btn-large" href="/garage">Start a build <ArrowRight size={18} /></Link>
          <Link className="btn btn-secondary btn-large" href="/signin">Sign in for cloud saves</Link>
        </div>
      </section>
    </main>
  );
}
