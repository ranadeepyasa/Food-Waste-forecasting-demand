import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Store } from 'lucide-react';
import { CenterItem } from '../types';
import { getCityDisplayName } from '../cityDisplayNames';

interface CenterSearchDropdownProps {
  centers: CenterItem[];
  selectedCenterId: number;
  onSelect: (centerId: number) => void;
  disabled?: boolean;
}

export function formatCenterType(rawType: string): string {
  if (!rawType) return '';
  return rawType
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatCenterLabel(center: CenterItem): string {
  const cityName = getCityDisplayName(center.city_code);
  return `Center ${center.center_id} — ${cityName} — ${formatCenterType(center.center_type)}`;
}

export const CenterSearchDropdown: React.FC<CenterSearchDropdownProps> = ({
  centers,
  selectedCenterId,
  onSelect,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const selectedCenter = useMemo(
    () => centers.find((c) => c.center_id === selectedCenterId),
    [centers, selectedCenterId]
  );

  // Filter centers by center ID, city name, city code, or center type
  const filteredCenters = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return centers;

    return centers.filter((c) => {
      const centerIdMatch = c.center_id.toString().includes(term);
      const cityCodeMatch = c.city_code.toString().includes(term);
      const cityName = getCityDisplayName(c.city_code).toLowerCase();
      const cityNameMatch = cityName.includes(term);
      const typeFormatted = formatCenterType(c.center_type).toLowerCase();
      const typeRaw = c.center_type.toLowerCase();
      const typeMatch = typeFormatted.includes(term) || typeRaw.includes(term);
      const fullLabel = formatCenterLabel(c).toLowerCase();

      return centerIdMatch || cityCodeMatch || cityNameMatch || typeMatch || fullLabel.includes(term);
    });
  }, [centers, searchTerm]);

  const handleSelect = (centerId: number) => {
    onSelect(centerId);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
          isOpen ? 'ring-2 ring-primary/20 border-primary shadow-sm' : 'hover:border-primary/40'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center space-x-2 truncate mr-2">
          <Store className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="truncate font-medium text-dark">
            {selectedCenter ? (
              formatCenterLabel(selectedCenter)
            ) : (
              <span className="text-muted">Select Fulfillment Center...</span>
            )}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted flex-shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-40 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="p-2.5 border-b border-border bg-[#FAFAF8]">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Center ID (e.g. 13), City (e.g. Mumbai), or Code..."
                className="w-full bg-card border border-border rounded-md pl-8 pr-8 py-1.5 text-xs text-dark placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 text-muted hover:text-dark p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted mt-1.5 px-0.5">
              <span>{filteredCenters.length} of {centers.length} fulfillment centers</span>
              <span className="text-muted/70">Press Esc to close</span>
            </div>
          </div>

          {/* Center List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-border/40">
            {filteredCenters.length > 0 ? (
              filteredCenters.map((center) => {
                const isSelected = center.center_id === selectedCenterId;
                return (
                  <button
                    key={center.center_id}
                    type="button"
                    onClick={() => handleSelect(center.center_id)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-primary-light text-primary font-semibold'
                        : 'text-dark hover:bg-background'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          isSelected ? 'bg-primary' : 'bg-muted/40'
                        }`}
                      />
                      <span className="truncate">{formatCenterLabel(center)}</span>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                      <span className="text-[10px] font-mono text-muted bg-background px-1.5 py-0.5 rounded border border-border/60">
                        {center.op_area} km²
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-muted space-y-1">
                <p>No fulfillment centers match "{searchTerm}"</p>
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  Clear search query
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
