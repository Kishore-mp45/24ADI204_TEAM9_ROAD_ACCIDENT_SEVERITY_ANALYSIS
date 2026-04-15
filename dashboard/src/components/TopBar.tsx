import { Search } from "lucide-react";

export function TopBar() {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 bg-[rgba(6,10,16,0.7)] backdrop-blur-2xl border-b border-[var(--color-border)] flex justify-between items-center h-16 px-8">
      {/* Search */}
      <div className="flex items-center flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} />
          <input
            className="w-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl py-2 pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-dim)] focus:border-[var(--color-accent-dim)] transition-all"
            placeholder="Search datasets, models, or events..."
            type="text"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pl-4 border-l border-[var(--color-border)]">
          <div className="text-right">
            <p className="text-xs font-bold text-[var(--color-text-primary)]">AI Intelligence Node</p>
            <p className="text-[10px] text-[var(--color-emerald)] uppercase tracking-widest font-semibold flex items-center justify-end gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-emerald)] pulse-dot inline-block" />
              System Ready
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-accent-dim)] to-[var(--color-violet-dim)] flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-500/20">
            AI
          </div>
        </div>
      </div>
    </header>
  );
}
