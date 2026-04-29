import { CheckCircle2, Server, Database, Workflow, ShieldAlert, FileSearch, LineChart, Globe } from "lucide-react";

export default function OverviewPage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl glass-card border border-[rgba(148,163,184,0.1)] p-10 md:p-14">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Globe size={300} />
        </div>
        <div className="relative z-10 max-w-3xl">
          <span className="text-[var(--color-accent)] font-bold tracking-[0.2em] text-[10px] uppercase mb-4 block">Project About & Introduction</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--color-text-primary)] tracking-tight leading-tight mb-6">
            Road Accident Severity Analysis
          </h1>
          <p className="text-lg md:text-xl text-[var(--color-text-secondary)] leading-relaxed mb-8">
            A comprehensive end-to-end data science project performing exploratory data analysis, feature engineering, and dimensionality reduction on the <span className="text-[var(--color-text-primary)] font-semibold">US Accidents dataset</span> containing over 7.7 million traffic records.
          </p>
          <div className="flex flex-wrap gap-3">
            {["FastAPI Backend", "React + Vite", "TailwindCSS v4", "Scikit-Learn ML", "Recharts Visuals"].map((badge) => (
              <span key={badge} className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[rgba(110,168,254,0.1)] text-[#6ea8fe] border border-[rgba(110,168,254,0.2)]">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Dataset Info */}
        <div className="glass-card rounded-2xl p-8 border border-[rgba(148,163,184,0.1)] flex flex-col hover:border-[rgba(52,211,153,0.3)] transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[rgba(52,211,153,0.1)] rounded-lg">
              <Database className="text-[#34d399]" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Dataset Details</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-[rgba(148,163,184,0.05)] pb-3">
              <span className="text-[var(--color-text-muted)]">Source</span>
              <span className="font-semibold text-[var(--color-text-primary)]">US Accidents (March 2023)</span>
            </div>
            <div className="flex justify-between border-b border-[rgba(148,163,184,0.05)] pb-3">
              <span className="text-[var(--color-text-muted)]">Total Records</span>
              <span className="font-semibold text-[var(--color-text-primary)]">7,728,394</span>
            </div>
            <div className="flex justify-between border-b border-[rgba(148,163,184,0.05)] pb-3">
              <span className="text-[var(--color-text-muted)]">Feature Dimensions</span>
              <span className="font-semibold text-[var(--color-text-primary)]">46 columns</span>
            </div>
            <div className="flex justify-between border-b border-[rgba(148,163,184,0.05)] pb-3">
              <span className="text-[var(--color-text-muted)]">Time Span</span>
              <span className="font-semibold text-[var(--color-text-primary)]">Feb 2016 – Mar 2023</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-[var(--color-text-muted)]">Coverage</span>
              <span className="font-semibold text-[var(--color-text-primary)]">49 US contiguous states</span>
            </div>
          </div>
        </div>

        {/* Architecture */}
        <div className="glass-card rounded-2xl p-8 border border-[rgba(148,163,184,0.1)] flex flex-col hover:border-[rgba(251,191,36,0.3)] transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[rgba(251,191,36,0.1)] rounded-lg">
              <Server className="text-[#fbbf24]" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">System Architecture</h2>
          </div>
          <div className="space-y-6 flex-1">
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              The project is integrated inside a high-performance Single Page Application (SPA), rendering mathematical insights seamlessly over a RESTful architecture.
            </p>
            <div className="relative pl-6 border-l-2 border-[var(--color-border)] space-y-5">
              {[
                { title: "Raw Data Loading", desc: "Pandas-driven dataset parsing managing 7.7M records." },
                { title: "Machine Learning Pipeline", desc: "Outlier filtering, Log/Yeo-Johnson Skewness fixes, Scalers, and 95% PCA." },
                { title: "Backend Aggregation", desc: "FastAPI server running native Python calculations and endpoints." },
                { title: "Frontend Client", desc: "Vite + React SPA styling with Tailwind v4 and responsive Recharts rendering." }
              ].map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-[rgba(251,191,36,0.2)] border border-[#fbbf24]" />
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">{step.title}</h4>
                  <p className="text-xs text-[var(--color-text-muted)]">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Project Workflow Container */}
      <div className="glass-card rounded-2xl p-8 md:p-10 border border-[rgba(148,163,184,0.1)]">
        <div className="flex items-center gap-3 mb-8 border-b border-[rgba(148,163,184,0.1)] pb-6">
          <Workflow className="text-[#a78bfa]" size={28} />
          <h2 className="text-3xl font-extrabold text-[var(--color-text-primary)]">Data Science Workflow</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#a78bfa]">
              <Database size={20} />
              <h3 className="font-bold text-lg text-[var(--color-text-primary)]">Phase 1: Preprocessing</h3>
            </div>
            <ul className="space-y-3 text-sm text-[var(--color-text-secondary)]">
              <li className="flex gap-2 items-start"><CheckCircle2 className="text-[#a78bfa] shrink-0 w-4 h-4 mt-0.5"/> <span><strong>Reduction:</strong> Dropped sparse/non-impactful cols</span></li>
              <li className="flex gap-2 items-start"><CheckCircle2 className="text-[#a78bfa] shrink-0 w-4 h-4 mt-0.5"/> <span><strong>Imputation:</strong> Media combos, group-by dependency logic for weather</span></li>
              <li className="flex gap-2 items-start"><CheckCircle2 className="text-[#a78bfa] shrink-0 w-4 h-4 mt-0.5"/> <span><strong>Outliers:</strong> Z-score filter & IQR scaling, cleanly removing ~2M skewed obs</span></li>
            </ul>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#6ea8fe]">
              <FileSearch size={20} />
              <h3 className="font-bold text-lg text-[var(--color-text-primary)]">Phase 2: Exploratory EDA</h3>
            </div>
            <ul className="space-y-3 text-sm text-[var(--color-text-secondary)]">
              <li className="flex gap-2 items-start"><CheckCircle2 className="text-[#6ea8fe] shrink-0 w-4 h-4 mt-0.5"/> <span>Distribution visualizations confirming successful stratified class balancing</span></li>
              <li className="flex gap-2 items-start"><CheckCircle2 className="text-[#6ea8fe] shrink-0 w-4 h-4 mt-0.5"/> <span>Correlation matrices detecting multicollinearity</span></li>
              <li className="flex gap-2 items-start"><CheckCircle2 className="text-[#6ea8fe] shrink-0 w-4 h-4 mt-0.5"/> <span>Extensive visual integration hosted directly in Dashboard</span></li>
            </ul>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#fb7185]">
              <LineChart size={20} />
              <h3 className="font-bold text-lg text-[var(--color-text-primary)]">Phase 3: Machine Learning</h3>
            </div>
            <ul className="space-y-3 text-sm text-[var(--color-text-secondary)]">
              <li className="flex gap-2 items-start"><CheckCircle2 className="text-[#fb7185] shrink-0 w-4 h-4 mt-0.5"/> <span><strong>Skewness Fix:</strong> np.log1p & Yeo-Johnson Transform</span></li>
              <li className="flex gap-2 items-start"><CheckCircle2 className="text-[#fb7185] shrink-0 w-4 h-4 mt-0.5"/> <span><strong>Encoding:</strong> Dynamic LabelEncoder structure</span></li>
              <li className="flex gap-2 items-start"><CheckCircle2 className="text-[#fb7185] shrink-0 w-4 h-4 mt-0.5"/> <span><strong>Dimensionality:</strong> 95% variance PCA modeling matrix</span></li>
            </ul>
          </div>

        </div>
      </div>

      {/* Insights */}
      <div className="glass-card rounded-2xl p-8 md:p-10 border border-[rgba(148,163,184,0.1)]">
        <div className="flex items-center gap-3 mb-6">
          <ShieldAlert className="text-[#fb7185]" size={24} />
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Key Analytical Insights</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "Severity Baseline", text: "The dataset has been stratified to maintain equal analytical weight across all four severities, avoiding predictive bias." },
            { title: "Rush Hour Risk", text: "Weekday data presents intense spikes directly within the 7:00–9:00 AM and 3:00–6:00 PM commuting timeframes." },
            { title: "Intersectional Hazards", text: "High accident rates correlate heavily parallel to Traffic Signals and Crossings in urban matrices." },
            { title: "Weather Moderation", text: "Dense frequency occurs during moderate standard temperatures. Severity spikes only exist in extreme distributions." },
            { title: "Geographic Saturation", text: "Absolute volume directly correlates natively with populations in CA, FL, and TX." },
          ].map((insight, i) => (
            <div key={i} className="p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] hover:border-[rgba(251,113,133,0.3)] transition-colors">
              <h4 className="text-sm font-bold text-[var(--color-text-primary)] mb-2 text-[#fb7185]">{insight.title}</h4>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{insight.text}</p>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
