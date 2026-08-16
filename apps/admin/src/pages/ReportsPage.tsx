import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { DataTable } from '../components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';

interface Report {
  id: string;
  reportType: string;
  description: string | null;
  status: string;
  createdAt: string;
  site: { id: string; name: string; slug: string };
}

interface ListResponse {
  data: Report[];
  total: number;
}

export function ReportsPage() {
  const [items, setItems] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .get<ListResponse>('/admin/reports')
      .then((r) => setItems(r.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Error'));
  }, []);

  useEffect(load, [load]);

  async function decide(r: Report, decision: 'resolved' | 'rejected') {
    setBusy(r.id);
    try {
      await api.patch(`/admin/reports/${r.id}`, { decision });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(null);
    }
  }

  const columns: Array<ColumnDef<Report, unknown>> = [
    {
      accessorKey: 'site',
      header: 'Lugar',
      cell: ({ row }) => row.original.site.name,
    },
    { accessorKey: 'reportType', header: 'Tipo de reporte' },
    { accessorKey: 'description', header: 'Descripción' },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ getValue }) => <span className="badge">{String(getValue())}</span>,
    },
    {
      accessorKey: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="actions">
          <button
            className="btn btn-sm"
            disabled={busy === row.original.id}
            onClick={(e) => {
              e.stopPropagation();
              void decide(row.original, 'resolved');
            }}
          >
            Resolver
          </button>
          <button
            className="btn btn-sm btn-danger"
            disabled={busy === row.original.id}
            onClick={(e) => {
              e.stopPropagation();
              void decide(row.original, 'rejected');
            }}
          >
            Descartar
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1>Reportes ({items.length})</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <DataTable columns={columns} data={items} />
    </div>
  );
}
