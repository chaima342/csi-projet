// src/AlertsPage.jsx
import React, { useState, useMemo, useEffect } from "react";
import { AlertTriangle, CheckCircle2, Clock, Bell } from "lucide-react";
import { LEVELS } from "./data";
import { ChartCard, LevelChip } from "./UIComponents";

const FILTERS = [
  { key: "active", label: "Actives" },
  { key: "resolue", label: "Résolues" },
  { key: "tous", label: "Toutes" },
];

// Niveaux qui déclenchent une alerte
const ALERT_LEVELS = ["critique", "faible"];

function messageFor(niveau) {
  if (niveau === "critique")
    return "Seuil critique dépassé — action immédiate requise.";
  return "Écart significatif par rapport à l'objectif — à surveiller de près.";
}

function formatDate(date) {
  return (
    date.toLocaleDateString("fr-FR") +
    " " +
    date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );
}

// AlertsPage reçoit désormais `kpis` (les vraies données venant du backend)
// et calcule les alertes à la volée à chaque changement, au lieu d'une
// liste figée générée une seule fois au montage.
export default function AlertsPage({ kpis }) {
  const [filter, setFilter] = useState("active");

  // Alertes marquées "résolues" par l'utilisateur (état local d'affichage)
  const [resolvedIds, setResolvedIds] = useState(() => new Set());

  // Date de première détection de chaque alerte, mémorisée pour ne pas
  // changer à chaque rafraîchissement (sinon l'horodatage bougerait sans arrêt)
  const [detectedAt, setDetectedAt] = useState({});

  useEffect(() => {
    setDetectedAt((prev) => {
      let changed = false;
      const next = { ...prev };
      kpis.forEach((k) => {
        if (ALERT_LEVELS.includes(k.niveau) && !next[k.id]) {
          next[k.id] = new Date();
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [kpis]);

  const alerts = useMemo(() => {
    return kpis
      .filter((k) => ALERT_LEVELS.includes(k.niveau))
      .map((k) => ({
        id: k.id,
        kpi: k,
        message: messageFor(k.niveau),
        date: detectedAt[k.id] ? formatDate(detectedAt[k.id]) : "—",
        statut: resolvedIds.has(k.id) ? "resolue" : "active",
      }))
      .sort((a, b) =>
        a.kpi.niveau === b.kpi.niveau ? 0 : a.kpi.niveau === "critique" ? -1 : 1
      );
  }, [kpis, resolvedIds, detectedAt]);

  const filteredAlerts = useMemo(() => {
    if (filter === "tous") return alerts;
    return alerts.filter((a) => a.statut === filter);
  }, [alerts, filter]);

  const activeCount = alerts.filter((a) => a.statut === "active").length;
  const criticalActiveCount = alerts.filter(
    (a) => a.statut === "active" && a.kpi.niveau === "critique"
  ).length;

  function resolveAlert(id) {
    setResolvedIds((prev) => new Set(prev).add(id));
  }

  function reopenAlert(id) {
    setResolvedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {/* Bandeau de synthèse */}
      {activeCount > 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-5 py-4">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-700">
              {activeCount} alerte(s) active(s), dont {criticalActiveCount} en
              niveau critique.
            </p>
            <p className="text-sm text-red-500">
              Ces indicateurs nécessitent une action ou un suivi rapproché.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-4">
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-500" />
          <p className="text-sm font-medium text-emerald-700">
            Aucune alerte active pour le moment. Tous les indicateurs sont sous contrôle.
          </p>
        </div>
      )}

      {/* Liste des alertes */}
      <ChartCard
        title="Alertes"
        right={
          <div className="flex gap-1.5 rounded-lg bg-slate-100 p-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === f.key
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      >
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
            <Bell size={28} />
            <p className="text-sm">
              Aucune alerte {filter === "active" ? "active" : filter === "resolue" ? "résolue" : ""} pour le moment.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredAlerts.map((a) => {
              const l = LEVELS[a.kpi.niveau];
              return (
                <li key={a.id} className="flex items-start justify-between gap-4 py-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${l.bg}`}
                    >
                      <AlertTriangle size={16} className={l.text} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-800">
                          {a.kpi.name}
                        </p>
                        <LevelChip niveau={a.kpi.niveau} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{a.message}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                        <Clock size={12} />
                        {a.date} · Valeur actuelle : {a.kpi.valeur}% (objectif {a.kpi.objectif})
                      </p>
                    </div>
                  </div>

                  {a.statut === "active" ? (
                    <button
                      onClick={() => resolveAlert(a.id)}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50"
                    >
                      <CheckCircle2 size={14} />
                      Marquer résolue
                    </button>
                  ) : (
                    <button
                      onClick={() => reopenAlert(a.id)}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-50"
                    >
                      Réouvrir
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </ChartCard>
    </div>
  );
}
