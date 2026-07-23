const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const importStatement = `import { PersonnelView } from "./views/PersonnelView";\nimport { KPIManagementView } from "./views/KPIManagementView";`;
code = code.replace(`import { PersonnelView } from "./views/PersonnelView";`, importStatement);

const tabType = `type Tab = "executive" | "operational" | "product" | "personnel" | "kpi";`;
code = code.replace(`type Tab = "executive" | "operational" | "product" | "personnel";`, tabType);

const viewRender = `      case "personnel":\n        return <PersonnelView />;\n      case "kpi":\n        return role === "BOD" || role === "MANAGER" ? <KPIManagementView /> : <PersonnelView />;`;
code = code.replace(`      case "personnel":\n        return <PersonnelView />;\n`, viewRender + "\n");

const renderButton = `          <button
            onClick={() => setActiveTab("personnel")}
            className={cn(
              "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
              activeTab === "personnel"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-200/50",
            )}
          >
            <UserCircle className="w-4 h-4 mr-2" />
            Hiệu suất Nhân sự
          </button>
          {(role === "BOD" || role === "MANAGER") && (
            <button
              onClick={() => setActiveTab("kpi")}
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                activeTab === "kpi"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-200/50",
              )}
            >
              <Target className="w-4 h-4 mr-2" />
              Quản lý KPI
            </button>
          )}`;

code = code.replace(`          <button
            onClick={() => setActiveTab("personnel")}
            className={cn(
              "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
              activeTab === "personnel"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-200/50",
            )}
          >
            <UserCircle className="w-4 h-4 mr-2" />
            Hiệu suất Nhân sự
          </button>`, renderButton);

const iconImport = `import { BarChart3, Activity, Package, UserCircle, Target } from "lucide-react";`;
code = code.replace(`import { BarChart3, Activity, Package, UserCircle } from "lucide-react";`, iconImport);

fs.writeFileSync('src/App.tsx', code);
