import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import { Loader2 } from "lucide-react";
import { LEVELS, extractObjectifNumber } from "./data";
import { ChartCard, LevelChip, TrendIcon, Gauge } from "./UIComponents";
import { fetchKpiHistory } from "./api";

const MONTH_LABELS = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
];

function formatMonth(dateStr) {
  const d = new Date(dateStr);
  return MONTH_LABELS[d.getMonth()];
}

// Page de consultation uniquement : sélection d'un indicateur + graphiques.
// Le CRUD (Ajouter / Modifier / Supprimer) reste géré depuis la Vue d'ensemble.
export default function IndicatorsPage({ kpis, selectedId, setSelectedId }) {
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);

  const selected = kpis.find((k) => k.id === selectedId) || kpis[0];

  // Si l'indicateur sélectionné vient d'être supprimé, on retombe sur le premier
  useEffect(() => {
    if (kpis.length && !kpis.some((k) => k.id === selectedId)) {
      setSelectedId(kpis[0].id);
    }
  }, [kpis, selectedId, setSelectedId]);

  // Charge le vrai historique depuis le backend à chaque changement de sélection
  useEffect(() => {
    if (!selected) return;
    setHistoryLoading(true);
    setHistoryError(null);
    fetchKpiHistory(selected.id)
      .then((data) => {
        const formatted = data.map((point) => ({
          month: formatMonth(point.date),
          valeur: point.valeur,
        }));
        setHistory(formatted);
      })
      .catch((err) => {
        console.error(err);
        setHistoryError("Impossible de charger l'historique de cet indicateur.");
        setHistory([]);
      })
      .finally(() => setHistoryLoading(false));
  }, [selected]);

  const objectifNum = selected ? extractObjectifNumber(selected.objectif) : null;
  const color = selected ? LEVELS[selected.niveau].hex : "#3b82f6";

  if (!selected) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
        <p className="text-sm text-slate-400">
          Aucun indicateur pour le moment. Ajoutes-en un depuis la Vue d'ensemble.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comparatif global */}
      <ChartCard title="Comparatif de tous les indicateurs (valeur actuelle)">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={kpis}
            margin={{ top: 8, right: 8, left: -12, bottom: 60 }}
            barCategoryGap="25%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
            />
            <XAxis
              dataKey="name"
              angle={-35}
              textAnchor="end"
              interval={0}
              height={90}
              tick={{ fontSize: 11, fill: "#64748b" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, "Valeur actuelle"]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                fontSize: 13,
              }}
            />
            <Bar
              dataKey="valeur"
              radius={[6, 6, 0, 0]}
              onClick={(d) => setSelectedId(d.id)}
              cursor="pointer"
            >
              {kpis.map((k) => (
                <Cell key={k.id} fill={LEVELS[k.niveau].hex} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Liste des indicateurs (sélecteur uniquement) */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-1">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Indicateurs ({kpis.length})
            </h3>
          </div>
          <ul className="max-h-[420px] overflow-y-auto p-2">
            {kpis.map((k) => {
              const l = LEVELS[k.niveau];
              const active = k.id === selected.id;
              return (
                <li key={k.id}>
                  <button
                    onClick={() => setSelectedId(k.id)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      active
                        ? "bg-blue-50 font-medium text-blue-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${l.dot}`} />
                      <span className="truncate">{k.name}</span>
                    </span>
                    <span className={`shrink-0 text-xs font-semibold ${l.text}`}>
                      {k.valeur}%
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Détail de l'indicateur sélectionné */}
        <div className="space-y-6 lg:col-span-2">
          <ChartCard
            title={selected.name}
            right={<LevelChip niveau={selected.niveau} />}
          >
            <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
              <Gauge
                value={selected.valeur}
                color={color}
                label={`Objectif : ${selected.objectif}`}
              />
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <span className="text-sm text-slate-500">
                    Valeur actuelle
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {selected.valeur}%
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <span className="text-sm text-slate-500">Objectif</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {selected.objectif}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <span className="text-sm text-slate-500">Tendance</span>
                  <TrendIcon tendance={selected.tendance} />
                </div>
              </div>
            </div>
          </ChartCard>

          <ChartCard title="Évolution dans le temps">
            {historyLoading ? (
              <div className="flex h-[240px] flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 size={22} className="animate-spin" />
                <p className="text-xs">Chargement de l'historique…</p>
              </div>
            ) : historyError ? (
              <div className="flex h-[240px] flex-col items-center justify-center gap-1 text-center">
                <p className="text-xs font-medium text-red-500">{historyError}</p>
              </div>
            ) : history.length === 0 ? (
              <div className="flex h-[240px] flex-col items-center justify-center gap-1 text-center">
                <p className="text-xs text-slate-400">
                  Pas encore d'historique pour cet indicateur.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart
                  data={history}
                  margin={{ top: 8, right: 16, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Valeur"]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      fontSize: 13,
                    }}
                  />
                  {objectifNum !== null && (
                    <ReferenceLine
                      y={objectifNum}
                      stroke="#94a3b8"
                      strokeDasharray="5 5"
                      label={{
                        value: `Objectif ${objectifNum}%`,
                        position: "insideTopRight",
                        fontSize: 11,
                        fill: "#94a3b8",
                      }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="valeur"
                    stroke={color}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
