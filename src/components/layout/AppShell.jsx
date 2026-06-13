import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserProfile } from '@/lib/useUserProfile';
import { LogOut, Menu, X } from 'lucide-react';
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

export default function AppShell({ children }) {
  const location = useLocation();
  const { profile, initials, displayName } = useUserProfile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarProps = { profile, displayName, initials, location };

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: 'var(--fx-bg)' }}>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-[216px] shrink-0 flex-col border-r border-fx-line"
        style={{ background: 'var(--fx-panel)' }}>
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Top bar mobile */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 h-14 flex items-center justify-between px-4 border-b border-fx-line"
        style={{ background: 'var(--fx-panel)' }}>
        <LogoWordmark size={22} />
        <button onClick={() => setMobileOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-fx-chip">
          <Menu className="w-5 h-5" style={{ color: 'var(--fx-txt)' }} />
        </button>
      </div>

      {/* Drawer mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-50 bg-black/30" onClick={() => setMobileOpen(false)} />
            <motion.aside
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'spring', stiffness: 420, damping: 38 }}
              className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-[240px] border-r border-fx-line"
              style={{ background: 'var(--fx-panel)' }}>
              <button onClick={() => setMobileOpen(false)} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-fx-chip z-10">
                <X className="w-4 h-4" style={{ color: 'var(--fx-mut)' }} />
              </button>
              <SidebarContent {...sidebarProps} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Contenuto */}
      <main className="flex-1 min-w-0 pt-14 md:pt-0 overflow-y-auto">{children}</main>
    </div>
  );
}
