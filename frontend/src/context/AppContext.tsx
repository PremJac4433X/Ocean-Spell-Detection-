import React, { createContext, useContext, useState, useEffect } from 'react';
import { PageId, Incident } from '../types';
import { api } from '../services/api';

interface AppContextType {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  selectedIncidentId: string;
  setSelectedIncidentId: (id: string) => void;
  activeScenario: 'malacca' | 'gom';
  setActiveScenario: (scenario: 'malacca' | 'gom') => void;
  isDisclaimerOpen: boolean;
  setIsDisclaimerOpen: (open: boolean) => void;
  incidentsList: Incident[];
  refreshIncidents: () => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<PageId>('overview');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('inc-malacca-01');
  const [activeScenario, setActiveScenario] = useState<'malacca' | 'gom'>('malacca');
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState<boolean>(false);
  const [incidentsList, setIncidentsList] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshIncidents = async () => {
    try {
      setIsLoading(true);
      const data = await api.getIncidents();
      setIncidentsList(data);
      if (data.length > 0 && !selectedIncidentId) {
        setSelectedIncidentId(data[0].id);
      }
    } catch (err) {
      console.warn('Backend connection pending, running in standalone demo client mode', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshIncidents();
  }, []);

  // Update selected incident when scenario changes
  useEffect(() => {
    if (activeScenario === 'malacca') {
      setSelectedIncidentId('inc-malacca-01');
    } else {
      setSelectedIncidentId('inc-gom-02');
    }
  }, [activeScenario]);

  return (
    <AppContext.Provider
      value={{
        activePage,
        setActivePage,
        selectedIncidentId,
        setSelectedIncidentId,
        activeScenario,
        setActiveScenario,
        isDisclaimerOpen,
        setIsDisclaimerOpen,
        incidentsList,
        refreshIncidents,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
