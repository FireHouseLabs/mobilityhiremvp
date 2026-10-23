import React, { useState, useMemo } from 'react';
import { useMobilityStore } from '../../context/MobilityStore';
import { UnitStatus, EquipmentCategory } from '../../types/mobility';
import { 
  Search, 
  Filter, 
  Wrench, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RotateCcw,
  Edit2,
  Package
} from 'lucide-react';

interface EquipmentFleetViewProps {
  onOpenReturnCheckIn: (assetTag: string) => void;
  onOpenManualHire: () => void;
}

export const EquipmentFleetView: React.FC<EquipmentFleetViewProps> = ({ 
  onOpenReturnCheckIn, 
  onOpenManualHire 
}) => {
  const { inventory, updateUnitStatus, setAdminTab } = useMobilityStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | UnitStatus>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | EquipmentCategory>('All');

  // Filtered list
  const filteredUnits = useMemo(() => {
    return inventory.filter(u => {
      const matchStatus = statusFilter === 'All' || u.status === statusFilter;
      const matchCat = categoryFilter === 'All' || u.category === categoryFilter;
      const matchSearch = 
        u.assetTag.toLowerCase().includes(search.toLowerCase()) ||
        u.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
        u.modelName.toLowerCase().includes(search.toLowerCase()) ||
        (u.currentHirerName && u.currentHirerName.toLowerCase().includes(search.toLowerCase()));

      return matchStatus && matchCat && matchSearch;
    });
  }, [inventory, search, statusFilter, categoryFilter]);

  const handleStatusChange = (assetTag: string, newStatus: UnitStatus) => {
    if (newStatus === 'On Hire' || newStatus === 'Overdue') {
      alert('To mark a unit on hire, please use the "New Manual Rental" tool to link a customer contract.');
      return;
    }
    updateUnitStatus(assetTag, newStatus);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Equipment pool</h2>
          <p className="text-xs text-slate-500">
            Track availability, loans, cleaning, and maintenance for each unit.
          </p>
        </div>

        <button
          onClick={onOpenManualHire}
          className="px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs self-start sm:self-auto"
        >
          + Rent Available Unit (Manual Counter)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Asset Tag, Serial, Model, Hirer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Status Segmented Filters */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1 sm:pb-0">
            {(['All', 'Available', 'Reserved', 'On Hire', 'Overdue', 'In Maintenance', 'Cleaning'] as const).map(st => {
              const count = st === 'All' ? inventory.length : inventory.filter(u => u.status === st).length;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {st} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Asset Tag / Serial</th>
                <th className="py-3 px-4">Equipment Model</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Hirer & Due Return</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No equipment units found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((unit) => {
                  const isReserved = unit.status === 'Reserved';
                  const isHired = unit.status === 'On Hire' || unit.status === 'Overdue';
                  return (
                    <tr key={unit.assetTag} className="hover:bg-slate-50/60 transition-colors">
                      {/* Asset Tag & Serial */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 text-xs block">
                          {unit.assetTag}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {unit.serialNumber}
                        </span>
                      </td>

                      {/* Equipment Model */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 leading-snug">{unit.modelName}</p>
                        {unit.notes && (
                          <p className="text-[10px] text-slate-500 italic truncate max-w-xs">
                            {unit.notes}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold ${
                          unit.status === 'Available' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          unit.status === 'On Hire' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                          unit.status === 'Overdue' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                          unit.status === 'Cleaning' ? 'bg-teal-50 text-teal-800 border border-teal-200' :
                          'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            unit.status === 'Available' ? 'bg-emerald-500' :
                            unit.status === 'On Hire' ? 'bg-blue-500' :
                            unit.status === 'Overdue' ? 'bg-amber-500' :
                            unit.status === 'Cleaning' ? 'bg-teal-500' : 'bg-slate-500'
                          }`}></span>
                          {unit.status}
                        </span>
                      </td>

                      {/* Hirer & Due */}
                      <td className="py-3 px-4">
                        {isHired || isReserved ? (
                          <div>
                            <p className="font-semibold text-slate-900">{unit.currentHirerName}</p>
                            <p className="text-[10px] text-slate-500">
                              Due: <strong className={unit.status === 'Overdue' ? 'text-amber-800' : 'text-slate-700'}>{unit.dueDate}</strong>
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                        {unit.location}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                        {isReserved ? <button onClick={() => setAdminTab('all-bookings')} className="px-2.5 py-1 text-xs border border-slate-300 rounded">View booking</button> : isHired ? (
                          <button
                            onClick={() => onOpenReturnCheckIn(unit.assetTag)}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors"
                          >
                            Return Check-In
                          </button>
                        ) : (
                          <select
                            value={unit.status}
                            onChange={(e) => handleStatusChange(unit.assetTag, e.target.value as any)}
                            className="px-2 py-1 bg-white border border-slate-300 rounded text-[11px] text-slate-700 focus:ring-1 focus:ring-teal-500"
                          >
                            <option value="Available">Set Available</option>
                            <option value="Cleaning">Set Cleaning</option>
                            <option value="In Maintenance">Set Workshop</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
