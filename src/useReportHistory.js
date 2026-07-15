import { useState, useEffect } from "react";

const STORAGE_KEY = "csi-report-history-v1";

// Historique réel des rapports générés, persisté dans le navigateur.
// Remplace REPORT_HISTORY (données de démo figées dans data.js).
export function useReportHistory() {
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // stockage indisponible : on ignore silencieusement
    }
  }, [history]);

  // Ajoute un rapport généré en tête de liste, avec la vraie date du jour
  const addReport = ({ titre, type }) => {
    const entry = {
      id: Date.now(),
      titre,
      type,
      date: new Date().toLocaleDateString("fr-FR"),
    };
    setHistory((prev) => [entry, ...prev]);
  };

  const clearHistory = () => setHistory([]);

  return { history, addReport, clearHistory };
}