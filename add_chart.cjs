const fs = require('fs');
let code = fs.readFileSync('src/views/ExecutiveView.tsx', 'utf8');

const importStatement = `import { BranchRevenueComparison } from "../components/BranchRevenueComparison";\nimport { GrowthAnalysisChart } from "../components/GrowthAnalysisChart";`;
if (!code.includes("GrowthAnalysisChart")) {
  code = code.replace(`import { BranchRevenueComparison } from "../components/BranchRevenueComparison";`, importStatement);

  const renderChart = `<BranchRevenueComparison />\n      <GrowthAnalysisChart />`;
  code = code.replace(`<BranchRevenueComparison />`, renderChart);

  fs.writeFileSync('src/views/ExecutiveView.tsx', code);
}
