const fs = require('fs');
let code = fs.readFileSync('src/views/ProductView.tsx', 'utf8');

const importStatement = `import { ProductGrowthAnalysisChart } from "../components/ProductGrowthAnalysisChart";\nimport { DrilldownTreemap } from "../components/DrilldownTreemap";`;
code = code.replace(`import { DrilldownTreemap } from "../components/DrilldownTreemap";`, importStatement);

const renderChart = `      {/* Phân tích Tăng trưởng Sản phẩm */}\n      <ProductGrowthAnalysisChart />\n\n      {/* Phân tích Đa chiều */}`;
code = code.replace(`      {/* Phân tích Đa chiều */}`, renderChart);

fs.writeFileSync('src/views/ProductView.tsx', code);
