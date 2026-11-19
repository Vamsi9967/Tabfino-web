import { ArrowLeft } from '@phosphor-icons/react';
import type { LegalSection } from '../data/tabfinoData';

export interface LegalDocumentViewProps {
  title: string;
  subtitle: string;
  tocLabel: string;
  facts: { label: string; value: string }[];
  sections: LegalSection[];
}

export function LegalDocumentView({
  title,
  subtitle,
  tocLabel,
  facts,
  sections,
}: LegalDocumentViewProps) {
  return (
    <div className="bg-white pt-24 pb-20 sm:pt-32">
      <div className="w-full px-4 sm:px-6 lg:px-12">
        <a
          href="#home"
          className="title-4 inline-flex min-h-[44px] items-center gap-2 text-slate-600 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-slate-900"
        >
          <ArrowLeft size={16} weight="regular" />
          <span>Back to home</span>
        </a>

        <div className="mt-4 max-w-[680px]">
          <h1 className="heading-3 tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
          <p className="body-3 mt-3 text-slate-600">{subtitle}</p>
        </div>

        {/* Summary Fact Strip */}
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="body-6 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <span className="font-medium text-slate-900">{fact.label}</span>
              <span className="text-slate-600">{fact.value}</span>
            </div>
          ))}
        </div>

        {/* TOC + Legal Body */}
        <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-[260px_minmax(0,1fr)]">
          <nav
            aria-label={tocLabel}
            className="hidden max-h-[calc(100vh-120px)] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 lg:sticky lg:top-20 lg:block"
          >
            <p className="caption-3 px-3 py-2 text-slate-500">On this page</p>
            <div className="flex flex-col gap-1">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="body-6 rounded-lg px-3 py-2 text-slate-600 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white hover:text-slate-900"
                >
                  {section.tocLabel}
                </a>
              ))}
            </div>
          </nav>

          <div className="w-full space-y-12">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24 space-y-4">
                <h2 className="heading-5 flex items-baseline gap-3 text-slate-900">
                  <span className="body-4 font-[var(--font-mono)] text-blue-600 tabular-nums">
                    {section.number}
                  </span>
                  <span>{section.title}</span>
                </h2>

                {section.blocks.map((block, idx) => {
                  if (block.type === 'p') {
                    return (
                      <p key={idx} className="body-3 text-slate-600">
                        {block.text}
                      </p>
                    );
                  }
                  if (block.type === 'h3') {
                    return (
                      <h3 key={idx} className="title-2 pt-2 text-slate-900">
                        {block.text}
                      </h3>
                    );
                  }
                  if (block.type === 'note') {
                    return (
                      <div
                        key={idx}
                        className="body-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-slate-800"
                      >
                        <strong className="font-semibold text-slate-900">{block.lead} </strong>
                        {block.text}
                      </div>
                    );
                  }
                  if (block.type === 'ul') {
                    return (
                      <ul key={idx} className="body-3 list-disc space-y-2 pl-6 text-slate-600">
                        {block.items.map((item, itemIdx) => (
                          <li key={itemIdx}>
                            {item.bold && (
                              <strong className="font-semibold text-slate-900">{item.bold}</strong>
                            )}
                            {item.text}
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  if (block.type === 'table') {
                    return (
                      <div
                        key={idx}
                        className="overflow-x-auto rounded-xl border border-slate-200"
                      >
                        <table className="body-6 w-full min-w-[520px] border-collapse text-left">
                          <thead className="bg-slate-50 text-slate-900">
                            <tr>
                              {block.headers.map((header) => (
                                <th key={header} className="px-4 py-3 font-semibold">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-slate-600">
                            {block.rows.map((row, rIdx) => (
                              <tr key={rIdx}>
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} className="px-4 py-3 align-top">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }
                  return null;
                })}
              </section>
            ))}

            <p className="body-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600">
              Draft template, not legal advice. Fill in the bracketed details and have a qualified
              lawyer review it before publishing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotFoundView() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 text-center">
        <p className="caption-3 font-[var(--font-mono)] text-blue-600">404</p>
        <h1 className="heading-4 mt-2 tracking-tight text-slate-900">Page not found</h1>
        <p className="body-3 mt-3 text-slate-600">
          The page you tried to open does not exist. It may have moved, or the link may be
          mistyped.
        </p>
        <a href="#home" className="btn-tabfino button-md mt-8 gap-2">
          <ArrowLeft size={16} weight="regular" />
          <span>Back to home</span>
        </a>
      </div>
    </div>
  );
}
