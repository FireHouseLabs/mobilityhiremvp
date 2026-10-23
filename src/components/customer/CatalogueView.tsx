import React, { useState, useMemo } from 'react';
import { useMobilityStore } from '../../context/MobilityStore';
import { EquipmentCategory, EquipmentModel } from '../../types/mobility';
import { 
  Search, 
  Calendar, 
  Truck, 
  Shield, 
  CheckCircle2, 
  Info, 
  ArrowRight, 
  Weight, 
  Layers,
  Sparkles,
  PhoneCall
} from 'lucide-react';

interface CatalogueViewProps {
  onSelectModel: (model: EquipmentModel) => void;
  onOpenLookup: () => void;
}

const CATEGORIES: EquipmentCategory[] = [
  'All',
  'Wheelchairs',
  'Mobility Scooters',
  'Walking Aids',
  'Home Care & Beds',
  'Bathroom & Hygiene',
  'Ramps & Access'
];

export const CatalogueView: React.FC<CatalogueViewProps> = ({ onSelectModel, onOpenLookup }) => {
  const { models, getAvailableCount } = useMobilityStore();
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const filteredModels = useMemo(() => {
    return models.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.suitability.toLowerCase().includes(searchQuery.toLowerCase());
      
      const availableUnits = getAvailableCount(item.id);
      const matchesAvailable = !onlyAvailable || availableUnits > 0;

      return matchesCategory && matchesSearch && matchesAvailable;
    });
  }, [models, selectedCategory, searchQuery, onlyAvailable, getAvailableCount]);

  return (
    <div className="space-y-8 pb-16">
      <section className="py-5 sm:py-9 max-w-3xl">
        <p className="text-xs font-semibold tracking-widest uppercase text-teal-700 mb-4">Mobility equipment hire</p>
        <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-slate-900 leading-tight">The support you need,<br />for as long as you need it.</h2>
        <p className="text-slate-500 text-base leading-relaxed mt-5 max-w-xl">Find equipment for recovery, everyday living, or a little extra independence. Choose your dates, then collect in store or arrange home delivery.</p>
        <p className="text-sm text-slate-500 mt-5">Choose equipment <span className="px-2 text-slate-300">→</span> Set your dates <span className="px-2 text-slate-300">→</span> Reserve online</p>
      </section>
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search wheelchairs, scooters, rollators, beds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Availability filter checkbox */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none bg-white px-3 py-2 border border-slate-200 rounded-lg shadow-sm">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span>Available equipment only</span>
            </label>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalogue Grid */}
      {filteredModels.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <Info className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">No equipment found matching criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, selecting "All Categories", or unchecking the available-only filter.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
              setOnlyAvailable(false);
            }}
            className="text-xs font-medium text-teal-700 hover:text-teal-800 underline"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((item) => {
            const availableCount = getAvailableCount(item.id);
            const isAvailable = availableCount > 0;

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-teal-400 transition-colors flex flex-col"
              >
                {/* Photo & Availability Tag */}
                <div className="relative h-48 bg-white overflow-hidden group">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain p-5 group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-3 right-3">
                    {isAvailable ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {availableCount} {availableCount === 1 ? 'Unit Ready' : 'Units Ready'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Currently unavailable
                      </span>
                    )}
                  </div>


                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-base text-slate-900 leading-snug ">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.shortDesc}
                    </p>


                  </div>

                  {/* Pricing and Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-end justify-between gap-3">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-extrabold text-slate-900">${item.dailyRate}</span>
                        <span className="text-xs text-slate-500">/day</span>
                      </div>
                      <p className="text-[11px] text-teal-700 font-medium">
                        ${item.weeklyRate}/week · {item.minHireDays} day minimum
                      </p>
                    </div>

                    <button
                      onClick={() => onSelectModel(item)}
                      disabled={!isAvailable}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                        isAvailable
                          ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      }`}
                    >
                      <span>{isAvailable ? 'Book equipment' : 'Unavailable'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Service Help Footer */}
      <section className="bg-slate-100 border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Need advice on size or hospital discharge?</h4>
            <p className="text-xs text-slate-600">Our equipment specialists and occupational therapy consultants can advise the right fit.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-700">Shop Counter: (03) 9820 1200</span>
          <button
            onClick={onOpenLookup}
            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-white border border-slate-300 text-slate-800 hover:bg-slate-50"
          >
            Check Existing Booking
          </button>
        </div>
      </section>
    </div>
  );
};
