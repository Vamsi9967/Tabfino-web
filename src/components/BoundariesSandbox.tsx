import { useState, type FormEvent } from 'react';
import {
  Bell,
  Check,
  EyeSlash,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Trash,
} from '@phosphor-icons/react';

export function BoundariesSandbox() {
  const [memoryPaused, setMemoryPaused] = useState(false);
  const [showTitlesInAlerts, setShowTitlesInAlerts] = useState(true);
  const [excludedSites, setExcludedSites] = useState<string[]>([
    'mail.company.com',
    'bank.personal.example',
  ]);
  const [domainInput, setDomainInput] = useState('');
  const [inputError, setInputError] = useState('');

  const handleAddDomain = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = domainInput
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '');

    if (!cleaned || !cleaned.includes('.')) {
      setInputError('Enter a domain like notes.company.com.');
      return;
    }
    if (excludedSites.includes(cleaned)) {
      setInputError('That domain is already excluded.');
      return;
    }
    setExcludedSites((prev) => [...prev, cleaned]);
    setDomainInput('');
    setInputError('');
  };

  const handleRemoveDomain = (domain: string) => {
    setExcludedSites((prev) => prev.filter((item) => item !== domain));
  };

  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
      {/* Left column: Headline + Description + Domain Form + 4 Feature Chips */}
      <div className="lg:col-span-6">
        <p className="caption-4 inline-flex items-center gap-2 text-blue-600">
          <SlidersHorizontal size={14} weight="regular" />
          <span>Tabfino boundary controls</span>
        </p>

        <h2 className="heading-3 mt-3 tracking-tight text-slate-900 sm:text-4xl">
          Set your own
          <br />
          boundaries <span className="text-blue-600">anytime</span>
        </h2>

        <p className="body-3 mt-4 max-w-lg text-slate-600">
          Pause memory, exclude private websites, choose what notifications show, or delete saved
          activity in Settings. Everything stays under your control on your device.
        </p>

        {/* Add domain exclusion form */}
        <form onSubmit={handleAddDomain} noValidate className="mt-6 flex max-w-md gap-2">
          <input
            type="text"
            value={domainInput}
            onChange={(e) => {
              setDomainInput(e.target.value);
              if (inputError) setInputError('');
            }}
            placeholder="Exclude domain (notes.company.com)"
            aria-label="Website domain to exclude"
            className="body-6 h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-slate-900 placeholder:text-slate-400 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus:border-blue-600 focus:outline-none"
          />
          <button
            type="submit"
            className="btn-tabfino button-sm shrink-0 cursor-pointer gap-2"
          >
            <Plus size={14} weight="bold" />
            <span>Exclude</span>
          </button>
        </form>
        {inputError && <p className="caption-5 mt-2 text-rose-600">{inputError}</p>}

        {/* 4 horizontal control/capability chips */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            type="button"
            role="switch"
            aria-checked={!memoryPaused}
            onClick={() => setMemoryPaused((prev) => !prev)}
            className="ambient-card-shadow flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-blue-300 active:scale-[0.98]"
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-blue-600 text-white">
              <SlidersHorizontal size={14} weight="regular" />
            </span>
            <span className="caption-4 truncate text-slate-800">
              {memoryPaused ? 'Paused' : 'Pause memory'}
            </span>
          </button>

          <button
            type="button"
            role="switch"
            aria-checked={showTitlesInAlerts}
            onClick={() => setShowTitlesInAlerts((prev) => !prev)}
            className="ambient-card-shadow flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-blue-300 active:scale-[0.98]"
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-blue-600 text-white">
              <Bell size={14} weight="regular" />
            </span>
            <span className="caption-4 truncate text-slate-800">
              {showTitlesInAlerts ? 'Titles shown' : 'Titles hidden'}
            </span>
          </button>

          <div className="ambient-card-shadow flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-blue-600 text-white">
              <EyeSlash size={14} weight="regular" />
            </span>
            <span className="caption-4 truncate text-slate-800">Exclude sites</span>
          </div>

          <div className="ambient-card-shadow flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-blue-600 text-white">
              <ShieldCheck size={14} weight="regular" />
            </span>
            <span className="caption-4 truncate text-slate-800">Local only</span>
          </div>
        </div>
      </div>

      {/* Right column: Elevated Settings Card + Confirmation Card */}
      <div className="subtle-white-grid rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-6 lg:col-span-6">
        <div className="space-y-3">
          <div className="ambient-card-shadow rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-white">
                  <EyeSlash size={16} weight="regular" />
                </span>
                <div>
                  <p className="caption-5 text-slate-500">Settings</p>
                  <p className="title-3 font-semibold text-slate-900">Extension boundaries</p>
                </div>
              </div>
              <span className="caption-4 font-[var(--font-mono)] text-blue-600 tabular-nums">
                {excludedSites.length} excluded
              </span>
            </div>

            <div className="caption-5 mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-slate-500">Memory status</p>
                <p className="title-5 mt-1 font-semibold text-slate-900">
                  {memoryPaused ? 'Paused' : 'Active locally'}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-slate-500">Reminders</p>
                <p className="title-5 mt-1 font-semibold text-slate-900">
                  {showTitlesInAlerts ? 'Show workflow title' : 'Generic prompt'}
                </p>
              </div>
            </div>

            {excludedSites.length === 0 ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                <p className="body-6 text-slate-600">
                  No domains excluded yet. Add a private domain on the left to test exclusions.
                </p>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-slate-50">
                {excludedSites.map((domain) => (
                  <li
                    key={domain}
                    className="caption-5 flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <span className="flex items-center gap-2 font-[var(--font-mono)] text-slate-700">
                      <EyeSlash size={14} weight="regular" className="text-slate-400" />
                      <span>{domain}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDomain(domain)}
                      aria-label={`Remove ${domain} from exclusions`}
                      className="cursor-pointer rounded-md p-1 text-slate-400 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-slate-200 hover:text-slate-700 active:scale-[0.98]"
                    >
                      <Trash size={14} weight="regular" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="ambient-card-shadow flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-600 text-white">
              <Check size={16} weight="bold" />
            </span>
            <span className="body-5 text-slate-800">
              Boundaries saved locally on your device
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
