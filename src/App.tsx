import { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LandingView } from './components/LandingView';
import { LegalDocumentView, NotFoundView } from './components/LegalDocumentView';
import {
  PRIVACY_FACTS,
  PRIVACY_SECTIONS,
  TERMS_FACTS,
  TERMS_SECTIONS,
} from './data/tabfinoData';

type RouteView = 'home' | 'privacy' | 'terms' | 'notfound';

const VIEW_TITLES: Record<RouteView, string> = {
  home: 'Tabfino: Return to your browser work',
  privacy: 'Privacy policy · Tabfino',
  terms: 'Terms and conditions · Tabfino',
  notfound: 'Page not found · Tabfino',
};

const HOME_ANCHORS = new Set(['home', 'benefits', 'how-it-works', 'your-data', 'faq']);

function resolveHash(): { view: RouteView; targetId: string | null } {
  let raw = '';
  try {
    raw = decodeURIComponent((window.location.hash || '').slice(1));
  } catch {
    raw = '';
  }

  if (!raw || raw === 'home') {
    return { view: 'home', targetId: raw === 'home' ? 'home' : null };
  }
  if (raw === 'privacy') {
    return { view: 'privacy', targetId: null };
  }
  if (raw === 'terms') {
    return { view: 'terms', targetId: null };
  }
  if (HOME_ANCHORS.has(raw)) {
    return { view: 'home', targetId: raw };
  }
  if (raw.startsWith('privacy-section-')) {
    const exists = PRIVACY_SECTIONS.some((s) => s.id === raw);
    return exists ? { view: 'privacy', targetId: raw } : { view: 'notfound', targetId: null };
  }
  if (raw.startsWith('terms-section-')) {
    const exists = TERMS_SECTIONS.some((s) => s.id === raw);
    return exists ? { view: 'terms', targetId: raw } : { view: 'notfound', targetId: null };
  }
  return { view: 'notfound', targetId: null };
}

export default function App() {
  const [{ view, targetId }, setRoute] = useState<{ view: RouteView; targetId: string | null }>(
    () => resolveHash()
  );
  const [activeSpy, setActiveSpy] = useState<string>('');
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [ctaNote, setCtaNote] = useState<string>('');
  const mainRef = useRef<HTMLElement | null>(null);

  const handleInstallClick = useCallback(() => {
    setCtaNote('The Chrome Web Store link has not been added yet.');
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(resolveHash());
      setMenuOpen(false);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    document.title = VIEW_TITLES[view];

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (targetId) {
      const frame = window.requestAnimationFrame(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({
            behavior: prefersReduced ? 'auto' : 'smooth',
            block: 'start',
          });
        }
      });
      return () => window.cancelAnimationFrame(frame);
    }

    window.scrollTo(0, 0);
  }, [view, targetId]);

  useEffect(() => {
    if (view !== 'home' || !('IntersectionObserver' in window)) {
      setActiveSpy('');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-spy');
            if (id) setActiveSpy(id);
          }
        });
      },
      { rootMargin: '-35% 0px -55% 0px' }
    );

    const targets = document.querySelectorAll('[data-spy]');
    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [view]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          mainRef.current?.focus();
          mainRef.current?.scrollIntoView({ block: 'start' });
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to content
      </a>

      <Header
        activeView={view}
        activeSpy={activeSpy}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((prev) => !prev)}
        onCloseMenu={() => setMenuOpen(false)}
        onInstallClick={handleInstallClick}
      />

      <main id="main" ref={mainRef} tabIndex={-1} className="focus:outline-none">
        {view === 'home' && (
          <LandingView ctaNote={ctaNote} onInstallClick={handleInstallClick} />
        )}

        {view === 'privacy' && (
          <LegalDocumentView
            title="Privacy policy"
            subtitle="How Tabfino handles your browser metadata and what you control. Last updated November 17, 2026."
            tocLabel="Privacy policy sections"
            facts={PRIVACY_FACTS}
            sections={PRIVACY_SECTIONS}
          />
        )}

        {view === 'terms' && (
          <LegalDocumentView
            title="Terms and conditions"
            subtitle="The rules for using Tabfino and this website. Last updated November 17, 2026."
            tocLabel="Terms sections"
            facts={TERMS_FACTS}
            sections={TERMS_SECTIONS}
          />
        )}

        {view === 'notfound' && <NotFoundView />}
      </main>

      <Footer activeView={view} ctaNote={ctaNote} onInstallClick={handleInstallClick} />
    </div>
  );
}
