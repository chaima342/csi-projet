// src/CSIDashboard.jsx
import React, { useState, useMemo } from "react";
import logoBfpme from "./assets/logo-bfpme.jpg";
import { useKpis } from "./useKpis";
import {
  Shield,
  LayoutGrid,
  BarChart3,
  AlertTriangle,
  History,
  FileText,
  RefreshCw,
  Download,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { generateKpiPdf } from "./pdfUtils";
import { LEVELS } from "./data";
import { TrendIcon, LevelChip, StatCard } from "./UIComponents";
import IndicatorsPage from "./IndicatorsPage";
import HistoryPage from "./HistoryPage";
import ReportsPage from "./ReportsPage";
import AlertsPage from "./AlertsPage";
import KpiFormModal from "./KpiFormModal";

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

const NAV_MAIN = [
  { key: "overview", label: "Vue d'ensemble", icon: LayoutGrid },
  { key: "indicators", label: "Indicateurs", icon: BarChart3 },
  { key: "alerts", label: "Alertes", icon: AlertTriangle },
  { key: "history", label: "Historique", icon: History },
];

const NAV_MGMT = [{ key: "reports", label: "Rapports", icon: FileText }];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CSIDashboard() {
  const [activeNav, setActiveNav] = useState("overview");

  // 🔌 Source unique de vérité pour les KPIs : le backend Spring Boot.
  const { kpis, loading, error, addKpi, updateKpi, deleteKpi, reload } =
    useKpis();

  const [filter, setFilter] = useState("tous");
  const [selectedId, setSelectedId] = useState(null);

  // État du formulaire modal (création / édition)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState(null); // null = mode création

  const criticalKpis = useMemo(
    () => kpis.filter((k) => k.niveau === "critique").map((k) => k.name),
    [kpis]
  );

  const counts = useMemo(() => {
    const c = { critique: 0, faible: 0, moyen: 0, acceptable: 0 };
    kpis.forEach((k) => {
      if (c[k.niveau] !== undefined) c[k.niveau] += 1;
    });
    return c;
  }, [kpis]);

  const filteredKpis = useMemo(() => {
    if (filter === "tous") return kpis;
    return kpis.filter((k) => k.niveau === filter);
  }, [kpis, filter]);
const activeAlertsCount = counts.critique + counts.faible;
  // ---------------------------------------------------------------------
  // CRUD — branché sur l'API Spring Boot via le hook useKpis().
  // ---------------------------------------------------------------------
  async function handleAddKpi(newKpi) {
    try {
      await addKpi(newKpi);
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      window.alert("Erreur lors de l'ajout : " + err.message);
    }
  }

  async function handleUpdateKpi(updatedKpi) {
    try {
      await updateKpi(updatedKpi.id, updatedKpi);
      setModalOpen(false);
      setEditingKpi(null);
    } catch (err) {
      console.error(err);
      window.alert("Erreur lors de la modification : " + err.message);
    }
  }

  async function handleDeleteKpi(id) {
    const kpi = kpis.find((k) => k.id === id);
    const confirmed = window.confirm(
      `Supprimer l'indicateur "${kpi?.name}" ? Cette action est irréversible.`
    );
    if (!confirmed) return;
    try {
      await deleteKpi(id);
    } catch (err) {
      console.error(err);
      window.alert("Erreur lors de la suppression : " + err.message);
    }
  }

  function openCreateModal() {
    setEditingKpi(null);
    setModalOpen(true);
  }

  function openEditModal(kpi) {
    setEditingKpi(kpi);
    setModalOpen(true);
  }

  function handleModalSubmit(formData) {
    if (editingKpi) {
      handleUpdateKpi({ ...formData, id: editingKpi.id });
    } else {
      handleAddKpi(formData);
    }
  }

  const filters = [
    { key: "tous", label: "Tous" },
    { key: "critique", label: "Critique" },
    { key: "faible", label: "Faible" },
    { key: "moyen", label: "Moyen" },
    { key: "acceptable", label: "Acceptable" },
  ];
function handleExportPdf() {
  const label = filter === "tous" ? "tous niveaux" : LEVELS[filter].label;
  generateKpiPdf({
    titre: "Vue d'ensemble — Indicateurs de sécurité",
    sousTitre: `${filteredKpis.length} indicateur(s) affiché(s) · Filtre : ${label}`,
    kpis: filteredKpis,
  });
}
  function handleDetails(kpiId) {
    setSelectedId(kpiId);
    setActiveNav("indicators");
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-800">
      {/* ------------------------------------------------------------- */}
      {/* Sidebar */}
      {/* ------------------------------------------------------------- */}
      <aside className="flex w-64 shrink-0 flex-col bg-bfpme-navy">
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden bg-white">
            <img src={logoBfpme} alt="Logo BFPME" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">CSI Dashboard</p>
            <p className="text-xs text-slate-300">BFPME · Sécurité SI</p>
          </div>
        </div>

        <nav className="flex-1 px-3">
          <p className="px-2 pb-2 pt-2 text-[11px] font-semibold tracking-wider text-slate-400/70">
            PRINCIPAL
          </p>
          <ul className="space-y-1">
            {NAV_MAIN.map((item) => {
              const Icon = item.icon;
              const active = activeNav === item.key;
              return (
                <li key={item.key}>
                  <button
                    onClick={() => setActiveNav(item.key)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      active
                        ? "bg-bfpme-gold/15 font-medium text-bfpme-gold"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={17} />
                      {item.label}
                    </span>
                    {item.key === "alerts" ? (
                      activeAlertsCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                          {activeAlertsCount}
                        </span>
                      )
                    ) : item.badge ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="px-2 pb-2 pt-6 text-[11px] font-semibold tracking-wider text-slate-400/70">
            GESTION
          </p>
          <ul className="space-y-1">
            {NAV_MGMT.map((item) => {
              const Icon = item.icon;
              const active = activeNav === item.key;
              return (
                <li key={item.key}>
                  <button
                    onClick={() => setActiveNav(item.key)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      active
                        ? "bg-bfpme-gold/15 font-medium text-bfpme-gold"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon size={17} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-3 border-t border-white/10 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bfpme-gold/20 text-xs font-semibold text-bfpme-gold">
            RS
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium text-white">Rami Stagiaire</p>
            <p className="text-xs text-slate-400">Administrateur</p>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* Main content */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-8 py-5">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {activeNav === "indicators"
                ? "Indicateurs"
                : "Vue d'ensemble — Juin 2025"}
            </h1>
            <p className="text-sm text-slate-400">
              Comité de sécurité de l'information · BFPME
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={reload}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={15} />
              Actualiser
            </button>
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-2 rounded-lg border border-bfpme-navy px-3.5 py-2 text-sm font-medium text-bfpme-navy hover:bg-bfpme-navy/5"
            >
              <Download size={15} />
              Exporter PDF
            </button>
            <button
              onClick={() => setActiveNav("alerts")}
              className="flex items-center gap-2 rounded-lg bg-red-50 px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
            >
              <Bell size={15} />
              Alertes actives
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
                {activeAlertsCount}
              </span>
            </button>
          </div>
        </div>

        <div className="space-y-6 px-8 py-6">
          {/* Erreur de connexion au backend */}
          {error && (
            <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-sm font-medium text-amber-700">{error}</p>
              <button
                onClick={reload}
                className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Chargement initial */}
          {loading && !error ? (
            <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 size={28} className="animate-spin" />
              <p className="text-sm">Chargement des indicateurs…</p>
            </div>
          ) : (
            <>
              {activeNav === "overview" && (
                <>
                  {/* Alert banner */}
                  {counts.critique > 0 && (
                    <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-5 py-4">
                      <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-red-700">
                          {counts.critique} indicateurs en niveau critique nécessitent
                          une action immédiate.
                        </p>
                        <p className="text-sm text-red-500">{criticalKpis.join(" · ")}</p>
                      </div>
                    </div>
                  )}

                  {/* Stat cards */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard niveau="critique" icon={XCircle} count={counts.critique} description="indicateurs hors objectif" total={kpis.length} />
                    <StatCard niveau="faible" icon={AlertTriangle} count={counts.faible} description="indicateurs à améliorer" total={kpis.length} />
                    <StatCard niveau="moyen" icon={Clock} count={counts.moyen} description="indicateur à surveiller" total={kpis.length} />
                    <StatCard niveau="acceptable" icon={CheckCircle2} count={counts.acceptable} description="indicateurs conformes" total={kpis.length} />
                  </div>

                  {/* KPI table */}
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Shield size={17} className="text-bfpme-navy" />
                        <h2 className="text-base font-semibold text-slate-900">
                          Indicateurs de sécurité (KPIs)
                        </h2>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-wrap gap-1.5 rounded-lg bg-slate-100 p-1">
                          {filters.map((f) => (
                            <button
                              key={f.key}
                              onClick={() => setFilter(f.key)}
                              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                filter === f.key
                                  ? "bg-bfpme-navy text-white shadow-sm"
                                  : "text-slate-500 hover:text-slate-700"
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={openCreateModal}
                          className="flex items-center gap-2 rounded-lg bg-bfpme-gold px-3.5 py-2 text-sm font-medium text-white hover:bg-bfpme-goldDark"
                        >
                          <Plus size={15} />
                          Ajouter
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-y border-slate-100 text-[11px] font-semibold tracking-wider text-slate-400">
                            <th className="px-5 py-3">INDICATEUR (KPI)</th>
                            <th className="px-5 py-3">OBJECTIF</th>
                            <th className="px-5 py-3">VALEUR ACTUELLE</th>
                            <th className="px-5 py-3">NIVEAU</th>
                            <th className="px-5 py-3">TENDANCE</th>
                            <th className="px-5 py-3">ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredKpis.map((k) => {
                            const l = LEVELS[k.niveau];
                            return (
                              <tr key={k.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                                <td className="px-5 py-4 font-medium text-slate-800">{k.name}</td>
                                <td className="px-5 py-4 text-slate-500">{k.objectif}</td>
                                <td className="px-5 py-4">
                                  <div className="flex flex-col gap-1.5">
                                    <span className={`font-semibold ${l.text}`}>{k.valeur}%</span>
                                    <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
                                      <div className={`h-full rounded-full ${l.bar}`} style={{ width: `${Math.min(k.valeur, 100)}%` }} />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-4">
                                  <LevelChip niveau={k.niveau} />
                                </td>
                                <td className="px-5 py-4">
                                  <TrendIcon tendance={k.tendance} />
                                </td>
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleDetails(k.id)}
                                      className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-bfpme-navy hover:bg-bfpme-navy/5"
                                      title="Voir les détails"
                                    >
                                      Détails
                                      <ChevronRight size={14} />
                                    </button>
                                    <button
                                      onClick={() => openEditModal(k)}
                                      className="flex items-center justify-center rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
                                      title="Modifier"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteKpi(k.id)}
                                      className="flex items-center justify-center rounded-lg border border-slate-200 p-1.5 text-red-500 hover:bg-red-50"
                                      title="Supprimer"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {filteredKpis.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                                Aucun indicateur pour ce filtre.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {activeNav === "indicators" && (
                <IndicatorsPage
                  kpis={kpis}
                  selectedId={selectedId ?? kpis[0]?.id}
                  setSelectedId={setSelectedId}
                />
              )}

              {activeNav === "alerts" && <AlertsPage kpis={kpis} />}

              {activeNav === "history" && <HistoryPage kpis={kpis} />}

              {activeNav === "reports" && <ReportsPage kpis={kpis} />}
            </>
          )}
        </div>
      </main>

      <KpiFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingKpi(null);
        }}
        onSubmit={handleModalSubmit}
        initialData={editingKpi}
      />
    </div>
  );
}
