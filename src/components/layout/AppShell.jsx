import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUserProfile } from '@/lib/useUserProfile';
import { LogOut, Home, Receipt, CalendarClock, SlidersHorizontal, UserRound } from 'lucide-react';
import { LogoWordmark } from '@/components/brand/Logo';
import Disclaimer from '@/components/Disclaimer';
import { base44 } from '@/api/base44Client';

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/', match: (p) => p === '/' || p === '/Dashboard' },
  { label: 'Pagamenti', to: '/Pagamenti', match: (p) => p === '/Pagamenti' },
  { label: 'Scadenze', to: '/ScadenzeFiscali', match: (p) => p === '/ScadenzeFiscali' },
  { label: 'Impostazioni', to: '/Settings', match: (p) => p === '/Settings' },
  { label: 'Profilo', to: '/Profile', match: (p) => p === '/Profile' },
];

const REGIME_LABEL = {
  forfettario_5: 'Forfettario', forfettario_15: 'Forfettario', ordinario: 'Ordinario',
};
const PROFESSION_ATECO = {
  architetto: '71.11', ingegnere: '71.12', altro_inarcassa: 'Inarcassa', altro_inps: 'INPS',
};

function SidebarContent({ profile, displayName, initials, location, onNavigate }) {
  return (
    <div className="flex flex-col h-full py-[22px]">
      <div className="px-[22px] pb-7">
        <LogoWordmark size={26} />
      </div>
      <nav className="flex flex-col gap-0.5 px-3">
        {NAV_ITEMS.map((item, i) => {
          const active = item.match(location.pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[7px] text-[13.5px] transition-colors"
              style={{
                background: active ? 'var(--fx-accent-soft)' : 'transparent',
                color: active ? 'var(--fx-ind-deep)' : 'var(--fx-mut)',
                fontWeight: active ? 600 : 500,
              }}
            >
              <span className="fx-num text-[10px] opacity-65">0{i + 1}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-[22px] pt-4 border-t border-fx-line-soft">
        <div className="flex items-center gap-2.5">
          <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
            style={{ background: 'var(--fx-ind)' }}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold truncate" style={{ color: 'var(--fx-txt)' }}>{displayName}</div>
            <div className="fx-label text-[8.5px]">
              {(REGIME_LABEL[profile?.tax_regime] || 'Forfettario')}
              {profile?.profession ? ` · ${PROFESSION_ATECO[profile.profession] || ''}` : ''}
            </div>
          </div>
          <button onClick={() => base44.auth.logout()} title="Esci"
            className="w-7 h-7 rounded-md flex items-center justify-center text-fx-mut hover:bg-fx-chip transition-colors">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="mt-3">
          <Disclaimer compact />
        </div>
      </div>
    </div>
  );
}

const MOBILE_NAV = [
  { label: 'Home', to: '/', icon: Home, match: NAV_ITEMS[0].match },
  { label: 'Pagamenti', to: '/Pagamenti', icon: Receipt, match: NAV_ITEMS[1].match },
  { label: 'Scadenze', to: '/ScadenzeFiscali', icon: CalendarClock, match: NAV_ITEMS[2].match },
  { label: 'Fiscale', to: '/Settings', icon: SlidersHorizontal, match: NAV_ITEMS[3].match },
  { label: 'Profilo', to: '/Profile', icon: UserRound, match: NAV_ITEMS[4].match },
];

function BottomNav({ location }) {
  return (
    <nav className="md:hidden fx-bottom-nav" aria-label="Navigazione principale">
      <div className="flex items-stretch justify-around h-[60px] px-1">
        {MOBILE_NAV.map(({ label, to, icon: Icon, match }) => {
          const active = match(location.pathname);
          return (
            <Link key={to} to={to}
              className="fx-tap relative flex-1 flex flex-col items-center justify-center gap-1 text-[10.5px] font-semibold"
              style={{ color: active ? 'var(--fx-ind)' : 'var(--fx-mut)' }}
              aria-current={active ? 'page' : undefined}>
              {active && (
                <motion.span layoutId="fx-nav-pill" className="absolute top-1.5 w-12 h-7 rounded-full"
                  style={{ background: 'var(--fx-accent-soft)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
              )}
              <Icon className="relative w-[19px] h-[19px]" strokeWidth={active ? 2.3 : 1.9} />
              <span className="relative">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function AppShell({ children }) {
  const location = useLocation();
  const { profile, initials, displayName } = useUserProfile();
  const sidebarProps = { profile, displayName, initials, location };

  return (
    <div className="h-[100dvh] flex overflow-hidden" style={{ background: 'var(--fx-bg)' }}>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-[216px] shrink-0 flex-col border-r border-fx-line"
        style={{ background: 'var(--fx-panel)' }}>
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Contenuto */}
      <main className="flex-1 min-w-0 overflow-y-auto overscroll-contain">{children}</main>

      {/* Tab bar mobile */}
      <BottomNav location={location} />
    </div>
  );
}
