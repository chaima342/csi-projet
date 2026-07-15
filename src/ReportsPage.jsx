// src/ReportsPage.jsx
import React, { useState } from "react";
import { FileText, Download, Calendar, CheckCircle2, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import { LEVELS } from "./data";
import { ChartCard, LevelChip } from "./UIComponents";
import { useReportHistory } from "./useReportHistory";

const PERIODS = ["Mensuel", "Trimestriel", "Annuel"];

// ---------------------------------------------------------------------------
// jsPDF ne supporte pas les symboles ≥ et ≤ avec la police par défaut
// (ils corrompent le texte autour) — on les remplace par des équivalents ASCII.
// ---------------------------------------------------------------------------
function sanitizeForPdf(text) {
  return String(text).replace(/≥/g, ">=").replace(/≤/g, "<=");
}

// ---------------------------------------------------------------------------
// Calcule le résumé (comptes par niveau + taux de conformité) à partir des
// vrais indicateurs actuels.
// ---------------------------------------------------------------------------
function computeSummary(kpis) {
  const counts = { critique: 0, faible: 0, moyen: 0, acceptable: 0 };
  kpis.forEach((k) => {
    if (counts[k.niveau] !== undefined) counts[k.niveau] += 1;
  });
  const total = kpis.length;
  const conformes = counts.moyen + counts.acceptable;
  const conformite = total > 0 ? Math.round((conformes / total) * 100) : 0;
  return { total, counts, conformite };
}

// ---------------------------------------------------------------------------
// Génère un PDF à partir d'un titre et d'une liste de KPIs, puis le télécharge
// ---------------------------------------------------------------------------
function generatePdf({ titre, sousTitre, kpis }) {
  const doc = new jsPDF();
  const marginX = 15;
  let y = 20;

  // En-tête
  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text("BFPME — Comité de sécurité de l'information", marginX, y);
  y += 8;

  doc.setFontSize(12);
  doc.setFont(undefined, "normal");
  doc.text(titre, marginX, y);
  y += 6;

  if (sousTitre) {
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(sanitizeForPdf(sousTitre), marginX, y);
    doc.setTextColor(0);
    y += 10;
  } else {
    y += 4;
  }

  doc.setDrawColor(200);
  doc.line(marginX, y, 195, y);
  y += 10;

  // Résumé
  const summary = computeSummary(kpis);
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text("Résumé", marginX, y);
  y += 7;

  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  doc.text(`Total indicateurs : ${summary.total}`, marginX, y);
  y += 6;
  doc.text(
    `Critique : ${summary.counts.critique}   |   Faible : ${summary.counts.faible}   |   Moyen : ${summary.counts.moyen}   |   Acceptable : ${summary.counts.acceptable}`,
    marginX,
    y
  );
  y += 6;
  doc.text(`Taux de conformité global : ${summary.conformite}%`, marginX, y);
  y += 12;

  // Tableau des KPIs
  doc.setFont(undefined, "bold");
  doc.setFontSize(11);
  doc.text("Détail des indicateurs", marginX, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFillColor(240, 240, 240);
  doc.rect(marginX, y - 5, 180, 7, "F");
  doc.text("Indicateur", marginX + 2, y);
  doc.text("Objectif", marginX + 95, y);
  doc.text("Valeur", marginX + 130, y);
  doc.text("Niveau", marginX + 155, y);
  y += 8;

  doc.setFont(undefined, "normal");
  kpis.forEach((k) => {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    const nameLines = doc.splitTextToSize(sanitizeForPdf(k.name), 88);
    doc.text(nameLines, marginX + 2, y);
    doc.text(sanitizeForPdf(k.objectif), marginX + 95, y);
    doc.text(`${k.valeur}%`, marginX + 130, y);
    doc.text(LEVELS[k.niveau].label, marginX + 155, y);
    y += Math.max(6, nameLines.length * 5) + 2;
  });

  // Pied de page
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    `Document généré automatiquement le ${new Date().toLocaleDateString("fr-FR")}`,
    marginX,
    290
  );

  const filename = titre.replace(/[^a-z0-9]+/gi, "_").toLowerCase() + ".pdf";
  doc.save(filename);
}

// ReportsPage reçoit `kpis` (les vraies données du backend)
export default function ReportsPage({ kpis }) {
  const [period, setPeriod] = useState("Mensuel");
  const [niveauFilter, setNiveauFilter] = useState("tous");
  const [generated, setGenerated] = useState(false);

  const { history, addReport } = useReportHistory();

  const summary = computeSummary(kpis);

  const kpisForReport =
    niveauFilter === "tous"
      ? kpis
      : kpis.filter((k) => k.niveau === niveauFilter);

  function handleGenerate() {
    const titre = `Rapport ${period.toLowerCase()} — Indicateurs de sécurité`;
    const sousTitre =
      niveauFilter === "tous"
        ? `${kpisForReport.length} indicateurs inclus`
        : `Filtré sur le niveau : ${LEVELS[niveauFilter].label}`;

    generatePdf({ titre, sousTitre, kpis: kpisForReport });

    // Enregistre ce rapport dans le vrai historique, avec la date du jour
    addReport({ titre, type: period });

    setGenerated(true);
    setTimeout(() => setGenerated(false), 2000);
  }

  function handleDownloadHistory(report) {
    // Régénère le PDF avec les indicateurs actuels (l'état exact du jour
    // où le rapport a été émis n'est pas conservé, seuls titre/date/type le sont)
    generatePdf({
      titre: report.titre,
      sousTitre: `Type : ${report.type} · Émis le ${report.date}`,
      kpis,
    });
  }

  return (
    <div className="space-y-6">
      {/* Configuration du rapport à générer */}
      <ChartCard title="Générer un nouveau rapport">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-600">Période</p>
            <div className="flex gap-2">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                    period === p
                      ? "border-blue-600 bg-blue-50 text-blue-600"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-600">
              Indicateurs à inclure
            </p>
            <select
              value={niveauFilter}
              onChange={(e) => setNiveauFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-600 focus:border-blue-400 focus:outline-none"
            >
              <option value="tous">Tous les indicateurs ({kpis.length})</option>
              <option value="critique">Critique uniquement</option>
              <option value="faible">Faible uniquement</option>
              <option value="moyen">Moyen uniquement</option>
              <option value="acceptable">Acceptable uniquement</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-500">
            Le rapport inclura <strong>{kpisForReport.length}</strong> indicateur(s)
            sur la période <strong>{period.toLowerCase()}</strong>.
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
