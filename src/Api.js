const API_URL = "http://localhost:8081/api/kpis";

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Erreur API (${res.status}) ${res.statusText}${text ? " — " + text : ""}`
    );
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function fetchKpis() {
  const res = await fetch(API_URL);
  return handleResponse(res);
}

export async function createKpi(kpi) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(kpi),
  });
  return handleResponse(res);
}

export async function updateKpiApi(id, kpi) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(kpi),
  });
  return handleResponse(res);
}

export async function deleteKpiApi(id) {
  const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  return handleResponse(res);
}
// GET /api/kpis/{id}/history -> historique réel d'un indicateur
export async function fetchKpiHistory(id) {
  const res = await fetch(`${API_URL}/${id}/history`);
  return handleResponse(res);
}