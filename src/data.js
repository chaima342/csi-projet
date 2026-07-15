// ---------------------------------------------------------------------------
// Définition des niveaux de criticité (couleurs / libellés)
// ---------------------------------------------------------------------------

export const LEVELS = {
  critique: {
    label: "Critique",
    text: "text-red-600",
    bg: "bg-red-50",
    bar: "bg-red-500",
    dot: "bg-red-500",
    hex: "#ef4444",
    chipBg: "bg-red-50",
    chipText: "text-red-600",
  },
  faible: {
    label: "Faible",
    text: "text-amber-600",
    bg: "bg-amber-50",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
    hex: "#f59e0b",
    chipBg: "bg-amber-50",
    chipText: "text-amber-600",
  },
  moyen: {
    label: "Moyen",
    text: "text-blue-600",
    bg: "bg-blue-50",
    bar: "bg-blue-500",
    dot: "bg-blue-500",
    hex: "#3b82f6",
    chipBg: "bg-blue-50",
    chipText: "text-blue-600",
  },
  acceptable: {
    label: "Acceptable",
    text: "text-emerald-600",
    bg: "bg-emerald-50",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
    hex: "#10b981",
    chipBg: "bg-emerald-50",
    chipText: "text-emerald-600",
  },
};

// ---------------------------------------------------------------------------
// Liste des KPIs
// 👉 C'est ICI que tu remplaceras plus tard par de vraies données
//    (import Excel, appel API, base de données...)
// ---------------------------------------------------------------------------

export const KPIS = [
  {
    id: 1,
    name: "Taux de conformité PSSI",
    objectif: "≥ 80%",
    valeur: 62,
    niveau: "critique",
    tendance: "down",
  },
  {
    id: 2,
    name: "Comptes avec MFA activé",
    objectif: "100%",
    valeur: 58,
    niveau: "critique",
    tendance: "down",
  },
  {
    id: 3,
    name: "Correctifs critiques appliqués",
    objectif: "≥ 95%",
    valeur: 61,
    niveau: "critique",
    tendance: "down",
  },
  {
    id: 4,
    name: "Tests PRA réalisés",
    objectif: "2 / an",
    valeur: 50,
    niveau: "critique",
    tendance: "down",
  },
  {
    id: 5,
    name: "Couverture Antivirus / EDR",
    objectif: "100%",
    valeur: 81,
    niveau: "faible",
    tendance: "up",
  },
  {
    id: 6,
    name: "Sensibilisation cybersécurité",
    objectif: "≥ 90%",
    valeur: 68,
    niveau: "faible",
    tendance: "up",
  },
  {
    id: 7,
    name: "Temps moyen de résolution incidents",
    objectif: "≤ 24h",
    valeur: 76,
    niveau: "moyen",
    tendance: "stable",
  },
  {
    id: 8,
    name: "Actions critiques réalisées",
    objectif: "≥ 70%",
    valeur: 74,
    niveau: "acceptable",
    tendance: "up",
  },
  {
    id: 9,
    name: "Sauvegardes vérifiées",
    objectif: "100%",
    valeur: 98,
    niveau: "acceptable",
    tendance: "up",
  },
  {
    id: 10,
    name: "Disponibilité du SI",
    objectif: "≥ 99%",
    valeur: 99.4,
    niveau: "acceptable",
    tendance: "up",
  },
];

export const CRITICAL_KPIS = KPIS.filter((k) => k.niveau === "critique").map(
  (k) => k.name
);

export const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"];

// ---------------------------------------------------------------------------
// Fonctions utilitaires
// ---------------------------------------------------------------------------

// Génère un historique simulé sur 6 mois pour un KPI donné.
// À remplacer plus tard par un vrai historique venant de ta source de données.
export function generateTrend(kpi) {
  const end = kpi.valeur;
  let start;
  if (kpi.tendance === "down") start = Math.min(100, end + 14 + (kpi.id % 5));
  else if (kpi.tendance === "up")
    start = Math.max(0, end - (14 + (kpi.id % 5)));
  else start = end - 3 + (kpi.id % 3);

  return MONTHS.map((month, i) => {
    const t = i / (MONTHS.length - 1);
    const base = start + (end - start) * t;
    const noise = Math.sin(kpi.id * 12.9 + i * 6.1) * 2.2;
    const valeur = Math.max(0, Math.min(100, base + noise));
    return { month, valeur: Math.round(valeur * 10) / 10 };
  });
}

// Extrait un objectif numérique en % (ex: "≥ 80%" -> 80). Renvoie null sinon.
export function extractObjectifNumber(objectif) {
  if (!objectif.includes("%")) return null;
  const match = objectif.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}
// ---------------------------------------------------------------------------
// Fusionne les tendances de tous les KPIs en un seul tableau, mois par mois
// Utilisé par la page Historique pour comparer plusieurs indicateurs ensemble
// ---------------------------------------------------------------------------
export function getAllTrends() {
  const trendsByKpi = KPIS.map((k) => ({ kpi: k, trend: generateTrend(k) }));

  return MONTHS.map((month, i) => {
    const row = { month };
    trendsByKpi.forEach(({ kpi, trend }) => {
      row[kpi.name] = trend[i].valeur;
    });
    return row;
  });
}
// ---------------------------------------------------------------------------
// Génère un résumé synthétique des KPIs, utilisé pour les rapports
// ---------------------------------------------------------------------------
export function getSummary() {
  const total = KPIS.length;
  const counts = { critique: 0, faible: 0, moyen: 0, acceptable: 0 };
  KPIS.forEach((k) => (counts[k.niveau] += 1));

  const conformite = Math.round(
    ((counts.moyen + counts.acceptable) / total) * 100
  );

  return { total, counts, conformite };
}

// Historique simulé des rapports déjà générés
// 👉 À remplacer plus tard par un vrai stockage (base de données / fichiers)
export const REPORT_HISTORY = [
  { id: 1, titre: "Rapport mensuel — Mai 2025", date: "31/05/2025", type: "Mensuel" },
  { id: 2, titre: "Rapport mensuel — Avril 2025", date: "30/04/2025", type: "Mensuel" },
  { id: 3, titre: "Rapport trimestriel — Q1 2025", date: "31/03/2025", type: "Trimestriel" },
  { id: 4, titre: "Rapport mensuel — Mars 2025", date: "31/03/2025", type: "Mensuel" },
];
// ---------------------------------------------------------------------------
// Génère des alertes à partir des KPIs en niveau critique ou faible
// 👉 À remplacer plus tard par de vraies alertes (déclenchées par seuils
//    réels côté base de données / moteur de règles)
// ---------------------------------------------------------------------------
export function generateAlerts() {
  const messages = {
    critique: "Seuil critique dépassé — action immédiate requise.",
    faible: "Écart significatif par rapport à l'objectif — à surveiller de près.",
  };

  const dates = [
    "05/07/2026 09:12",
    "04/07/2026 16:45",
    "03/07/2026 11:30",
    "02/07/2026 08:05",
    "01/07/2026 14:20",
    "30/06/2026 10:00",
  ];

  return KPIS.filter((k) => k.niveau === "critique" || k.niveau === "faible")
    .map((k, i) => ({
      id: k.id,
      kpi: k,
      message: messages[k.niveau],
      date: dates[i % dates.length],
      statut: "active", // "active" | "resolue"
    }))
    .sort((a, b) => (a.kpi.niveau === "critique" ? -1 : 1));
}