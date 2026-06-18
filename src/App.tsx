import { useEffect, type ReactNode } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { TabBar } from './components/TabBar';
import { Dashboard } from './features/home/Dashboard';
import { ExploreView } from './features/explore/ExploreView';
import { PeptideDetail } from './features/explore/PeptideDetail';
import { KitView } from './features/reconstitute/KitView';
import { CalculatorView } from './features/reconstitute/CalculatorView';
import { Onboarding } from './features/onboarding/Onboarding';
import { GetStarted } from './features/goals/GetStarted';
import { GoalGrid } from './features/goals/GoalGrid';
import { GoalIntro } from './features/goals/GoalIntro';
import { Proceed } from './features/goals/Proceed';
import { ProtocolDetail } from './features/protocol/ProtocolDetail';
import { StartProtocol } from './features/protocol/StartProtocol';
import { GuideMe } from './features/reconstitute/GuideMe';
import { Settings } from './features/home/Settings';
import { useAppState } from './state/store';
import './App.css';

function readFastOnboarded(): boolean {
  try {
    return localStorage.getItem('peps.onboarded') === '1';
  } catch {
    return false;
  }
}

function OnboardingGate({ children }: { children: ReactNode }) {
  const { profile, hydrated } = useAppState();
  const nav = useNavigate();
  const loc = useLocation();

  // Fast-path: trust localStorage before idb hydration to avoid an onboarding flash.
  const onboarded = hydrated ? profile.onboardedAt != null : readFastOnboarded();
  const inOnboarding = loc.pathname.startsWith('/onboarding');

  useEffect(() => {
    if (!onboarded && !inOnboarding) nav('/onboarding', { replace: true });
    if (onboarded && inOnboarding) nav('/get-started', { replace: true });
  }, [onboarded, inOnboarding, nav]);

  return <>{children}</>;
}

export default function App() {
  const loc = useLocation();
  const inOnboarding = loc.pathname.startsWith('/onboarding');

  return (
    <OnboardingGate>
      <div className="app">
        <main className="app__main">
          <Routes>
            <Route path="/onboarding/*" element={<Onboarding />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/get-started" element={<GetStarted />} />
            <Route path="/goals" element={<GoalGrid />} />
            <Route path="/goal/:goalId" element={<GoalIntro />} />
            <Route path="/goal/:goalId/proceed" element={<Proceed />} />
            <Route path="/protocol/:protocolId" element={<ProtocolDetail />} />
            <Route path="/protocol/:protocolId/start" element={<StartProtocol />} />
            <Route path="/explore" element={<ExploreView />} />
            <Route path="/explore/peptide/:peptideId" element={<PeptideDetail />} />
            <Route path="/reconstitute" element={<KitView />} />
            <Route path="/reconstitute/calc/:peptideId" element={<CalculatorView />} />
            <Route path="/reconstitute/guide/:peptideId" element={<GuideMe />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        {!inOnboarding && <TabBar />}
      </div>
    </OnboardingGate>
  );
}
