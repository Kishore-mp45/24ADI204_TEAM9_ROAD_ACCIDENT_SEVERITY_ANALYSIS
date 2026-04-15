import { LayoutDashboard, BarChart3, ScatterChart, Lightbulb, MapPin, Settings, PieChart } from "lucide-react";

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "metrics", label: "Key Metrics", icon: PieChart },
  { id: "distribution", label: "Distribution", icon: BarChart3 },
  { id: "correlation", label: "Correlation", icon: ScatterChart },
  { id: "geospatial", label: "Geospatial", icon: MapPin },
  { id: "insights", label: "Insights & Advanced", icon: Lightbulb },
];

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-[var(--color-surface)] flex flex-col py-6 px-4 z-50 border-r border-[var(--color-border)] transition-colors duration-300">
      {/* Logo */}
      <div className="mb-10 px-2">
        <h1 className="text-xl font-black text-[var(--color-accent)] tracking-tighter flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--color-cyan)] pulse-dot inline-block" />
          Insights Innovators
        </h1>
        <p className="text-[10px] text-[var(--color-text-muted)] font-semibold tracking-[0.2em] uppercase mt-1">
          Data Intelligence
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`nav-link w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium tracking-tight transition-all duration-200
              ${activePage === id
                ? "active text-[var(--color-accent)]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-accent)]"
              }`}
          >
            <Icon size={18} strokeWidth={activePage === id ? 2.5 : 1.8} />
            {label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto space-y-1 pt-6 border-t border-[var(--color-border)]">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] transition-colors">
          <Settings size={18} strokeWidth={1.8} />
          Settings
        </button>
      </div>
    </aside>
  );
}
