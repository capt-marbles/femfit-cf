import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Sparkles, Dumbbell, Ruler } from 'lucide-react';

const tabs = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/generate', icon: Sparkles, label: 'Generate' },
  { to: '/log', icon: Dumbbell, label: 'Log' },
  { to: '/measurements', icon: Ruler, label: 'Measure' },
];

export default function Navigation() {
  return (
    <>
      {/* Desktop top nav */}
      <header className="hidden md:flex items-center justify-between px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-50">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <Sparkles className="w-5 h-5 text-pink-500" />
          FemFit Analyzer
        </div>
        <nav className="flex items-center gap-1">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="grid grid-cols-4">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-pink-500'
                    : 'text-zinc-400 dark:text-zinc-500'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Mobile top title bar */}
      <header className="md:hidden flex items-center px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-40">
        <div className="flex items-center gap-2 font-semibold">
          <Sparkles className="w-4 h-4 text-pink-500" />
          FemFit Analyzer
        </div>
      </header>
    </>
  );
}
