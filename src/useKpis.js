import { useState, useEffect, useCallback } from "react";
import { fetchKpis, createKpi, updateKpiApi, deleteKpiApi } from "./api";

export function useKpis() {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchKpis()
      .then(setKpis)
      .catch((err) => {
        console.error(err);
        setError(
          "Impossible de charger les indicateurs. Vérifie que le backend tourne sur le port 8081."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addKpi = async (data) => {
    const newKpi = await createKpi({
      name: data.name,
      objectif: data.objectif,
      valeur: Number(data.valeur),
      niveau: data.niveau,
      tendance: data.tendance,
    });
    setKpis((prev) => [...prev, newKpi]);
  };

  const updateKpi = async (id, data) => {
    const updated = await updateKpiApi(id, {
      name: data.name,
      objectif: data.objectif,
      valeur: Number(data.valeur),
      niveau: data.niveau,
      tendance: data.tendance,
    });
    setKpis((prev) => prev.map((k) => (k.id === id ? updated : k)));
  };

  const deleteKpi = async (id) => {
    await deleteKpiApi(id);
    setKpis((prev) => prev.filter((k) => k.id !== id));
  };

  return { kpis, loading, error, addKpi, updateKpi, deleteKpi, reload: load };
}