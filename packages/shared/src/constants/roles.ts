/** Roles de usuario del sistema. */
export const ROLES = ['user', 'moderator', 'editor', 'admin'] as const;

export type Role = (typeof ROLES)[number];

/** Rol con todos los permisos sobre contenido administrativo. */
export const ADMIN_ROLES: readonly Role[] = ['moderator', 'editor', 'admin'];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/** Jerarquía simple: admin > editor > moderator > user. */
export const ROLE_RANK: Record<Role, number> = {
  user: 0,
  moderator: 1,
  editor: 2,
  admin: 3,
};
