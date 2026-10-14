import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DisclaimerModal } from './components/layout/DisclaimerModal';

// Pages
import { OverviewDashboard } from './pages/OverviewDashboard';
import { LiveOceanMapPage } from './pages/LiveOceanMapPage';
import { OilSpillDetection } from './pages/OilSpillDetection';
import { VesselIntelligence } from './pages/VesselIntelligence';
import { RouteInvestigation } from './pages/RouteInvestigation';
import { VesselRanking } from './pages/VesselRanking';
import { SpillTrajectory } from './pages/SpillTrajectory';
import { EnvironmentalImpact } from './pages/EnvironmentalImpact';
import { IncidentManagement } from './pages/IncidentManagement';
import { AIAnalytics } from './pages/AIAnalytics';
import { ReportsExports } from './pages/ReportsExports';
import { DataSources } from './pages/DataSources';
import { SettingsPage } from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const { activePage } = useApp();

  const renderActivePage = () => {
    switch (activePage) {
      case 'overview':
        return <OverviewDashboard />;
      case 'ocean-map':
        return <LiveOceanMapPage />;
      case 'spill-detection':
        return <OilSpillDetection />;
      case 'vessel-intelligence':
        return <VesselIntelligence />;
      case 'route-investigation':
        return <RouteInvestigation />;
      case 'vessel-ranking':
        return <VesselRanking />;
      case 'trajectory-prediction':
        return <SpillTrajectory />;
      case 'environmental-impact':
        return <EnvironmentalImpact />;
      case 'incident-management':
        return <IncidentManagement />;
      case 'ai-analytics':
        return <AIAnalytics />;
      case 'reports-exports':
        return <ReportsExports />;
      case 'data-sources':
        return <DataSources />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ocean-950 text-slate-100 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {renderActivePage()}
        </main>
      </div>
      <DisclaimerModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
