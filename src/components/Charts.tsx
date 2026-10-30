import React from 'react';

interface IntakeChartData {
  name: string;
  approved: number;
  enrolled: number;
  excess: number;
}

export const IntakeComparisonChart: React.FC<{ data: IntakeChartData[] }> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => Math.max(d.approved, d.enrolled))) * 1.15;
  const chartHeight = 240;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 text-xs font-medium text-slate-500">
        <span>Approved Intake vs Actual Regular Enrolment</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-slate-300 rounded-sm"></span>
            <span>Approved Intake</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-sky-800 rounded-sm"></span>
            <span>Enrolled (Compliant)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-rose-600 rounded-sm"></span>
            <span>Excess Enrolment</span>
          </div>
        </div>
      </div>

      <div className="h-60 flex items-end gap-6 pt-6 pb-8 border-b border-slate-200 px-2 overflow-x-auto">
        {data.map((item, idx) => {
          const approvedHeight = (item.approved / maxVal) * chartHeight;
          const enrolledHeight = (item.enrolled / maxVal) * chartHeight;
          const isExcess = item.excess > 0;

          return (
            <div key={idx} className="flex-1 min-w-[70px] max-w-[110px] flex flex-col items-center group relative">
              {/* Tooltip */}
              <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] py-1 px-2.5 rounded shadow pointer-events-none whitespace-nowrap z-20">
                <p className="font-semibold">{item.name}</p>
                <p>Approved: {item.approved} | Enrolled: {item.enrolled} {isExcess ? `(+${item.excess} Excess)` : ''}</p>
              </div>

              <div className="w-full flex items-end justify-center gap-1.5 h-full">
                {/* Approved bar */}
                <div
                  style={{ height: `${approvedHeight}px` }}
                  className="w-1/2 bg-slate-200 rounded-t transition-all hover:bg-slate-300 relative"
                >
                  <span className="text-[10px] font-mono text-slate-600 absolute -top-4 w-full text-center">
                    {item.approved}
                  </span>
                </div>

                {/* Enrolled bar */}
                <div
                  style={{ height: `${enrolledHeight}px` }}
                  className={`w-1/2 rounded-t transition-all relative ${
                    isExcess ? 'bg-rose-600 hover:bg-rose-700' : 'bg-sky-800 hover:bg-sky-900'
                  }`}
                >
                  <span className={`text-[10px] font-mono font-bold absolute -top-4 w-full text-center ${
                    isExcess ? 'text-rose-600' : 'text-sky-800'
                  }`}>
                    {item.enrolled}
                  </span>
                </div>
              </div>

              <span className="text-[11px] text-slate-600 font-medium truncate w-full text-center mt-2.5">
                {item.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ApaarDistributionDonut: React.FC<{
  stats: { valid: number; pending: number; invalid: number; duplicate: number };
}> = ({ stats }) => {
  const total = stats.valid + stats.pending + stats.invalid + stats.duplicate || 1;
  const validPct = Math.round((stats.valid / total) * 100);
  const pendingPct = Math.round((stats.pending / total) * 100);
  const invalidPct = Math.round((stats.invalid / total) * 100);
  const dupPct = Math.round((stats.duplicate / total) * 100);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          {/* Background circle */}
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="3.5"
          />
          {/* Valid slice (Teal) */}
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#0D9488"
            strokeWidth="3.5"
            strokeDasharray={`${validPct}, 100`}
          />
          {/* Duplicate slice (Crimson) */}
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#E11D48"
            strokeWidth="3.5"
            strokeDasharray={`${dupPct}, 100`}
            strokeDashoffset={`-${validPct}`}
          />
          {/* Invalid slice (Amber) */}
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#D97706"
            strokeWidth="3.5"
            strokeDasharray={`${invalidPct}, 100`}
            strokeDashoffset={`-${validPct + dupPct}`}
          />
        </svg>

        <div className="absolute flex flex-col items-center">
          <span className="text-xl font-bold text-slate-800 tabular-nums">{validPct}%</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Valid</span>
        </div>
      </div>

      <div className="flex-1 w-full space-y-2 text-xs">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
            <span className="text-slate-700">Validated APAAR</span>
          </div>
          <span className="font-mono font-semibold text-slate-900">{stats.valid} ({validPct}%)</span>
        </div>

        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
            <span className="text-slate-700">Duplicate Conflicts</span>
          </div>
          <span className="font-mono font-semibold text-slate-900">{stats.duplicate} ({dupPct}%)</span>
        </div>

        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-700">Checksum / Invalid</span>
          </div>
          <span className="font-mono font-semibold text-slate-900">{stats.invalid} ({invalidPct}%)</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
            <span className="text-slate-700">Pending Review</span>
          </div>
          <span className="font-mono font-semibold text-slate-900">{stats.pending} ({pendingPct}%)</span>
        </div>
      </div>
    </div>
  );
};

export const HorizontalCategoryBar: React.FC<{
  data: { label: string; count: number; color?: string }[];
}> = ({ data }) => {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-3">
      {data.map((item, idx) => {
        const pct = Math.round((item.count / max) * 100);
        return (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-700 font-medium">{item.label}</span>
              <span className="font-mono font-semibold text-slate-900">{item.count}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${pct}%` }}
                className={`h-full rounded-full ${item.color || 'bg-sky-700'}`}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
