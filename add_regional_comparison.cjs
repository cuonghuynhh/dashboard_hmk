const fs = require('fs');
let code = fs.readFileSync('src/views/OperationalView.tsx', 'utf8');

const importStatement = `import { ConversionAndRefundAnalysis } from "../components/ConversionAndRefundAnalysis";\nimport { RegionalComparison } from "../components/RegionalComparison";`;
code = code.replace(`import { ConversionAndRefundAnalysis } from "../components/ConversionAndRefundAnalysis";`, importStatement);

const renderChart = `      <RegionalComparison />\n\n      <ConversionAndRefundAnalysis />`;
code = code.replace(`      <ConversionAndRefundAnalysis />`, renderChart);

fs.writeFileSync('src/views/OperationalView.tsx', code);
