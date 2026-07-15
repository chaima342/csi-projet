// src/KpiFormModal.jsx
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

const NIVEAUX = ["critique", "faible", "moyen", "acceptable"];
const TENDANCES = ["up", "down", "stable"];

const EMPTY_FORM = {
  name: "",
  objectif: "",
  valeur: "",
  niveau: "moyen",
  tendance: "stable",
};

export default function KpiFormModal({ open, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState(EMPTY_FORM);

  // Pré-remplit le formulaire si on est en mode "modification"
  useEffect(() => {
    setForm(initialData ? { ...initialData } : EMPTY_FORM);
  }, [initialData, open]);

  if (!open) return null;

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.objectif.trim() || form.valeur === "") return;
    onSubmit({ ...form, valeur: parseFloat(form.valeur) });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            {initialData ? "Modifier l'indicateur" : "Ajouter un indicateur"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Nom de l'indicateur
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Ex: Taux de chiffrement des données"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-bfpme-navy focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Objectif
              </label>
              <input
                type="text"
                value={form.objectif}
                onChange={(e) => handleChange("objectif", e.target.value)}
                placeholder="Ex: ≥ 90%"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-bfpme-navy focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Valeur actuelle
              </label>
              <input
                type="number"
                step="0.1"
                value={form.valeur}
                onChange={(e) => handleChange("valeur", e.target.value)}
                placeholder="Ex: 85"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-bfpme-navy focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Niveau
              </label>
              <select
                value={form.niveau}
                onChange={(e) => handleChange("niveau", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-bfpme-navy focus:outline-none"
              >
                {NIVEAUX.map((n) => (
                  <option key={n} value={n}>
                    {n.charAt(0).toUpperCase() + n.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Tendance
              </label>
              <select
                value={form.tendance}
                onChange={(e) => handleChange("tendance", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-bfpme-navy focus:outline-none"
              >
                <option value="up">Hausse</option>
                <option value="down">Baisse</option>
                <option value="stable">Stable</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-lg bg-bfpme-navy px-4 py-2 text-sm font-medium text-white hover:bg-bfpme-navyLight"
            >
              {initialData ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}