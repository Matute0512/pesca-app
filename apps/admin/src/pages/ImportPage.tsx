import { useState, type ChangeEvent, type FormEvent } from 'react';
import { api } from '../api/client';

interface ImportSummary {
  total: number;
  created: number;
  duplicates: number;
  errors: Array<{ row: number; name?: string; error: string }>;
  dryRun: boolean;
}

export function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
    setSummary(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const result = await api.upload<ImportSummary>(
        `/admin/sites/import?dryRun=${dryRun}`,
        file,
      );
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de importación');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Importar lugares</h1>
      <p className="muted">
        Archivos soportados: CSV (columnas: name, site_type, latitude/lat, longitude/lng,
        locality, municipality, province, address, phone, website, species, amenities) o
        GeoJSON (FeatureCollection de Points).
      </p>

      <form onSubmit={onSubmit} className="import-form">
        <label className="file-drop">
          <input type="file" accept=".csv,.geojson,.json,text/csv,application/json" onChange={onFile} />
          {file ? <strong>{file.name}</strong> : 'Elegí un archivo CSV o GeoJSON…'}
        </label>

        <label className="check">
          <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
          Dry-run (no guarda nada, solo analiza)
        </label>

        <button type="submit" className="btn btn-primary" disabled={!file || loading}>
          {loading ? 'Procesando…' : 'Importar'}
        </button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      {summary && (
        <div className="import-summary">
          <h3>
            Resultado {summary.dryRun ? '(dry-run)' : ''} — {summary.total} filas
          </h3>
          <div className="cards">
            <div className="card">
              <div className="card-value">{summary.created}</div>
              <div className="card-label">Creables / creados</div>
            </div>
            <div className="card">
              <div className="card-value">{summary.duplicates}</div>
              <div className="card-label">Posibles duplicados</div>
            </div>
            <div className="card">
              <div className="card-value">{summary.errors.length}</div>
              <div className="card-label">Errores</div>
            </div>
          </div>
          {summary.errors.length > 0 && (
            <ul className="error-list">
              {summary.errors.map((err, i) => (
                <li key={i}>
                  Fila {err.row} — {err.name ? `${err.name}: ` : ''}
                  {err.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
