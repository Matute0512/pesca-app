import { NavLink, Outlet } from 'react-router-dom';
import { getUser, logout } from '../auth';

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/sites', label: 'Lugares' },
  { to: '/suggestions', label: 'Sugerencias' },
  { to: '/reports', label: 'Reportes' },
  { to: '/users', label: 'Usuarios' },
  { to: '/import', label: 'Importar' },
  { to: '/audit', label: 'Auditoría' },
];

export function Layout() {
  const user = getUser();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">🎣 PescaBA Admin</div>
        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <strong>{user?.fullName ?? user?.email}</strong>
            <span className="badge">{user?.role}</span>
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => logout()}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
