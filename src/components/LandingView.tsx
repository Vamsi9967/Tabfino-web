import { useEffect, useRef, useState } from 'react';
import {
  ArrowBendDownLeft,
  ArrowRight,
  Bell,
  Check,
  GoogleChromeLogo,
  HardDrive,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
  Stack,
  X,
} from '@phosphor-icons/react';
import { FAQ_ITEMS } from '../data/tabfinoData';
import { TabfinoSimulator } from './TabfinoSimulator';
import { BoundariesSandbox } from './BoundariesSandbox';
import { RevealSection } from './RevealSection';

export interface LandingViewProps {
  ctaNote: string;
  onInstallClick: () => void;
}

const TAGLINE_WORDS =
  'Your browser should remember where you stopped, so you never search for it again.'.split(' ');

const MODE_CARDS = [
  {
    id: 'without',
    tabLabel: 'Without Tabfino',
    title: 'Tab overload',
    summary:
      'You hunt through a row of tiny tabs for the one that mattered, forget your next step, and rebuild context from memory.',
    meta: 'Manual search',
    actionLabel: 'Compare flow',
    bullets: [
      'Hunt through a row of tabs for the one that mattered',
      'Forget what you were about to do next',
      'Rebuild the context from memory',
    ],
  },
  {
    id: 'with',
    tabLabel: 'With Tabfino',
    title: 'Named workflows',
    summary:
      'Related tabs sit together in a named workflow with your last active tab marked so you can open one page or the whole session.',
    meta: 'Single click return',
    actionLabel: 'See how it works',
    bullets: [
      'Your last active tab is one click away',
      'Related tabs sit together in a named workflow',
      'Reopen one page or the whole session',
    ],
  },
  {
    id: 'reminder',
    tabLabel: 'Return reminder',
    title: 'Idle return alert',
    summary:
      'After a period of device inactivity, an optional reminder shows the workflow you left so you can resume quickly.',
    meta: 'Optional permission',
    actionLabel: 'Review privacy',
    bullets: [
      'Uses Chrome idle signal across the device',
      'Shows the workflow you stepped away from',
      'Customize or disable anytime in Settings',
    ],
  },
];

const HOW_STEPS = [
  {
    number: '01',
    title: 'Choose to remember',
    subtitle: 'Enable Tabfino and grant tab access',
    description:
      'Saves tab titles, URLs and activity details locally in Chrome extension storage on your device.',
    badge: 'Tabs and storage',
  },
  {
    number: '02',
    title: 'Work across your tabs',
    subtitle: 'Automatic workflow grouping',
    description:
      'Tabfino groups related tabs into workflows, giving each work session a recognizable name and a useful return point.',
    badge: 'Named sessions',
  },
  {
    number: '03',
    title: 'Come back your way',
    subtitle: 'One page or whole session',
    description:
      'Open the last active tab, choose any saved tab, or reopen every tab in a workflow in one click.',
    badge: 'Instant resume',
  },
];

