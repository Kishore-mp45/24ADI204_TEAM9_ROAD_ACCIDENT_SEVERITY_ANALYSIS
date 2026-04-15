import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import OverviewPage from "@/pages/OverviewPage";
import DistributionPage from "@/pages/DistributionPage";
import CorrelationPage from "@/pages/CorrelationPage";
import GeospatialPage from "@/pages/GeospatialPage";
import InsightsPage from "@/pages/InsightsPage";
import MetricsPage from "@/pages/MetricsPage";

const pages: Record<string, React.ComponentType> = {
  overview: OverviewPage,
  metrics: MetricsPage,
  distribution: DistributionPage,
  correlation: CorrelationPage,
  geospatial: GeospatialPage,
  insights: InsightsPage,
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
