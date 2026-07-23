const fs = require('fs');
let code = fs.readFileSync('src/components/BranchRevenueComparison.tsx', 'utf8');

const oldGetColor = `  const getColorClass = (value: number, metricType: MetricType, cellData?: any) => {
    if (metricType === "target") {
      if (value < 30) return "bg-[#fb7185] text-white";
      if (value < 60) return "bg-[#fbbf24] text-slate-800";
      if (value < 100) return "bg-[#34d399] text-white";
      return "bg-[#10b981] text-white";
    } else if (metricType === "revenue") {
      if (value < 200) return "bg-[#fb7185] text-white";
      if (value < 400) return "bg-[#fbbf24] text-slate-800";
      if (value < 600) return "bg-[#34d399] text-white";
      return "bg-[#10b981] text-white";
    } else if (metricType === "traffic") {
      return "bg-slate-100 text-slate-800";
    } else if (metricType === "conversionRate") {
      const cr = cellData?.traffic ? (cellData.orders / cellData.traffic) * 100 : 0;
      if (cr < 10) return "bg-[#fb7185] text-white";
      if (cr < 20) return "bg-[#fbbf24] text-slate-800";
      if (cr < 30) return "bg-[#34d399] text-white";
      return "bg-[#10b981] text-white";
    }
    return "bg-slate-100 text-slate-800";
  };`;

const newGetColor = `  const getColorClass = (value: number, metricType: MetricType, cellData?: any, isRegion?: boolean) => {
    const scale = isRegion ? 20 : 1; // Approx 20 branches per region

    if (metricType === "target") {
      if (value < 30) return "bg-[#fb7185] text-white";
      if (value < 60) return "bg-[#fbbf24] text-slate-800";
      if (value < 100) return "bg-[#34d399] text-white";
      return "bg-[#10b981] text-white";
    } else if (metricType === "revenue") {
      if (value < 200 * scale) return "bg-[#fb7185] text-white";
      if (value < 400 * scale) return "bg-[#fbbf24] text-slate-800";
      if (value < 600 * scale) return "bg-[#34d399] text-white";
      return "bg-[#10b981] text-white";
    } else if (metricType === "traffic") {
      return "bg-slate-100 text-slate-800";
    } else if (metricType === "conversionRate") {
      const cr = cellData?.traffic ? (cellData.orders / cellData.traffic) * 100 : 0;
      if (cr < 10) return "bg-[#fb7185] text-white";
      if (cr < 20) return "bg-[#fbbf24] text-slate-800";
      if (cr < 30) return "bg-[#34d399] text-white";
      return "bg-[#10b981] text-white";
    }
    return "bg-slate-100 text-slate-800";
  };`;
code = code.replace(oldGetColor, newGetColor);

const oldFormat = `  const formatValue = (value: number, metricType: MetricType, cellData?: any) => {`;
const newFormat = `  const formatValue = (value: number, metricType: MetricType, cellData?: any, isRegion?: boolean) => {
    if (metricType === "revenue" && value >= 1000) {
      return \`\${(value / 1000).toFixed(1)}B\`; // Convert thousands of Millions to Billions
    }`;
code = code.replace(oldFormat, newFormat);

const oldTdContent = `                    <td key={p} className="p-1 border-b border-slate-100">
                      <div 
                        className={\`w-full h-full py-1.5 px-1 text-center rounded text-xs font-semibold \${getColorClass(value, metric, cellData)}\`}
                      >
                        {formatValue(value, metric, cellData)}
                      </div>
                    </td>`;

const newTdContent = `                    <td key={p} className="p-1 border-b border-slate-100">
                      <div 
                        className={\`w-full h-full py-1.5 px-1 text-center rounded text-xs font-semibold \${getColorClass(value, metric, cellData, row.isRegion)}\`}
                      >
                        {formatValue(value, metric, cellData, row.isRegion)}
                      </div>
                    </td>`;
code = code.replace(oldTdContent, newTdContent);

fs.writeFileSync('src/components/BranchRevenueComparison.tsx', code);
