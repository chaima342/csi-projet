// src/HistoryPage.jsx
import React, { useEffect, useMemo, useState } from "react";
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
import { Loader2 } from "lucide-react";
import { LEVELS } from "./data";
import { ChartCard, LevelChip } from "./UIComponents";
import { fetchKpiHistory } from "./api";

// Couleurs distinctes pour tracer plusieurs courbes sur le même graphique
const LINE_COLORS = [
  "#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
];

const MONTH_LABELS = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
];

function formatMonth(dateStr) {
  const d = new Date(dateStr);
  return `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
}

// HistoryPage reçoit `kpis` (les vraies données du backend) et va chercher
// le vrai historique de chacun via l'API, au lieu de données simulées.
export default function HistoryPage({ kpis }) {
  const [historyMap, setHistoryMap] = useState({}); // { kpiId: [{date, valeur}] }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedIds, setSelectedIds] = useState(() =>
    kpis.filter((k) => k.niveau === "critique").map((k) => k.id)
  );

  // Charge l'historique réel de tous les indicateurs (une fois, ou si la liste change)
  useEffect(() => {
    if (kpis.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all(
      kpis.map((k) =>
        fetchKpiHistory(k.id)
          .then((data) => [k.id, data])
          .catch(() => [k.id, []])
      )
    )
      .then((results) => {
        const map = {};
        results.forEach(([id, data]) => {
          map[id] = data;
        });
        setHistoryMap(map);
      })
      .catch((err) => {
        console.error(err);
        setError("Impossible de charger l'historique des indicateurs.");
      })
      .finally(() => setLoading(false));
  }, [kpis]);

  function toggleKpi(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAll() {
    setSelectedIds(kpis.map((k) => k.id));
  }

  function clearAll() {
    setSelectedIds([]);
  }

  const selectedKpis = kpis.filter((k) => selectedIds.includes(k.id));

  // Fusionne l'historique des indicateurs sélectionnés : union de toutes les
  // dates rencontrées, triées, avec la valeur de chaque KPI à cette date
  // (null si ce KPI n'a pas de point à cette date précise).
  const mergedData = useMemo(() => {
    const dateSet = new Set();
    selectedKpis.forEach((k) => {
      (historyMap[k.id] || []).forEach((point) => dateSet.add(point.date));
    });
    const sortedDates = Array.from(dateSet).sort();

    return sortedDates.map((date) => {
      const row = { date, month: formatMonth(date) };
      selectedKpis.forEach((k) => {
        const point = (historyMap[k.id] || []).find((p) => p.date === date);
        row[k.name] = point ? point.valeur : null;
      });
      return row;
    });
  }, [selectedKpis, historyMap]);

  if (loading) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm">Chargement de l'historique…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <p className="text-sm font-medium text-amber-700">{error}</p>
      </div>
    );
  }

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
          {kpis.map((k) => {
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
      <ChartCard title="Évolution comparée">
        {selectedKpis.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            Sélectionnez au moins un indicateur pour afficher son évolution.
          </p>
        ) : mergedData.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            Pas encore assez d'historique pour ces indicateurs.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <LineChart
              data={mergedData}
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
                formatter={(value) => [value != null ? `${value}%` : "—", ""]}
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
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Tableau détaillé, date par date */}
      <ChartCard title="Détail des valeurs enregistrées">
        {mergedData.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            Aucune donnée d'historique pour le moment.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-y border-slate-100 text-[11px] font-semibold tracking-wider text-slate-400">
                  <th className="px-4 py-3">INDICATEUR</th>
                  {mergedData.map((row) => (
                    <th key={row.date} className="px-4 py-3 text-center">
                      {row.month.toUpperCase()}
                    </th>
                  ))}
                  <th className="px-4 py-3">NIVEAU</th>
                </tr>
              </thead>
              <tbody>
                {selectedKpis.map((k) => (
                  <tr
                    key={k.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {k.name}
                    </td>
                    {mergedData.map((row) => (
                      <td key={row.date} className="px-4 py-3 text-center text-slate-600">
                        {row[k.name] != null ? `${row[k.name]}%` : "—"}
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
        )}
      </ChartCard>
    </div>
  );
}
