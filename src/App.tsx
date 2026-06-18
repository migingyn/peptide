import { Routes, Route, Navigate } from 'react-router-dom';
import { TabBar } from './components/TabBar';
import { Dashboard } from './features/home/Dashboard';
import { ExploreScreen } from './features/explore/ExploreScreen';
import { KitView } from './features/reconstitute/KitView';
import { CalculatorView } from './features/reconstitute/CalculatorView';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <main className="app__main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/explore" element={<ExploreScreen />} />
          <Route path="/reconstitute" element={<KitView />} />
          <Route path="/reconstitute/calc/:peptideId" element={<CalculatorView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <TabBar />
    </div>
  );
}
