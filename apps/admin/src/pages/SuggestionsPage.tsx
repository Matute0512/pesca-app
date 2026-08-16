import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { DataTable } from '../components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';

interface Suggestion {
  id: string;
  name: string;
  siteType: string;
  locality: string | null;
  municipality: string | null;
  province: string | null;
  latitude: number;
  longitude: number;
  description: string | null;
  status: string;
  createdAt: string;
}

export function SuggestionsPage() {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .get<Suggestion[]>('/admin/suggestions')
      .then((r) => setItems(r))
      .catch((err) => setError(err instanceof Error ? err.message : 'Error'));
  }, []);

  useEffect(load, [load]);

  async function decide(s: Suggestion, decision: 'approved' | 'rejected') {
    let rejectionReason: string | undefined;
    if (decision === 'rejected') {
      rejectionReason = window.prompt('Motivo del rechazo:') ?? undefined;
    }
    setBusy(s.id);
    try {
      await api.patch(`/admin/suggestions/${s.id}`, {
        decision,
        ...(rejectionReason ? { rejectionReason } : {}),
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(null);
    }
  }

  const columns: Array<ColumnDef<Suggestion, unknown>> = [
    { accessorKey: 'name', header: 'Nombre' },
    { accessorKey: 'siteType', header: 'Tipo' },
    {
      accessorKey: 'locality',
      header: 'Localidad',
      cell: ({ row }) => `${row.original.locality ?? ''} ${row.original.province ?? ''}`,
    },
    {
      accessorKey: 'coordinates',
      header: 'Coordenadas',
      cell: ({ row }) => `${row.original.latitude.toFixed(4)}, ${row.original.longitude.toFixed(4)}`,
    },
    {
      accessorKey: 'status',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="actions">
          <button
            className="btn btn-sm"
            disabled={busy === row.original.id}
            onClick={(e) => {
              e.stopPropagation();
              void decide(row.original, 'approved');
            }}
          >
            Aprobar
          </button>
          <button
            className="btn btn-sm btn-danger"
            disabled={busy === row.original.id}
            onClick={(e) => {
              e.stopPropagation();
              void decide(row.original, 'rejected');
            }}
          >
            Rechazar
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1>Sugerencias ({items.length})</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <DataTable columns={columns} data={items} />
    </div>
  );
}
