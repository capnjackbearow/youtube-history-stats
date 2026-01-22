import { useState } from 'react';

export function Instructions() {
  const [isExpanded, setIsExpanded] = useState(false);

  const steps = [
    {
      num: '01',
      title: 'Go to Google Takeout',
      desc: 'Visit takeout.google.com and sign in with your Google account',
    },
    {
      num: '02',
      title: 'Deselect All',
      desc: 'Click "Deselect all" at the top to start fresh',
    },
    {
      num: '03',
      title: 'Select YouTube',
      desc: 'Scroll down and check only "YouTube and YouTube Music"',
    },
    {
      num: '04',
      title: 'Configure Export',
      desc: 'Click "All YouTube data included" → deselect all → select only "history"',
    },
    {
      num: '05',
      title: 'Choose JSON Format (Important!)',
      desc: 'Click "Multiple formats" → find History → change from HTML to JSON',
    },
    {
      num: '06',
      title: 'Export & Download',
      desc: 'Click "Next step" → "Create export" → wait for email (can take minutes to hours) → download ZIP',
    },
    {
      num: '07',
      title: 'Find the File',
      desc: 'Unzip and navigate to: Takeout / YouTube and YouTube Music / history / watch-history.json',
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto mt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        <div className="vhs-card rounded-lg p-4 flex items-center justify-between glitch-hover">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📼</span>
            <div>
              <span className="font-['VT323'] text-xl text-[var(--text-primary)]">
                GOOGLE TAKEOUT
              </span>
              <span className="ml-2 text-xs text-[var(--text-secondary)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded">
                SLOWER • HAS TIMESTAMPS
              </span>
            </div>
          </div>
          <span
            className={`text-[var(--accent-amber)] transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          >
            ▼
          </span>
        </div>
      </button>

      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isExpanded ? 'max-h-[1100px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="vhs-card rounded-lg mt-2 p-6 space-y-4">
          {/* Why use this method */}
          <div className="flex items-center gap-2 text-sm pb-4 border-b border-[var(--accent-amber)]/20">
            <span className="text-[var(--accent-amber)]">📅</span>
            <span className="text-[var(--text-secondary)]">
              Use this method if you want accurate watch dates and "Account Age" stats. Takes hours/days to process.
            </span>
          </div>

          {steps.map((step, index) => (
            <div
              key={step.num}
              className="flex gap-4 items-start animate-slide-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="rank-badge top-3 flex-shrink-0 w-10 h-10 flex items-center justify-center border border-[var(--accent-amber)]/30 rounded bg-[var(--bg-elevated)]">
                {step.num}
              </div>
              <div>
                <h4 className="font-['VT323'] text-lg text-[var(--accent-amber)]">
                  {step.title}
                </h4>
                <p className="text-sm text-[var(--text-secondary)]">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}

          {/* File path highlight */}
          <div className="pt-4 mt-4 border-t border-[var(--accent-amber)]/20">
            <p className="font-['VT323'] text-sm text-[var(--accent-amber)] mb-2">
              📁 EXACT FILE LOCATION:
            </p>
            <div className="bg-[var(--bg-dark)] rounded p-3 font-mono text-xs overflow-x-auto">
              <span className="text-[var(--text-secondary)]">Takeout/</span>
              <span className="text-[var(--text-secondary)]">YouTube and YouTube Music/</span>
              <span className="text-[var(--text-secondary)]">history/</span>
              <span className="text-[var(--accent-cyan)]">watch-history.json</span>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--accent-amber)]/20">
            <p className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
              <span className="text-[var(--accent-cyan)]">🔒</span>
              Your data never leaves your browser. All processing happens locally.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
