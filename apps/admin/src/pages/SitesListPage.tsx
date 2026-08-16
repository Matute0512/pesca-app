import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { api } from '../api/client';
import { DataTable } from '../components/DataTable';

interface AdminSite {
  id: string;
  slug: string;
  name: string;
  siteType: string;
  isVerified: boolean;
  isActive: boolean;
  updatedAt: string;
  species: Array<{ species: { slug: string } }>;
}

interface SitesResponse {
  data: AdminSite[];
  total: number;
}

export function SitesListPage() {
  const navigate = useNavigate();
  const [sites, setSites] = useState<AdminSite[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = search ? `&search=${encodeURIComponent(search)}` : '';
    api
      .get<SitesResponse>(`/admin/sites?pageSize=50${q}`)
      .then((r) => {
        setSites(r.data);
        setTotal(r.total);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error'));
  }, [search]);

  const columns = useMemo<Array<ColumnDef<AdminSite, unknown>>>(
    () => [
      { accessorKey: 'name', header: 'Nombre' },
      { accessorKey: 'siteType', header: 'Tipo' },
      {
        accessorKey: 'isVerified',
        header: 'Verificado',
        cell: ({ getValue }) => (getValue() ? '✓' : '—'),
      },
      {
        accessorKey: 'isActive',
        header: 'Activo',
        cell: ({ getValue }) => (getValue() ? 'Sí' : 'No'),
      },
      { accessorKey: 'updatedAt', header: 'Actualizado', cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('es-AR') },
    ],
    [],
  );

  return (
    <div>
      <div className="page-header">
        <h1>Lugares ({total})</h1>
        <Link to="/sites/new" className="btn btn-primary">
          + Nuevo
        </Link>
      </div>

      <input
        className="input"
        placeholder="Buscar por nombre…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {error && <div className="alert alert-error">{error}</div>}

      <DataTable
        columns={columns}
        data={sites}
        onRowClick={(site) => navigate(`/sites/${site.id}`)}
      />
    </div>
  );
}
