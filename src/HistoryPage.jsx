// src/HistoryPage.jsx
import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { KPIS, LEVELS, getAllTrends } from "./data";
import { ChartCard, LevelChip } from "./UIComponents";

// Couleurs distinctes pour tracer plusieurs courbes sur le même graphique
const LINE_COLORS = [
  "#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
];

export default function HistoryPage() {
  const allTrends = useMemo(() => getAllTrends(), []);

  // Par défaut, on affiche les KPIs critiques (les plus importants à suivre)
  const [selectedIds, setSelectedIds] = useState(
    KPIS.filter((k) => k.niveau === "critique").map((k) => k.id)
  );

  function toggleKpi(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAll() {
    setSelectedIds(KPIS.map((k) => k.id));
  }

  function clearAll() {
    setSelectedIds([]);
  }

  const selectedKpis = KPIS.filter((k) => selectedIds.includes(k.id));

  return (
    <div className="space-y-6">
      {/* Sélecteur d'indicateurs à comparer */}
      <ChartCard
        title="Sélectionner les indicateurs à comparer"
        right={
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Tout sélectionner
            </button>
            <button
              onClick={clearAll}
              className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Tout retirer
            </button>
          </div>
        }
      >
        <div className="flex flex-wrap gap-2">
          {KPIS.map((k) => {
            const active = selectedIds.includes(k.id);
            const l = LEVELS[k.niveau];
            return (
              <button
                key={k.id}
                onClick={() => toggleKpi(k.id)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "border-slate-300 bg-slate-100 text-slate-800"
                    : "border-slate-200 text-slate-400 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    active ? l.dot : "bg-slate-300"
                  }`}
                />
                {k.name}
              </button>
            );
          })}
        </div>
      </ChartCard>

      {/* Courbe comparative multi-indicateurs */}
      <ChartCard title="Évolution comparée sur 6 mois">
        {selectedKpis.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            Sélectionnez au moins un indicateur pour afficher son évolution.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <LineChart
              data={allTrends}
              margin={{ top: 8, right: 16, left: -16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, ""]}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  fontSize: 13,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {selectedKpis.map((k, i) => (
                <Line
                  key={k.id}
                  type="monotone"
                  dataKey={k.name}
                  stroke={LINE_COLORS[i % LINE_COLORS.length]}
                  strokeWidth={2.2}
                  dot={{ r: 2.5 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Tableau détaillé mois par mois */}
      <ChartCard title="Détail des valeurs mensuelles">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-y border-slate-100 text-[11px] font-semibold tracking-wider text-slate-400">
                <th className="px-4 py-3">INDICATEUR</th>
                {allTrends.map((row) => (
                  <th key={row.month} className="px-4 py-3 text-center">
                    {row.month.toUpperCase()}
                  </th>
                ))}
                <th className="px-4 py-3">NIVEAU</th>
              </tr>
            </thead>
            <tbody>
              {KPIS.map((k) => (
                <tr
                  key={k.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                >
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {k.name}
                  </td>
                  {allTrends.map((row) => (
                    <td key={row.month} className="px-4 py-3 text-center text-slate-600">
                      {row[k.name]}%
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <LevelChip niveau={k.niveau} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}