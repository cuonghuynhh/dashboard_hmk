import React from 'react';
import { REGIONS, getBranchesByRegion } from '../utils/constants';

interface LocalFilterUIProps {
  localRegion: string;
  setLocalRegion: (v: string) => void;
  localBranch: string;
  setLocalBranch: (v: string) => void;
}

export const LocalFilterUI: React.FC<LocalFilterUIProps> = ({ localRegion, setLocalRegion, localBranch, setLocalBranch }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2" onClick={(e) => e.stopPropagation()}>
      <select 
        value={localRegion} 
        onChange={(e) => {
          setLocalRegion(e.target.value);
          setLocalBranch("Tất cả Chi nhánh");
        }}
        className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm min-w-[110px]"
      >
        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      
      <select 
        value={localBranch} 
        onChange={(e) => setLocalBranch(e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm max-w-[140px] truncate"
      >
        {getBranchesByRegion(localRegion).map(b => <option key={b} value={b}>{b}</option>)}
      </select>
    </div>
  );
};
