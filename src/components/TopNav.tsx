import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { formatINR } from '../services/marketDataService';

interface TopNavProps {
  balance: number;
}

export const TopNav: React.FC<TopNavProps> = ({ balance }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `py-1 whitespace-nowrap shrink-0 transition-colors border-b ${
      isActive
        ? 'text-[#141413] border-[#141413] font-medium'
        : 'text-[#5C5B57] border-transparent hover:text-[#141413]'
    }`;

  return (
    <header className="w-full border-b border-[#E6E4DF] bg-[#F9F8F6] relative z-30">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-8 h-14 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Title */}
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="font-medium tracking-tight text-[#141413] text-[15px] whitespace-nowrap shrink-0"
        >
          Paper Trading Arena
        </Link>

        {/* Zone 2: Minimal Navigation Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-8 text-[13px]"
        >
          <NavLink to="/lab" className={linkClass}>
            Decision Lab
          </NavLink>
          <NavLink to="/history" className={linkClass}>
            History
          </NavLink>
          <NavLink to="/progress" className={linkClass}>
            Progress
          </NavLink>
        </nav>

        {/* Zone 3: Virtual Balance & Mobile Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span
              className="font-mono tabular-nums text-[13px] sm:text-sm font-medium text-[#141413] whitespace-nowrap"
              title="Virtual balance"
            >
              {formatINR(balance, 0)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 -mr-1 text-[#141413] hover:bg-[#F2F0EC] rounded transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Compact Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E6E4DF] bg-[#F9F8F6] px-4 py-3 flex flex-col gap-1 text-sm">
          <NavLink
            to="/lab"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `py-2 px-2 rounded ${
                isActive ? 'bg-[#F2F0EC] text-[#141413] font-medium' : 'text-[#5C5B57]'
              }`
            }
          >
            Decision Lab
          </NavLink>
          <NavLink
            to="/history"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `py-2 px-2 rounded ${
                isActive ? 'bg-[#F2F0EC] text-[#141413] font-medium' : 'text-[#5C5B57]'
              }`
            }
          >
            History
          </NavLink>
          <NavLink
            to="/progress"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `py-2 px-2 rounded ${
                isActive ? 'bg-[#F2F0EC] text-[#141413] font-medium' : 'text-[#5C5B57]'
              }`
            }
          >
            Progress
          </NavLink>
        </div>
      )}
    </header>
  );
};
