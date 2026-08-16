import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { DataTable } from '../components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  user: { email: string; username: string | null } | null;
}

export function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<AuditLog[]>('/admin/audit-logs?pageSize=50')
      .then((r) => setLogs(r))
      .catch((err) => setError(err instanceof Error ? err.message : 'Error'));
  }, []);

  const columns: Array<ColumnDef<AuditLog, unknown>> = [
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleString('es-AR'),
    },
    {
      accessorKey: 'user',
      header: 'Usuario',
      cell: ({ row }) => row.original.user?.email ?? '—',
    },
    { accessorKey: 'action', header: 'Acción' },
    { accessorKey: 'entityType', header: 'Entidad' },
    { accessorKey: 'entityId', header: 'ID' },
  ];

  return (
    <div>
      <h1>Auditoría ({logs.length})</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <DataTable columns={columns} data={logs} />
    </div>
  );
}
