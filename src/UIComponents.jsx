import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LEVELS } from "./data";

// Petite flèche de tendance (hausse / baisse / stable)
export function TrendIcon({ tendance }) {
  if (tendance === "up")
    return <TrendingUp size={16} className="text-emerald-500" />;
  if (tendance === "down")
    return <TrendingDown size={16} className="text-red-500" />;
  return <Minus size={16} className="text-slate-400" />;
}

// Badge coloré affichant le niveau (Critique / Faible / Moyen / Acceptable)
export function LevelChip({ niveau }) {
  const l = LEVELS[niveau];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${l.chipBg} ${l.chipText}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${l.dot}`} />
      {l.label}
    </span>
  );
}

// Carte de synthèse (utilisée dans la Vue d'ensemble)
export function StatCard({ niveau, count, description, total, icon: Icon }) {
  const l = LEVELS[niveau];
  const pct = Math.round((count / total) * 100);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{l.label}</p>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${l.bg}`}
        >
          <Icon size={16} className={l.text} />
        </div>
      </div>
      <p className={`mt-3 text-3xl font-semibold ${l.text}`}>{count}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${l.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// Jauge semi-circulaire en SVG pur (utilisée dans la page Indicateurs)
export function Gauge({ value, color, label }) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 80;
  const circumference = Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-full max-w-[220px]">
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text
          x="100"
          y="92"
          textAnchor="middle"
          fontSize="26"
          fontWeight="700"
          fill="#1e293b"
        >
          {clamped}%
        </text>
      </svg>
      {label ? (
        <p className="-mt-2 text-xs font-medium text-slate-400">{label}</p>
      ) : null}
    </div>
  );
}

// Carte blanche avec titre, utilisée comme conteneur pour les graphiques
export function ChartCard({ title, children, right }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}