export function LandingView({ ctaNote, onInstallClick }: LandingViewProps) {
  const [activeMode, setActiveMode] = useState<'without' | 'with' | 'reminder'>('with');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [revealedWordMap, setRevealedWordMap] = useState<Record<number, boolean>>({});
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || !('IntersectionObserver' in window)) {
      const all: Record<number, boolean> = {};
      TAGLINE_WORDS.forEach((_, idx) => {
        all[idx] = true;
      });
      setRevealedWordMap(all);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idxAttr = entry.target.getAttribute('data-word-index');
            if (idxAttr !== null) {
              const idx = Number(idxAttr);
              setRevealedWordMap((prev) => (prev[idx] ? prev : { ...prev, [idx]: true }));
              observer.unobserve(entry.target);
            }
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -18% 0px' }
    );

    wordRefs.current.forEach((span) => {
      if (span) observer.observe(span);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-white">
      {/* 1. HERO SECTION (B5: 680px cap, light text gradient, meaningful line breaks, flat white grid surface) */}
      <section
        id="home"
        aria-labelledby="h-hero"
        className="subtle-white-grid relative bg-white pt-24 pb-16 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-24"
      >
        <div className="relative flex w-full flex-col items-center px-4 text-center sm:px-6 lg:px-12">
          <div className="caption-4 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-blue-600 lg:border-0 lg:bg-transparent lg:p-0">
            <Lock size={14} weight="regular" />
            <span>Free Chrome extension</span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="text-slate-600">Local browser memory</span>
          </div>

          <h1
            id="h-hero"
            className="mt-4 max-w-[680px] bg-gradient-to-r from-[#000000] to-[#666666] bg-clip-text font-[var(--font-display)] text-3xl font-semibold tracking-tight text-transparent sm:text-5xl lg:text-6xl"
          >
            Pick up where
            <br className="hidden sm:inline" /> your work left off
          </h1>

          <p className="body-3 sm:title-2 mt-4 max-w-[680px] text-slate-600 sm:mt-6">
            Tabfino remembers the tabs you choose to save and groups them into workflows. After an
            interruption you reopen one page, or the whole session, in a click.
          </p>

          {/* Single Primary CTA Row */}
          <div className="mt-6 flex w-full max-w-sm flex-col items-center gap-2 sm:w-auto sm:max-w-none md:mt-8 lg:gap-3">
            <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
              <button
                type="button"
                onClick={onInstallClick}
                className="btn-tabfino button-md w-full cursor-pointer gap-2 sm:w-auto"
              >
                <GoogleChromeLogo size={18} weight="regular" />
                <span>Add to Chrome</span>
                <ArrowRight size={16} weight="regular" />
              </button>
              <span className="caption-2 text-slate-500">Free to install and use</span>
            </div>

            <p
              role="status"
              aria-live="polite"
              className="caption-4 min-h-5 text-blue-700"
            >
              {ctaNote}
            </p>
          </div>

          <p className="caption-2 mt-1 inline-flex max-w-sm items-start gap-2 text-left text-slate-500 sm:max-w-none sm:items-center sm:text-center lg:mt-2">
            <ShieldCheck size={16} weight="regular" className="mt-0.5 shrink-0 text-blue-600 sm:mt-0" />
            <span>Your browser metadata stays on your device. Tabfino does not read page content.</span>
          </p>

          {/* Desktop Interactive Browser + Side Panel Simulator */}
          <TabfinoSimulator />
        </div>
      </section>

      {/* 2. BENEFITS: 3-CARD INTERACTIVE SHOWCASE (Flat surfaces, nested radii, all-around borders) */}
      <section
        id="benefits"
        data-spy="benefits"
        aria-labelledby="h-benefits"
        className="subtle-white-grid bg-slate-50 py-20 sm:py-24"
      >
        <RevealSection className="w-full px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="caption-4 inline-flex items-center gap-2 text-blue-600">
              <Stack size={14} weight="regular" />
              <span>Tabfino easy to use</span>
            </p>
            <h2
              id="h-benefits"
              className="heading-3 mt-2 tracking-tight text-slate-900 sm:text-4xl"
            >
              A small memory layer,
              <br />
              <span className="text-blue-600">easy to resume</span> any work session
            </h2>
            <p className="body-3 mt-3 text-slate-600">
              A quick interruption should not turn into a long search. Switch between modes to see
              how Tabfino replaces manual tab hunting.
            </p>
          </div>

          {/* Segmented Tab Switcher (hidden on mobile per user focus rule, visible tablet/desktop) */}
          <div className="flex items-center justify-center gap-4 md:mt-8">
            <div className="hidden h-px flex-1 bg-slate-200 md:block" />
            <div
              role="tablist"
              aria-label="Workflow comparison modes"
              className="ambient-card-shadow hidden flex-wrap items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white p-1 md:inline-flex"
            >
              {MODE_CARDS.map((card) => {
                const isSelected = activeMode === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setActiveMode(card.id as 'without' | 'with' | 'reminder')}
                    className={`caption-4 cursor-pointer rounded-lg px-4 py-2 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {card.tabLabel}
                  </button>
                );
              })}
            </div>
            <div className="hidden h-px flex-1 bg-slate-200 md:block" />
          </div>

          {/* 3 Cards (outer rounded-2xl 16px, p-2 8px gap -> inner rounded-lg 8px per B3) */}
          <div className="mt-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-3">
            {MODE_CARDS.map((card) => {
              const isSelected = activeMode === card.id;
              return (
                <article
                  key={card.id}
                  onClick={() => setActiveMode(card.id as 'without' | 'with' | 'reminder')}
                  className={`cursor-pointer overflow-hidden rounded-2xl border bg-white p-2 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isSelected
                      ? 'ambient-blue-shadow border-blue-200 lg:-translate-y-2 lg:scale-[1.02]'
                      : 'ambient-card-shadow border-slate-200 hover:border-blue-200'
                  }`}
                >
                  <div
                    className={`rounded-lg p-6 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-900'
                    }`}
                  >
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-full ${
                        isSelected ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                      }`}
                    >
                      {card.id === 'without' ? (
                        <X size={20} weight="bold" />
                      ) : card.id === 'with' ? (
                        <Stack size={20} weight="regular" />
                      ) : (
                        <Bell size={20} weight="regular" />
                      )}
                    </span>

                    <h3
                      className={`heading-6 mt-6 ${isSelected ? 'text-white' : 'text-slate-900'}`}
                    >
                      {card.title}
                    </h3>
                    <p className={`body-6 mt-2 ${isSelected ? 'text-blue-50' : 'text-slate-600'}`}>
                      {card.summary}
                    </p>

                    <ul
                      className={`caption-5 mt-6 space-y-2 ${
                        isSelected ? 'text-blue-50' : 'text-slate-600'
                      }`}
                    >
                      {card.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2">
                          {card.id === 'without' ? (
                            <X
                              size={14}
                              weight="bold"
                              className={`mt-0.5 shrink-0 ${
                                isSelected ? 'text-blue-100' : 'text-slate-400'
                              }`}
                            />
                          ) : (
                            <Check
                              size={14}
                              weight="bold"
                              className={`mt-0.5 shrink-0 ${
                                isSelected ? 'text-white' : 'text-blue-600'
                              }`}
                            />
                          )}
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Card Footer Strip (nested rounded-lg inner alignment, no single-sided borders) */}
                  <div className="caption-4 flex items-center justify-between gap-2 px-4 py-3">
                    <span className="font-[var(--font-mono)] text-slate-500">{card.meta}</span>
                    <span className="inline-flex items-center gap-2 font-semibold text-slate-900">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-blue-600 text-white">
                        <ArrowRight size={12} weight="bold" />
                      </span>
                      <span>{card.actionLabel}</span>
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </RevealSection>
      </section>

      {/* 3. HOW IT WORKS: CENTERED STEP CARD */}
      <section
        id="how-it-works"
        data-spy="how-it-works"
        aria-labelledby="h-how"
        className="bg-white py-20 sm:py-24"
      >
        <RevealSection className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="caption-4 inline-flex items-center gap-2 text-blue-600">
              <ArrowBendDownLeft size={14} weight="regular" />
              <span>Tabfino faster return</span>
            </p>
            <h2
              id="h-how"
              className="heading-3 mt-2 tracking-tight text-slate-900 sm:text-4xl"
            >
              Save the context, then <span className="text-blue-600">resume</span>
              <br />
              with less searching
            </h2>
            <p className="body-3 mt-3 text-slate-600">
              Enable Tabfino once, work across your tabs normally, and reopen one saved page or the
              whole workflow whenever you return.
            </p>
          </div>

          <div className="relative mt-12 flex items-center justify-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-px bg-slate-200 lg:block"
            />

            <div className="ambient-card-shadow relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-600 text-white">
                    <Stack size={20} weight="regular" />
                  </span>
                  <div>
                    <h3 className="title-3 font-semibold text-slate-900">
                      {HOW_STEPS[activeStepIndex].title}
                    </h3>
                    <p className="caption-5 text-slate-500">{HOW_STEPS[activeStepIndex].subtitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="title-3 font-[var(--font-mono)] font-semibold text-slate-900 tabular-nums">
                    Step {HOW_STEPS[activeStepIndex].number}
                  </span>
                  <p className="caption-5 text-slate-500">{HOW_STEPS[activeStepIndex].badge}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {HOW_STEPS.map((step, idx) => {
                  const isCurrent = activeStepIndex === idx;
                  return (
                    <button
                      key={step.number}
                      type="button"
                      onClick={() => setActiveStepIndex(idx)}
                      className={`cursor-pointer rounded-xl border px-4 py-3 text-left transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        isCurrent
                          ? 'border-blue-600 bg-blue-50 text-slate-900'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <span className="caption-3 font-[var(--font-mono)] text-blue-600 tabular-nums">
                        {step.number}
                      </span>
                      <p className="caption-3 mt-1 text-slate-900">{step.title}</p>
                    </button>
                  );
                })}
              </div>

              <div className="body-6 mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
                {HOW_STEPS[activeStepIndex].description}
              </div>

              <button
                type="button"
                onClick={() => setActiveStepIndex((prev) => (prev + 1) % HOW_STEPS.length)}
                className="btn-tabfino button-md mt-6 flex w-full cursor-pointer gap-2"
              >
                <span>Next step ({activeStepIndex + 1} of 3)</span>
                <ArrowRight size={16} weight="regular" />
              </button>
            </div>
          </div>
        </RevealSection>
      </section>

      {/* 4. PRIVACY ARCHITECTURE NODE DIAGRAM */}
      <section
        id="your-data"
        data-spy="your-data"
        aria-labelledby="h-data"
        className="bg-slate-50 py-20 sm:py-24"
      >
        <RevealSection className="w-full px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="caption-4 inline-flex items-center gap-2 text-blue-600">
              <ShieldCheck size={14} weight="regular" />
              <span>Tabfino privacy first</span>
            </p>
            <h2
              id="h-data"
              className="heading-3 mt-2 tracking-tight text-slate-900 sm:text-4xl"
            >
              Keep your browsing private <span className="text-blue-600">always</span>
            </h2>
            <p className="body-3 mt-3 text-slate-600">
              Tabfino is designed to remember browser metadata, not the contents of your work.
              Saved data stays in Chrome&apos;s local extension storage on your device.
            </p>
          </div>

          <div className="relative mt-12 grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
            {/* Left Satellite Exclusion Nodes */}
            <div className="flex flex-col gap-6 lg:col-span-3">
              <div className="ambient-card-shadow flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <span className="body-5 flex items-center gap-3 text-slate-700">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-slate-500">
                    <X size={14} weight="bold" />
                  </span>
                  <span>Page text</span>
                </span>
                <span className="caption-5 font-[var(--font-mono)] text-slate-500">Never read</span>
              </div>

              <div className="ambient-card-shadow flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <span className="body-5 flex items-center gap-3 text-slate-700">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-slate-500">
                    <X size={14} weight="bold" />
                  </span>
                  <span>Documents</span>
                </span>
                <span className="caption-5 font-[var(--font-mono)] text-slate-500">Never read</span>
              </div>
            </div>

            {/* Center Stacked Local Storage Node */}
            <div className="space-y-3 lg:col-span-6">
              <div className="ambient-card-shadow flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-600 text-white">
                    <HardDrive size={16} weight="regular" />
                  </span>
                  <div>
                    <p className="caption-5 text-slate-500">Chrome local extension storage</p>
                    <p className="body-4 text-slate-900">Saved with your permission</p>
                  </div>
                </div>
                <span className="caption-4 font-[var(--font-mono)] text-blue-600">On device</span>
              </div>

              <div className="ambient-card-shadow rounded-2xl border border-blue-200 bg-white p-6 text-center">
                <p className="caption-5 text-slate-500">Metadata remembered</p>
                <p className="heading-5 mt-1 text-slate-900">Titles, URLs and timestamps</p>

                <div className="mt-6 grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <span className="caption-4 inline-flex items-center gap-2 text-blue-600">
                      <Check size={14} weight="bold" />
                      <span>Tab identity</span>
                    </span>
                    <p className="body-4 mt-1 text-slate-900">Tab titles and URLs</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <span className="caption-4 inline-flex items-center gap-2 text-blue-600">
                      <Check size={14} weight="bold" />
                      <span>Session context</span>
                    </span>
                    <p className="body-4 mt-1 text-slate-900">Timestamps and active tab</p>
                  </div>
                </div>

                <div className="mt-6">
                  <a
                    href="#privacy"
                    className="caption-3 inline-flex items-center gap-2 text-blue-600 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-blue-700"
                  >
                    <span>Read the privacy policy</span>
                    <ArrowRight size={14} weight="regular" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right Satellite Exclusion Nodes */}
            <div className="flex flex-col gap-6 lg:col-span-3">
              <div className="ambient-card-shadow flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <span className="body-5 flex items-center gap-3 text-slate-700">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-slate-500">
                    <X size={14} weight="bold" />
                  </span>
                  <span>Passwords</span>
                </span>
                <span className="caption-5 font-[var(--font-mono)] text-slate-500">Never saved</span>
              </div>

              <div className="ambient-card-shadow flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <span className="body-5 flex items-center gap-3 text-slate-700">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-slate-500">
                    <X size={14} weight="bold" />
                  </span>
                  <span>Keystrokes</span>
                </span>
                <span className="caption-5 font-[var(--font-mono)] text-slate-500">Never logged</span>
              </div>
            </div>
          </div>
        </RevealSection>
      </section>

      {/* 5. BOUNDARIES SANDBOX */}
      <section aria-label="User boundary controls" className="bg-white py-20 sm:py-24">
        <RevealSection className="w-full px-4 sm:px-6 lg:px-12">
          <BoundariesSandbox />
        </RevealSection>
      </section>

      {/* 6. B11 MANDATORY TAGLINE REVEAL SECTION (IntersectionObserver per word, cubic-bezier curve) */}
      <section aria-label="Our promise" className="bg-slate-50 py-20 sm:py-24">
        <div className="w-full px-4 text-center sm:px-6 lg:px-12">
          <p
            aria-label={TAGLINE_WORDS.join(' ')}
            className="mx-auto max-w-4xl font-[var(--font-display)] text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl"
          >
            {TAGLINE_WORDS.map((word, index) => {
              const isRevealed = Boolean(revealedWordMap[index]);
              return (
                <span
                  key={index}
                  ref={(el) => {
                    wordRefs.current[index] = el;
                  }}
                  data-word-index={index}
                  aria-hidden="true"
                  style={{
                    transitionDelay: isRevealed ? `${Math.min(index * 40, 480)}ms` : '0ms',
                  }}
                  className={`transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isRevealed ? 'opacity-100' : 'opacity-25'
                  }`}
                >
                  {word}
                  {index < TAGLINE_WORDS.length - 1 ? ' ' : ''}
                </span>
              );
            })}
          </p>
        </div>
      </section>

      {/* 7. FAQ ACCORDION */}
      <section id="faq" data-spy="faq" aria-labelledby="h-faq" className="bg-white py-20 sm:py-24">
        <RevealSection className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="caption-4 text-blue-600">FAQ</p>
            <h2
              id="h-faq"
              className="heading-3 mt-2 tracking-tight text-slate-900 sm:text-4xl"
            >
              Frequently asked <span className="text-blue-600">questions</span>
            </h2>
          </div>

          <div className="ambient-card-shadow mt-10 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={item.question}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="flex min-h-[60px] w-full cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-slate-50"
                  >
                    <span className="body-2 text-slate-900">{item.question}</span>
                    <span className="shrink-0 text-blue-600" aria-hidden="true">
                      {isOpen ? (
                        <Minus size={16} weight="bold" />
                      ) : (
                        <Plus size={16} weight="bold" />
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="body-6 sm:body-3 px-6 pb-6 text-slate-600">{item.answer}</div>
                  )}
                </div>
              );
            })}
          </div>
        </RevealSection>
      </section>
    </div>
  );
}
