import { useEffect } from 'react';
import { ArrowRight } from '@phosphor-icons/react';

export interface HeaderProps {
  activeView: 'home' | 'privacy' | 'terms' | 'notfound';
  activeSpy: string;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onInstallClick: () => void;
}

const NAV_LINKS = [
  { id: 'benefits', label: 'Benefits', href: '#benefits' },
  { id: 'how-it-works', label: 'How it works', href: '#how-it-works' },
  { id: 'your-data', label: 'Your data', href: '#your-data' },
  { id: 'faq', label: 'FAQ', href: '#faq' },
];

export function Header({
  activeView,
  activeSpy,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onInstallClick,
}: HeaderProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen) {
        onCloseMenu();
      }
    };
    const handleResize = () => {
      if (window.innerWidth >= 768 && menuOpen) {
        onCloseMenu();
      }
    };
    document.addEventListener('keydown', handleKey);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', handleResize);
    };
  }, [menuOpen, onCloseMenu]);

  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-4 z-50 px-4 sm:px-6 lg:px-12">
      <div className="pointer-events-auto relative z-50 flex h-16 w-full items-center justify-between gap-8 rounded-2xl border border-slate-200 bg-white/85 px-4 shadow-sm backdrop-blur-md sm:px-6">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          href="#home"
          onClick={onCloseMenu}
          className="title-3 inline-flex shrink-0 items-center gap-2 whitespace-nowrap font-semibold tracking-tight text-slate-900"
          aria-label="Tabfino home"
        >
          <img
            src="/assets/aistudio/Logo-Icon_03936385.svg"
            alt=""
            aria-hidden="true"
            className="h-6 w-6 shrink-0"
          />
          <span>Tabfino</span>
        </a>

        {/* Zone 2: 4 clean single-line navigation links */}
        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = activeView === 'home' && activeSpy === link.id;
            return (
              <a
                key={link.id}
                href={link.href}
                aria-current={isActive ? 'true' : undefined}
                className={`title-4 shrink-0 whitespace-nowrap rounded-lg px-3 py-1 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action + Morphing Mobile Menu Toggle */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onInstallClick}
            className="btn-tabfino button-sm hidden shrink-0 cursor-pointer whitespace-nowrap md:inline-flex"
          >
            Add to Chrome
          </button>

          <button
            type="button"
            onClick={onToggleMenu}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-slate-50 md:hidden"
          >
            <span
              aria-hidden="true"
              className={`absolute h-0.5 w-4 rounded-full bg-slate-900 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                menuOpen ? 'translate-y-0 rotate-45' : '-translate-y-1 rotate-0'
              }`}
            />
            <span
              aria-hidden="true"
              className={`absolute h-0.5 w-4 rounded-full bg-slate-900 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                menuOpen ? 'translate-y-0 -rotate-45' : 'translate-y-1 rotate-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* B7 Full-Height Mobile Navigation Panel with Staggered Entrance */}
      <div
        id="mobile-nav-drawer"
        aria-hidden={!menuOpen}
        className={`fixed inset-0 z-40 flex flex-col justify-between bg-white/95 px-6 pt-24 pb-8 backdrop-blur-xl transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden ${
          menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <nav aria-label="Mobile" className="flex flex-col gap-2">
          {NAV_LINKS.map((link, index) => {
            const isActive = activeView === 'home' && activeSpy === link.id;
            return (
              <a
                key={link.id}
                href={link.href}
                tabIndex={menuOpen ? 0 : -1}
                onClick={onCloseMenu}
                style={{
                  transitionDelay: menuOpen ? `${Math.min(index * 60, 240)}ms` : '0ms',
                }}
                className={`title-2 flex min-h-[48px] items-center justify-between rounded-xl px-4 py-3 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-900 hover:bg-slate-50'
                } ${menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
              >
                <span>{link.label}</span>
                <ArrowRight size={18} weight="regular" className="text-slate-400" aria-hidden="true" />
              </a>
            );
          })}
        </nav>

        <div
          style={{
            transitionDelay: menuOpen ? '240ms' : '0ms',
          }}
          className={`flex flex-col gap-3 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <button
            type="button"
            tabIndex={menuOpen ? 0 : -1}
            onClick={() => {
              onCloseMenu();
              onInstallClick();
            }}
            className="btn-tabfino button-md flex w-full cursor-pointer"
          >
            Add to Chrome
          </button>
          <p className="caption-4 text-center text-slate-500">
            Free to install and use · Metadata stays on your device
          </p>
        </div>
      </div>
    </header>
  );
}
