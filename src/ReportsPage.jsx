// src/ReportsPage.jsx
import React, { useState } from "react";
import { FileText, Download, Calendar, CheckCircle2 } from "lucide-react";
import { LEVELS } from "./data";
import { ChartCard, LevelChip } from "./UIComponents";
import { useReportHistory } from "./useReportHistory";
import { computeSummary, generateKpiPdf } from "./pdfUtils";

// ReportsPage reçoit `kpis` (les vraies données du backend)
export default function ReportsPage({ kpis }) {
  const [niveauFilter, setNiveauFilter] = useState("tous");
  const [generated, setGenerated] = useState(false);

  const { history, addReport } = useReportHistory();

  const summary = computeSummary(kpis);

  const kpisForReport =
    niveauFilter === "tous"
      ? kpis
      : kpis.filter((k) => k.niveau === niveauFilter);

  function handleGenerate() {
    const titre = "Rapport — Indicateurs de sécurité";
    const sousTitre =
      niveauFilter === "tous"
        ? `${kpisForReport.length} indicateurs inclus`
        : `Filtré sur le niveau : ${LEVELS[niveauFilter].label}`;

    generateKpiPdf({ titre, sousTitre, kpis: kpisForReport });

    // Enregistre ce rapport dans le vrai historique, avec la date du jour
    addReport({ titre, type: "Rapport" });

    setGenerated(true);
    setTimeout(() => setGenerated(false), 2000);
  }

  function handleDownloadHistory(report) {
    // Régénère le PDF avec les indicateurs actuels (l'état exact du jour
    // où le rapport a été émis n'est pas conservé, seuls titre/date/type le sont)
    generateKpiPdf({
      titre: report.titre,
      sousTitre: `Type : ${report.type} · Émis le ${report.date}`,
      kpis,
    });
  }

  return (
    <div className="space-y-6">
      {/* Configuration du rapport à générer */}
      <ChartCard title="Générer un nouveau rapport">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-600">
            Indicateurs à inclure
          </p>
          <select
            value={niveauFilter}
            onChange={(e) => setNiveauFilter(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-600 focus:border-blue-400 focus:outline-none"
          >
            <option value="tous">Tous les indicateurs ({kpis.length})</option>
            <option value="critique">Critique uniquement</option>
            <option value="faible">Faible uniquement</option>
            <option value="moyen">Moyen uniquement</option>
            <option value="acceptable">Acceptable uniquement</option>
          </select>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-500">
            Le rapport inclura <strong>{kpisForReport.length}</strong> indicateur(s).
          </p>
          <button
            onClick={handleGenerate}
            disabled={kpisForReport.length === 0}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generated ? (
              <>
                <CheckCircle2 size={16} />
                Téléchargé !
              </>
            ) : (
              <>
                <Download size={16} />
                Générer le PDF
              </>
            )}
          </button>
        </div>
      </ChartCard>

      {/* Résumé synthétique */}
      <ChartCard title="Résumé de la situation actuelle">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Object.entries(summary.counts).map(([niveau, count]) => {
            const l = LEVELS[niveau];
            return (
              <div
                key={niveau}
                className="rounded-xl border border-slate-100 px-4 py-3 text-center"
              >
                <p className={`text-2xl font-semibold ${l.text}`}>{count}</p>
                <p className="mt-1 text-xs text-slate-500">{l.label}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Taux global de conformité (indicateurs moyen + acceptable) :{" "}
          <strong className="text-slate-800">{summary.conformite}%</strong>
        </p>
      </ChartCard>

      {/* Historique réel des rapports générés */}
      <ChartCard title="Historique des rapports">
        {history.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
            <FileText size={26} />
            <p className="text-sm">
              Aucun rapport généré pour le moment. Clique sur "Générer le PDF" ci-dessus.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {history.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                    <FileText size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{r.titre}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar size={12} />
                      {r.date} · {r.type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadHistory(r)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Download size={14} />
                  Télécharger
                </button>
              </li>
            ))}
          </ul>
        )}
      </ChartCard>
    </div>
  );
}
