import React, { useState, useMemo } from 'react';
import { Trophy, Store } from 'lucide-react';
import { useAppContext } from "../AppContext";
import { aggregateMetrics } from "../utils/chartEngine";
import { useLocalFilter } from "../hooks/useLocalFilter";
import { LocalFilterUI } from "./LocalFilterUI";
import { BRANCH_TO_REGION } from "../utils/constants";

type DimensionMode = "branch" | "region";

const getDropRate = (name: string) => {
  const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return 0.05 + (hash % 10) * 0.015; // 5% to 18.5%
};

export const TopPerformanceTable: React.FC = () => {
  const { dateRange } = useAppContext();
  const { localRegion, setLocalRegion, localBranch, setLocalBranch } = useLocalFilter();
  const [dimension, setDimension] = useState<DimensionMode>("branch");

  const { tableData, filteredSystemGmv, totalFilteredNetRev } = useMemo(() => {
    // When evaluating Top branches/regions, we evaluate against the base system within the selected localRegion/localBranch context.
    const agg = aggregateMetrics(new Date(dateRange.start), new Date(dateRange.end), localRegion, localBranch);
    
    // The branches object in agg already contains only the filtered branches proportional to the region/branch.
    // However, we want to show the breakdown of this subset.
    const sysGmv = agg.gmv;

    interface RawItem {
      name: string;
      gmv: number;
      netRev: number;
      dropRatio: number;
    }

    let initialRows: RawItem[] = [];
    const effectiveDimension = localRegion !== "Tất cả Khu vực" ? "branch" : dimension;

    if (effectiveDimension === "branch") {
      initialRows = Object.keys(agg.branches).map(branchName => {
        const gmv = agg.branches[branchName];
        const dropRate = getDropRate(branchName);
        const netRev = gmv * (1 - dropRate);
        const dropRatio = gmv > 0 ? (gmv - netRev) / gmv : 0;
        
        return { name: branchName, gmv, netRev, dropRatio };
      });
    } else {
      const regionData: Record<string, { gmv: number, netRev: number }> = {};
      Object.keys(agg.branches).forEach(branchName => {
        const region = BRANCH_TO_REGION[branchName] || 'Khác';
        const gmv = agg.branches[branchName];
        const dropRate = getDropRate(branchName);
        const netRev = gmv * (1 - dropRate);
        
        if (!regionData[region]) {
          regionData[region] = { gmv: 0, netRev: 0 };
        }
        regionData[region].gmv += gmv;
        regionData[region].netRev += netRev;
      });

      initialRows = Object.keys(regionData).map(region => {
        const gmv = regionData[region].gmv;
        const netRev = regionData[region].netRev;
        const dropRatio = gmv > 0 ? (gmv - netRev) / gmv : 0;

        return { name: region, gmv, netRev, dropRatio };
      });
    }

    const totalNetRev = initialRows.reduce((acc, curr) => acc + curr.netRev, 0);

    const rows = initialRows.map(item => ({
      ...item,
      gmvWeight: sysGmv > 0 ? (item.gmv / sysGmv) * 100 : 0,
      netRevWeight: totalNetRev > 0 ? (item.netRev / totalNetRev) * 100 : 0,
    }));

    rows.sort((a, b) => b.gmv - a.gmv);

    return { 
      tableData: rows, 
      filteredSystemGmv: sysGmv,
      totalFilteredNetRev: totalNetRev 
    };
  }, [dateRange, localRegion, localBranch, dimension]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-indigo-600" />
            Bảng xếp hạng Hiệu suất
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Đánh giá sức bán, doanh thu và tỷ lệ trả hàng
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <LocalFilterUI 
            localRegion={localRegion}
            setLocalRegion={setLocalRegion}
            localBranch={localBranch}
            setLocalBranch={setLocalBranch}
          />

          {localRegion === "Tất cả Khu vực" && (
            <div className="flex bg-slate-100 p-1 rounded-md">
              <button 
                onClick={() => setDimension("region")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${dimension === 'region' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-600 hover:bg-slate-200'}`}>
                Theo Khu vực
              </button>
              <button 
                onClick={() => setDimension("branch")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${dimension === 'branch' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-600 hover:bg-slate-200'}`}>
                Theo Chi nhánh
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-slate-500 bg-slate-50 font-medium">
            <tr>
              <th className="px-6 py-4 w-12 text-center">#</th>
              <th className="px-6 py-4 min-w-[180px]">{localRegion === "Tất cả Khu vực" && dimension === 'region' ? 'Khu vực' : 'Tên Chi nhánh'}</th>
              <th className="px-6 py-4 text-right">GMV</th>
              <th className="px-6 py-4 text-right">Tỷ trọng GMV</th>
              <th className="px-6 py-4 text-right">Doanh thu</th>
              <th className="px-6 py-4 text-right">Tỷ trọng Doanh thu</th>
              <th className="px-6 py-4 text-right">Tỷ lệ trả hàng</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, idx) => (
              <tr key={row.name} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                <td className="px-6 py-4 text-center text-slate-400 font-medium">
                  {idx + 1}
                </td>
                <td className="px-6 py-4 font-bold text-slate-700 flex items-center gap-2">
                  <Store className="w-4 h-4 text-slate-400" />
                  {row.name}
                </td>
                <td className="px-6 py-4 text-right font-semibold text-slate-700">
                  {Math.round(row.gmv).toLocaleString('vi-VN')} Tr
                </td>
                <td className="px-6 py-4 text-right text-indigo-600 font-semibold">
                  {row.gmvWeight.toFixed(1).replace('.', ',')}%
                </td>
                <td className="px-6 py-4 text-right font-medium text-emerald-600">
                  {Math.round(row.netRev).toLocaleString('vi-VN')} Tr
                </td>
                <td className="px-6 py-4 text-right text-emerald-600 font-semibold">
                  {row.netRevWeight.toFixed(1).replace('.', ',')}%
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`font-medium px-2 py-1 rounded ${row.dropRatio > 0.12 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'}`}>
                    {(row.dropRatio * 100).toFixed(1).replace('.', ',')}%
                  </span>
                </td>
              </tr>
            ))}
            
            {tableData.length > 0 && (
              <tr className="bg-slate-50/80 font-bold border-t-2 border-slate-200">
                <td className="px-6 py-4 text-center"></td>
                <td className="px-6 py-4 text-slate-800">
                  {localRegion === "Tất cả Khu vực" ? "Tổng Hệ Thống" : `Tổng ${localRegion}`}
                </td>
                <td className="px-6 py-4 text-right text-slate-800">
                  {Math.round(filteredSystemGmv).toLocaleString('vi-VN')} Tr
                </td>
                <td className="px-6 py-4 text-right text-indigo-600">100%</td>
                <td className="px-6 py-4 text-right text-emerald-600">
                  {Math.round(totalFilteredNetRev).toLocaleString('vi-VN')} Tr
                </td>
                <td className="px-6 py-4 text-right text-emerald-600">100%</td>
                <td className="px-6 py-4 text-right text-slate-600">
                  {filteredSystemGmv > 0 
                    ? (((filteredSystemGmv - totalFilteredNetRev) / filteredSystemGmv) * 100).toFixed(1).replace('.', ',') + '%'
                    : '0%'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
