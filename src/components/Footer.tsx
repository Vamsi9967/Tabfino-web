import { useState, type FormEvent } from 'react';
import { GoogleChromeLogo } from '@phosphor-icons/react';
import { RevealSection } from './RevealSection';

export interface FooterProps {
  activeView: 'home' | 'privacy' | 'terms' | 'notfound';
  ctaNote: string;
  onInstallClick: () => void;
}

export function Footer({ activeView, ctaNote, onInstallClick }: FooterProps) {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [formStatus, setFormStatus] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null
  );

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setFormStatus({ type: 'error', text: 'Enter an email address to continue.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFormStatus({ type: 'error', text: 'Enter a valid email address.' });
      return;
    }
    setFormStatus({
      type: 'success',
      text: `Updates preference noted for ${trimmed}.`,
    });
    setEmail('');
  };

  return (
    <footer className="bg-white px-4 pt-6 pb-12 sm:px-6 lg:px-12">
      <RevealSection className="w-full">
        {/* Outer Soft Pastel Rounded Container matching reference attachment */}
        <div className="cta-footer-shell ambient-card-shadow overflow-hidden rounded-3xl border border-slate-200 p-3 sm:p-6">
          {/* Top CTA Section (shown on home view) */}
          {activeView === 'home' && (
            <div className="px-4 py-12 text-center sm:px-8 sm:py-16">
              <div className="mx-auto flex max-w-[680px] flex-col items-center">
                <h2 className="heading-3 tracking-tight text-slate-900 sm:text-5xl">
                  Ready to pick up
                  <br />
                  where your work left off?
                </h2>
                <p className="body-3 mt-4 max-w-md text-slate-600">
                  Keep your browser work together on your device, and reopen one page or a whole
                  session whenever you return.
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={onInstallClick}
                    className="btn-tabfino button-sm cursor-pointer gap-2"
                  >
                    <GoogleChromeLogo size={16} weight="regular" />
                    <span>Add to Chrome</span>
                  </button>
                  <a
                    href="#faq"
                    className="button-sm inline-flex h-12 min-h-[48px] items-center justify-center rounded-[15px] border border-slate-200 bg-white px-6 text-slate-900 shadow-xs transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
                  >
                    Read FAQ
                  </a>
                </div>

                {ctaNote && (
                  <p role="status" aria-live="polite" className="caption-4 mt-4 text-blue-700">
                    {ctaNote}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Nested Rounded White Footer Card */}
          <div className="rounded-2xl border border-white bg-white/95 p-6 shadow-xs backdrop-blur-md sm:p-10">
            {/* Top Brand Row */}
            <div>
              <a
                href="#home"
                className="heading-6 inline-flex w-fit items-center gap-2 tracking-tight text-slate-900"
              >
                <img
                  src="/assets/aistudio/Logo-Icon_03936385.svg"
                  alt=""
                  aria-hidden="true"
                  className="h-7 w-7 shrink-0 rounded-md"
                />
                <span>Tabfino</span>
              </a>
            </div>

            {/* Middle Grid: Left Email Form + Right 4 Link Columns */}
            <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12">
              {/* Left Column: Email Updates Form */}
              <div className="lg:col-span-4">
                <p className="title-4 text-slate-900">Get release updates from Tabfino.</p>

                <form
                  onSubmit={handleSubscribe}
                  noValidate
                  className="mt-4 flex items-center gap-2 rounded-[20px] border border-slate-200 bg-white p-1.5"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (formStatus) setFormStatus(null);
                    }}
                    placeholder="Enter your email"
                    aria-label="Email address for release updates"
                    className="body-6 h-12 min-w-0 flex-1 bg-transparent px-3 text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="btn-tabfino button-xsm shrink-0 cursor-pointer"
                  >
                    Submit
                  </button>
                </form>

                {formStatus && (
                  <p
                    role="status"
                    aria-live="polite"
                    className={`caption-5 mt-2 ${
                      formStatus.type === 'error' ? 'text-rose-600' : 'text-blue-700'
                    }`}
                  >
                    {formStatus.text}
                  </p>
                )}

                <p className="caption-5 mt-3 text-slate-500">
                  By submitting you agree to our{' '}
                  <a href="#privacy" className="text-slate-700 underline hover:text-slate-900">
                    Privacy Policy
                  </a>{' '}
                  and consent to receive product release updates.
                </p>
              </div>

              {/* Right Columns */}
              <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
                <div>
                  <h3 className="caption-4 text-slate-500">Product</h3>
                  <ul className="body-6 mt-4 space-y-3 text-slate-800">
                    <li>
                      <a
                        href="#home"
                        aria-current={activeView === 'home' ? 'page' : undefined}
                        className={`transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-blue-600 ${
                          activeView === 'home' ? 'font-medium text-blue-600' : ''
                        }`}
                      >
                        Overview
                      </a>
                    </li>
                    <li>
                      <a
                        href="#benefits"
                        className="transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-blue-600"
                      >
                        Benefits
                      </a>
                    </li>
                    <li>
                      <a
                        href="#how-it-works"
                        className="transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-blue-600"
                      >
                        How it works
                      </a>
                    </li>
                    <li>
                      <a
                        href="#your-data"
                        className="transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-blue-600"
                      >
                        Your data
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="caption-4 text-slate-500">Extension</h3>
                  <ul className="body-6 mt-4 space-y-3 text-slate-800">
                    <li>
                      <a
                        href="#home"
                        className="transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-blue-600"
                      >
                        Chrome release
                      </a>
                    </li>
                    <li>
                      <a
                        href="#privacy-section-5"
                        className="transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-blue-600"
                      >
                        Local storage
                      </a>
                    </li>
                    <li>
                      <a
                        href="#privacy-section-6"
                        className="transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-blue-600"
                      >
                        Permissions
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="caption-4 text-slate-500">Support</h3>
                  <ul className="body-6 mt-4 space-y-3 text-slate-800">
                    <li>
                      <a
                        href="#faq"
                        className="transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-blue-600"
                      >
                        FAQ
                      </a>
                    </li>
                    <li>
                      <a
                        href="#privacy-section-8"
                        className="transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-blue-600"
                      >
                        Controls
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="caption-4 text-slate-500">Legal</h3>
                  <ul className="body-6 mt-4 space-y-3 text-slate-800">
                    <li>
                      <a
                        href="#terms"
                        aria-current={activeView === 'terms' ? 'page' : undefined}
                        className={`transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-blue-600 ${
                          activeView === 'terms' ? 'font-medium text-blue-600' : ''
                        }`}
                      >
                        Terms and conditions
                      </a>
                    </li>
                    <li>
                      <a
                        href="#privacy"
                        aria-current={activeView === 'privacy' ? 'page' : undefined}
                        className={`transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-blue-600 ${
                          activeView === 'privacy' ? 'font-medium text-blue-600' : ''
                        }`}
                      >
                        Privacy policy
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom Centered Copyright Strip */}
            <div className="caption-5 mt-10 border-t border-slate-200 pt-6 text-center text-slate-500">
              <span>© {year} Tabfino. All rights reserved.</span>
            </div>
          </div>
        </div>
      </RevealSection>
    </footer>
  );
}
