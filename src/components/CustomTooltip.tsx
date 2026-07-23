import React from "react";
import { TooltipProps } from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  titleLabel?: string;
  valueFormatter?: (value: ValueType, name: NameType, props: any) => string;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  titleLabel,
  valueFormatter,
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 border border-slate-100 shadow-xl rounded-lg min-w-[180px] ring-1 ring-slate-900/5 z-50">
        {(label || titleLabel) && (
          <p className="text-slate-500 text-xs font-semibold mb-2.5 uppercase tracking-wider border-b border-slate-100 pb-1.5">
            {titleLabel || label}
          </p>
        )}
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div
              key={`item-${index}`}
              className="flex justify-between items-center gap-6 text-sm"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shadow-inner"
                  style={{
                    backgroundColor: entry.color || entry.fill || entry.stroke,
                  }}
                />
                <span className="text-slate-600 font-medium">{entry.name}</span>
              </div>
              <span className="text-slate-900 font-bold whitespace-nowrap">
                {valueFormatter
                  ? valueFormatter(
                      entry.value as ValueType,
                      entry.name as NameType,
                      entry.payload,
                    )
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
