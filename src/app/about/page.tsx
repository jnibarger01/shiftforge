import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'About ShiftForge', description: 'What ShiftForge is, how the fitment math works, and the rules of the community.', alternates: { canonical: '/about' } };

export default function AboutPage() {
  return (
    <div className="container page" style={{ maxWidth: 820 }}>
      <h1 className="page-title">
        About ShiftForge<span className="accent">.</span>
      </h1>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>ShiftForge is a community for people who modify cars. Build your car in 3D, try real wheel and tire sizes against a fitment check, share the result, and vote on what everyone else is building.</p>
        <p>
          The <Link className="accent" href="/garage">3D Mods Lab</Link> uses each car&apos;s published factory fitment — bolt pattern, stock wheel size and offset, tire size — plus measured clearances to estimate how far a new wheel moves in or out, how the tire&apos;s diameter changes, and whether it will rub. It is a planning tool: measure your own car before ordering parts.
        </p>
      </div>
      <h2 id="guidelines" style={{ marginTop: 32, fontSize: 20 }}>Community guidelines</h2>
      <div className="prose" style={{ fontSize: 15 }}>
        <p>Post your own builds and photos. Be specific and kind in comments. One vote per entry per week; no vote rings or alt accounts. We remove harassment, spam and anything that is not yours to share.</p>
      </div>
      <h2 id="privacy" style={{ marginTop: 32, fontSize: 20 }}>Privacy</h2>
      <div className="prose" style={{ fontSize: 15 }}>
        <p>We store your email, a salted scrypt password hash, your profile, and the content you post. Sessions use an httpOnly cookie. We do not sell data or run third-party ad trackers. AI renders run through Puter under your own Puter account.</p>
      </div>
      <h2 id="terms" style={{ marginTop: 32, fontSize: 20 }}>Terms of sale</h2>
      <div className="prose" style={{ fontSize: 15 }}>
        <p>Checkout sends a quote request, not a payment. Sellers confirm fitment and the final price before anything is charged. Listings and prices in this build are demonstration data.</p>
      </div>
    </div>
  );
}
