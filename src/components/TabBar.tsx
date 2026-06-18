import { NavLink } from 'react-router-dom';
import './TabBar.css';

const TABS = [
  { to: '/', label: 'Home', end: true },
  { to: '/explore', label: 'Explore', end: false },
  { to: '/reconstitute', label: 'Reconstitute', end: false },
];

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Primary">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => (isActive ? 'tabbar__link is-active' : 'tabbar__link')}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
