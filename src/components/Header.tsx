import React from 'react';
import { useMobilityStore, AdminTab } from '../context/MobilityStore';
import { Accessibility, RotateCcw, Search, Plus } from 'lucide-react';
interface HeaderProps { onOpenLookup: () => void; onOpenManualHire: () => void }
export const Header: React.FC<HeaderProps> = ({ onOpenLookup, onOpenManualHire }) => {
  const { activeView, setActiveView, adminTab, setAdminTab, resetDemoData, bookings } = useMobilityStore();
  const waiting = bookings.filter(b => b.status === 'Confirmed').length;
  const tabs: [AdminTab, string][] = [['dashboard', 'Daily overview'], ['all-bookings', `Loans & bookings${waiting ? ` · ${waiting} awaiting checkout` : ''}`], ['fleet', 'Equipment pool'], ['overdue', 'Overdue']];
  return <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
    <div className="bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>Interactive demo <span className="hidden sm:inline">· Changes saved in this browser · Payments & messages simulated</span></span>
        <button onClick={() => { if (window.confirm('Reset the demo and remove your test bookings?')) resetDemoData(); }} className="flex items-center gap-1.5 hover:text-teal-700"><RotateCcw size={13} /> Reset demo</button>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
      <button onClick={() => setActiveView('customer')} className="flex items-center gap-3 text-left" aria-label="MobilityHire home">
        <span className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center"><Accessibility size={25} /></span>
        <span><span className="block text-xl font-semibold tracking-tight text-slate-900">Mobility<span className="text-teal-700">Hire</span></span><span className="text-xs text-slate-500 hidden sm:block">A little support. More independence.</span></span>
      </button>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-medium">
          {(['customer', 'admin'] as const).map(view => <button key={view} onClick={() => setActiveView(view)} aria-pressed={activeView === view} className={`px-3 py-2 rounded-md ${activeView === view ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>{view === 'customer' ? 'Book equipment' : 'In-store management'}</button>)}
        </div>
        <button onClick={activeView === 'customer' ? onOpenLookup : onOpenManualHire} className={`inline-flex gap-2 items-center px-3 py-2 rounded-lg text-xs font-semibold ${activeView === 'customer' ? 'text-slate-600 border border-slate-200' : 'bg-teal-700 text-white hover:bg-teal-800'}`}>{activeView === 'customer' ? <Search size={15} /> : <Plus size={15} />}{activeView === 'customer' ? 'Find my booking' : 'New counter loan'}</button>
      </div>
    </div>
    {activeView === 'admin' && <nav aria-label="Staff navigation" className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-5 overflow-x-auto">{tabs.map(([tab, label]) => <button key={tab} onClick={() => setAdminTab(tab)} className={`py-3 text-xs font-medium whitespace-nowrap border-b-2 ${adminTab === tab ? 'border-teal-700 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>{label}</button>)}</nav>}
  </header>;
};
