import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import OverviewPage from "@/pages/OverviewPage";
import DistributionPage from "@/pages/DistributionPage";
import CorrelationPage from "@/pages/CorrelationPage";
import InsightsPage from "@/pages/InsightsPage";
import MetricsPage from "@/pages/MetricsPage";
import TemporalTrendsPage from "@/pages/TemporalTrendsPage";
import HierarchyPage from "@/pages/HierarchyPage";
import MultiVariatePage from "@/pages/MultiVariatePage";
import DensityPage from "@/pages/DensityPage";
import StatisticalPage from "@/pages/StatisticalPage";
import ComparativePage from "@/pages/ComparativePage";
import PatternPage from "@/pages/PatternPage";

const pages: Record<string, React.ComponentType> = {
  overview: OverviewPage,
  metrics: MetricsPage,
  distribution: DistributionPage,
  correlation: CorrelationPage,
  insights: InsightsPage,
  temporal: TemporalTrendsPage,
  hierarchy: HierarchyPage,
  multivariate: MultiVariatePage,
  density: DensityPage,
  statistical: StatisticalPage,
  comparative: ComparativePage,
  patterns: PatternPage,
};

export default function App() {
  const [activePage, setActivePage] = useState("overview");
  const PageComponent = pages[activePage] || OverviewPage;

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <TopBar />
      <main className="ml-64 pt-24 px-8 pb-16 min-h-screen">
        <div key={activePage} className="animate-fade-in">
          <PageComponent />
        </div>
      </main>
    </div>
  );
}
