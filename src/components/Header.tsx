'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  BarChart3, BookOpen, Box, ChevronDown, Gavel, LayoutGrid, LogOut, MapPin, Menu, MessagesSquare, Moon, Newspaper, Package,
  Settings, ShoppingCart, Store, Sun, User, Warehouse, X,
} from 'lucide-react';
import Avatar from './ui/Avatar';

type HeaderUser = { id: number; name: string; color: string } | null;

const NAV = [
  { href: '/garage', label: '3D Mods Lab', icon: Box, match: ['/garage'] },
  { href: '/builds', label: 'Builds', icon: LayoutGrid, match: ['/builds'] },
  { href: '/magazine', label: 'Magazine', icon: Newspaper, match: ['/magazine'] },
  { href: '/journal', label: 'Journals', icon: BookOpen, match: ['/journal', '/articles'], isNew: true },
  { href: '/ratings', label: 'Ratings', icon: BarChart3, match: ['/ratings'], isNew: true },
  { href: '/community-builds', label: 'Community', icon: MessagesSquare, match: ['/community-builds', '/owners-builds'] },
  { href: '/map', label: 'Map', icon: MapPin, match: ['/map', '/events'] },
  { href: '/shops', label: 'Local Shops', icon: Warehouse, match: ['/shops'] },
];

function isActive(pathname: string, match: string[]) {
  return match.some((m) => pathname === m || pathname.startsWith(m + '/'));
}

export default function Header({ user, cartCount }: { user: HeaderUser; cartCount: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState<null | 'market' | 'account' | 'drawer'>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpen(null);
  }
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (open && open !== 'drawer' && headerRef.current && !headerRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Theme lives on <html data-theme>; the icons swap via CSS so SSR markup never mismatches.
  const toggleTheme = () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    if (next === 'light') document.documentElement.dataset.theme = 'light';
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem('sf-theme', next);
    } catch {}
  };

  const signOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    setOpen(null);
    router.push('/');
    router.refresh();
  };

  const marketActive = isActive(pathname, ['/marketplace', '/parts', '/auctions', '/cart']);

  return (
    <header className="site-header" ref={headerRef}>
      <div className="container header-inner">
        <Link href="/" className="logo" aria-label="ShiftForge home">
          <span className="logo-pill">shift</span>
          <span className="logo-sub">FORGE</span>
        </Link>

        <nav className="main-nav" aria-label="Main">
          {NAV.map(({ href, label, icon: Icon, match, isNew }) => (
            <Link key={href} href={href} className="nav-item" aria-current={isActive(pathname, match) ? 'page' : undefined}>
              <Icon size={26} aria-hidden />
              <span className="nav-label">{label}</span>
              {isNew && <span className="nav-new">NEW</span>}
            </Link>
          ))}
          <div className="dropdown">
            <button className="nav-item" aria-expanded={open === 'market'} aria-haspopup="menu" aria-current={marketActive ? 'page' : undefined} onClick={() => setOpen(open === 'market' ? null : 'market')}>
              <Store size={26} aria-hidden />
              <span className="nav-label">
                Marketplace <ChevronDown size={13} aria-hidden />
              </span>
            </button>
            {open === 'market' && (
              <div className="dropdown-panel" role="menu">
                <Link href="/marketplace" role="menuitem">
                  <Package size={18} aria-hidden />
                  <span>
                    Browse Parts<small>Wheels, tires, suspension & aero</small>
                  </span>
                </Link>
                <Link href="/auctions" role="menuitem">
                  <Gavel size={18} aria-hidden />
                  <span>
                    Auctions<small>Project cars at auction prices</small>
                  </span>
                </Link>
              </div>
            )}
          </div>
        </nav>

        <div className="header-actions">
          <button className="icon-btn theme-toggle" onClick={toggleTheme} aria-label="Toggle light and dark theme">
            <Sun size={21} aria-hidden className="icon-sun" />
            <Moon size={21} aria-hidden className="icon-moon" />
          </button>
          {user && (
            <Link href="/cart" className="icon-btn" aria-label={`Cart, ${cartCount} items`}>
              <ShoppingCart size={21} aria-hidden />
              {cartCount > 0 && <span className="count-dot">{cartCount}</span>}
            </Link>
          )}
          <div className="dropdown">
            {user ? (
              <button className="icon-btn" aria-label="Account menu" aria-expanded={open === 'account'} aria-haspopup="menu" onClick={() => setOpen(open === 'account' ? null : 'account')}>
                <Avatar name={user.name} color={user.color} size={30} round />
              </button>
            ) : (
              <Link href={`/signin?next=${encodeURIComponent(pathname)}`} className="icon-btn" aria-label="Sign in">
                <User size={24} aria-hidden />
              </Link>
            )}
            {open === 'account' && user && (
              <div className="dropdown-panel" role="menu">
                <div style={{ padding: '8px 12px' }}>
                  <b>{user.name}</b>
                </div>
                <div className="dropdown-sep" />
                <Link href={`/users/${user.id}`} role="menuitem">
                  <User size={18} aria-hidden /> My garage
                </Link>
                <Link href="/cart" role="menuitem">
                  <ShoppingCart size={18} aria-hidden /> Cart & orders
                </Link>
                <Link href="/settings" role="menuitem">
                  <Settings size={18} aria-hidden /> Settings
                </Link>
                <div className="dropdown-sep" />
                <button role="menuitem" onClick={signOut}>
                  <LogOut size={18} aria-hidden /> Sign out
                </button>
              </div>
            )}
          </div>
          <button className="icon-btn mobile-only" aria-label="Open menu" aria-expanded={open === 'drawer'} onClick={() => setOpen('drawer')}>
            <Menu size={26} aria-hidden />
          </button>
        </div>
      </div>
      <div className="header-rule" />

      {open === 'drawer' && (
        <>
          <div className="drawer-backdrop" onClick={() => setOpen(null)} />
          <nav className="drawer" aria-label="Mobile">
            <button className="icon-btn" style={{ alignSelf: 'flex-end' }} aria-label="Close menu" onClick={() => setOpen(null)}>
              <X size={24} aria-hidden />
            </button>
            {NAV.map(({ href, label, icon: Icon, match }) => (
              <Link key={href} href={href} aria-current={isActive(pathname, match) ? 'page' : undefined}>
                <Icon size={20} aria-hidden /> {label}
              </Link>
            ))}
            <Link href="/marketplace" aria-current={isActive(pathname, ['/marketplace', '/parts']) ? 'page' : undefined}>
              <Package size={20} aria-hidden /> Browse Parts
            </Link>
            <Link href="/auctions" aria-current={isActive(pathname, ['/auctions']) ? 'page' : undefined}>
              <Gavel size={20} aria-hidden /> Auctions
            </Link>
            <Link href="/fitment">
              <Box size={20} aria-hidden /> Fitment Search
            </Link>
          </nav>
        </>
      )}
    </header>
  );
}
