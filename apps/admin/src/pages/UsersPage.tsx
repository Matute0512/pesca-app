import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { DataTable } from '../components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';

interface AdminUser {
  id: string;
  email: string;
  username: string | null;
  fullName: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: string;
}

const ROLES = ['user', 'moderator', 'editor', 'admin'];

export function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .get<AdminUser[]>('/admin/users?pageSize=50')
      .then((r) => setUsers(r))
      .catch((err) => setError(err instanceof Error ? err.message : 'Error'));
  }, []);

  useEffect(load, [load]);

  async function changeRole(u: AdminUser, role: string) {
    if (!window.confirm(`¿Cambiar el rol de ${u.email} a "${role}"?`)) return;
    try {
      await api.patch(`/admin/users/${u.id}`, { role });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  const columns: Array<ColumnDef<AdminUser, unknown>> = [
    { accessorKey: 'email', header: 'Email' },
    {
      accessorKey: 'fullName',
      header: 'Nombre',
      cell: ({ row }) => row.original.fullName ?? row.original.username ?? '—',
    },
    {
      accessorKey: 'emailVerified',
      header: 'Email verificado',
      cell: ({ getValue }) => (getValue() ? '✓' : '—'),
    },
    {
      accessorKey: 'role',
      header: 'Rol',
      cell: ({ row }) => (
        <select
          value={row.original.role}
          onChange={(e) => void changeRole(row.original, e.target.value)}
          onClick={(e) => e.stopPropagation()}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <div>
      <h1>Usuarios ({users.length})</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <DataTable columns={columns} data={users} />
    </div>
  );
}
