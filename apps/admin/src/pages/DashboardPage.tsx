import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface DashboardData {
  totalSites: number;
  verifiedSites: number;
  pendingSuggestions: number;
  openReports: number;
  totalUsers: number;
  pendingPhotos: number;
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<DashboardData>('/admin/dashboard')
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error'));
  }, []);

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  const cards = data
    ? [
        { label: 'Lugares totales', value: data.totalSites },
        { label: 'Lugares verificados', value: data.verifiedSites },
        { label: 'Sugerencias pendientes', value: data.pendingSuggestions },
        { label: 'Reportes abiertos', value: data.openReports },
        { label: 'Usuarios', value: data.totalUsers },
        { label: 'Fotos pendientes', value: data.pendingPhotos },
      ]
    : [];

  return (
    <div>
      <h1>Dashboard</h1>
      {data ? (
        <div className="cards">
          {cards.map((c) => (
            <div key={c.label} className="card">
              <div className="card-value">{c.value}</div>
              <div className="card-label">{c.label}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">Cargando…</p>
      )}
    </div>
  );
}
