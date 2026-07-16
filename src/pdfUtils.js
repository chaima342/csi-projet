// src/pdfUtils.js
import jsPDF from "jspdf";
import { LEVELS } from "./data";

// jsPDF ne supporte pas les symboles ≥ et ≤ avec la police par défaut
// (ils corrompent le texte autour) — on les remplace par des équivalents ASCII.
export function sanitizeForPdf(text) {
  return String(text).replace(/≥/g, ">=").replace(/≤/g, "<=");
}

// Calcule le résumé (comptes par niveau + taux de conformité) à partir des
// vrais indicateurs actuels.
export function computeSummary(kpis) {
  const counts = { critique: 0, faible: 0, moyen: 0, acceptable: 0 };
  kpis.forEach((k) => {
    if (counts[k.niveau] !== undefined) counts[k.niveau] += 1;
  });
  const total = kpis.length;
  const conformes = counts.moyen + counts.acceptable;
  const conformite = total > 0 ? Math.round((conformes / total) * 100) : 0;
  return { total, counts, conformite };
}

// Génère un PDF à partir d'un titre et d'une liste de KPIs, puis le télécharge.
export function generateKpiPdf({ titre, sousTitre, kpis }) {
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