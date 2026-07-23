const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

const targetImport = `import { useAppContext, Role } from "../AppContext";`;
const importStatement = `import { useAppContext, Role } from "../AppContext";\nimport { Target } from "lucide-react";\nimport { KPIConfigurationModal } from "./KPIConfigurationModal";\nimport { useState } from "react";`;
code = code.replace(targetImport, importStatement);

const targetComponentStart = `export const Header: React.FC = () => {\n  const { role, setRole, lastUpdated } = useAppContext();`;
const componentStartReplacement = `export const Header: React.FC = () => {\n  const { role, setRole, lastUpdated } = useAppContext();\n  const [isKPIModalOpen, setIsKPIModalOpen] = useState(false);`;
code = code.replace(targetComponentStart, componentStartReplacement);

const targetButton = `          <button className="relative text-slate-400 hover:text-slate-600">
            <Bell className="w-5 h-5" />`;
const buttonReplacement = `          {role === 'BOD' && (
            <button 
              onClick={() => setIsKPIModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md text-sm font-medium transition-colors border border-indigo-100"
            >
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Cấu hình KPI</span>
            </button>
          )}
          <button className="relative text-slate-400 hover:text-slate-600">
            <Bell className="w-5 h-5" />`;
code = code.replace(targetButton, buttonReplacement);

const targetEnd = `    </header>\n  );\n};`;
const endReplacement = `    </header>\n      <KPIConfigurationModal isOpen={isKPIModalOpen} onClose={() => setIsKPIModalOpen(false)} />\n    </>\n  );\n};`;
code = code.replace(`    </header>\n  );\n};`, endReplacement);

code = code.replace(`    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">`, `    <>\n    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">`);

fs.writeFileSync('src/components/Header.tsx', code);
