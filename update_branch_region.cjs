const fs = require('fs');
let code = fs.readFileSync('src/components/BranchRevenueComparison.tsx', 'utf8');

// 1. Update mock data generation to include region
const oldGenData = `const generateMockData = () => {
  const branches = Array.from({ length: 80 }, (_, i) => {
    const prefixes = ["HMK", "HMK HN", "HMK ĐN", "HMK BD"];
    const prefix = prefixes[i % prefixes.length];
    return \`\${prefix} Chi nhánh \${i + 1}\`;
  });`;
  
const newGenData = `const generateMockData = () => {
  const branchInfo = Array.from({ length: 80 }, (_, i) => {
    const regions = ["Hồ Chí Minh", "Miền Bắc", "Miền Trung", "Đông Nam Bộ"];
    const prefixes = ["HMK", "HMK HN", "HMK ĐN", "HMK BD"];
    const idx = i % prefixes.length;
    return {
      name: \`\${prefixes[idx]} Chi nhánh \${i + 1}\`,
      region: regions[idx]
    };
  });`;
code = code.replace(oldGenData, newGenData);

const oldMapBranches = `  const generateData = (periods: string[]) => {
    return branches.map((branch) => {
      const row: Record<string, any> = { branch };`;

const newMapBranches = `  const generateData = (periods: string[]) => {
    return branchInfo.map((info) => {
      const row: Record<string, any> = { branch: info.name, region: info.region };`;
code = code.replace(oldMapBranches, newMapBranches);

// 2. Add View Mode state
const oldState = `export const BranchRevenueComparison: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>("day");
  const [metric, setMetric] = useState<MetricType>("target");
  const [data, setData] = useState(mockData);
  const [isTrafficModalOpen, setIsTrafficModalOpen] = useState(false);
  
  const currentData = data[period];`;

const newState = `type ViewMode = "branch" | "region";

export const BranchRevenueComparison: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>("day");
  const [metric, setMetric] = useState<MetricType>("target");
  const [data, setData] = useState(mockData);
  const [isTrafficModalOpen, setIsTrafficModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("branch");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  
  const currentData = data[period];

  const aggregatedData = useMemo(() => {
    if (viewMode === "branch" && selectedRegion === "all") {
      return currentData.data;
    }
    
    if (viewMode === "branch") {
      return currentData.data.filter((row: any) => row.region === selectedRegion);
    }
    
    // Aggregate by region
    const regionMap: Record<string, any> = {};
    currentData.data.forEach((row: any) => {
      const r = row.region;
      if (!regionMap[r]) {
        regionMap[r] = { branch: r, isRegion: true, count: 0 };
        currentData.periods.forEach((p: string) => {
          regionMap[r][p] = { targetSum: 0, revenue: 0, orders: 0, traffic: 0 };
        });
      }
      
      regionMap[r].count += 1;
      currentData.periods.forEach((p: string) => {
        regionMap[r][p].targetSum += row[p].target || 0;
        regionMap[r][p].revenue += row[p].revenue || 0;
        regionMap[r][p].orders += row[p].orders || 0;
        regionMap[r][p].traffic += row[p].traffic || 0;
      });
    });
    
    return Object.values(regionMap).map((regionRow: any) => {
      const finalRow: any = { branch: regionRow.branch, isRegion: true };
      currentData.periods.forEach((p: string) => {
        finalRow[p] = {
          target: Math.round(regionRow[p].targetSum / regionRow.count), // Average
          revenue: regionRow[p].revenue, // Sum
          orders: regionRow[p].orders, // Sum
          traffic: regionRow[p].traffic, // Sum
        };
      });
      return finalRow;
    });
  }, [currentData, viewMode, selectedRegion]);
  
  const allRegions = useMemo(() => {
    const regions = new Set<string>();
    mockData.day.data.forEach((row: any) => regions.add(row.region));
    return Array.from(regions);
  }, []);`;
code = code.replace(oldState, newState);

// 3. Update view buttons
const oldButtons = `        <div className="flex flex-wrap items-center gap-3">
          <button className="bg-indigo-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            KPI
          </button>
          
          <button className="border border-slate-200 bg-white text-slate-700 px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
            Tất cả chi nhánh
          </button>`;

const newButtons = `        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-md">
            <button
              onClick={() => setViewMode("branch")}
              className={\`px-4 py-1 rounded text-sm font-medium transition-colors \${
                viewMode === "branch" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
              }\`}
            >
              Chi nhánh
            </button>
            <button
              onClick={() => setViewMode("region")}
              className={\`px-4 py-1 rounded text-sm font-medium transition-colors \${
                viewMode === "region" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
              }\`}
            >
              Khu vực
            </button>
          </div>

          {viewMode === "branch" && (
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="border border-slate-200 bg-white text-slate-700 px-3 py-1.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              <option value="all">Tất cả chi nhánh</option>
              {allRegions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          )}`;
code = code.replace(oldButtons, newButtons);

const oldTbody = `          <tbody>
            {currentData.data.map((row, idx) => (`;
const newTbody = `          <tbody>
            {aggregatedData.map((row: any, idx: number) => (`;
code = code.replace(oldTbody, newTbody);

fs.writeFileSync('src/components/BranchRevenueComparison.tsx', code);
