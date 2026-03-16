"use client";

export const ROLE_CART_V1_KEY = "cn_role_cart_v1";

/**
 * RoleCartRole is the minimal role metadata we persist so downstream pages
 * (e.g., Roadmap) can show the correct titles even if they don't have access
 * to Multiverse's in-memory dataset.
 */
export type RoleCartRole = {
  id: string;
  title: string;
  industry?: string;
  compatibility?: number;
};

type RoleCartStateV1 = {
  version: 1;
  updatedAt: string; // ISO
  roles: RoleCartRole[];
};

function nowISO() {
  return new Date().toISOString();
}

function isObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function normalizeRole(raw: any): RoleCartRole | null {
  if (!raw) return null;

  const id = typeof raw.id === "string" ? raw.id : typeof raw.roleId === "string" ? raw.roleId : null;
  const title = typeof raw.title === "string" ? raw.title : null;

  if (!id || !title) return null;

  const industry = typeof raw.industry === "string" ? raw.industry : undefined;
  const compatibility = typeof raw.compatibility === "number" ? raw.compatibility : undefined;

  return { id, title, industry, compatibility };
}

function safeParseState(json: string | null): RoleCartStateV1 | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (!isObject(parsed)) return null;
    if (parsed.version !== 1) return null;
    const roles = Array.isArray((parsed as any).roles) ? (parsed as any).roles : [];
    return {
      version: 1,
      updatedAt: typeof (parsed as any).updatedAt === "string" ? (parsed as any).updatedAt : nowISO(),
      roles: roles.map(normalizeRole).filter(Boolean) as RoleCartRole[]
    };
  } catch {
    return null;
  }
}

function getDefaultState(): RoleCartStateV1 {
  return { version: 1, updatedAt: nowISO(), roles: [] };
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

/**
 * Reads the legacy IDs-only cart if present (cn_role_cart_ids_v1).
 * This keeps backward compatibility with previously stored data.
 */
function readLegacyIdsOnlyCart(): string[] {
  if (!canUseStorage()) return [];
  const legacyKey = "cn_role_cart_ids_v1";
  const raw = window.localStorage.getItem(legacyKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(String).filter(Boolean);
  } catch {
    return [];
  }
}

// PUBLIC_INTERFACE
export function getRoleCartState(): RoleCartStateV1 {
  /** Read the role cart state from localStorage (local-first, UI-only). */
  if (!canUseStorage()) return getDefaultState();
  const parsed = safeParseState(window.localStorage.getItem(ROLE_CART_V1_KEY));
  if (parsed) return parsed;

  // If new state isn't present, attempt to migrate legacy IDs-only cart.
  const legacyIds = readLegacyIdsOnlyCart();
  if (legacyIds.length > 0) {
    const migrated: RoleCartStateV1 = {
      version: 1,
      updatedAt: nowISO(),
      roles: legacyIds.map((id) => ({ id, title: "Target Role" })) // title may be fixed later when added from Multiverse
    };
    window.localStorage.setItem(ROLE_CART_V1_KEY, JSON.stringify(migrated));
    return migrated;
  }

  return getDefaultState();
}

// PUBLIC_INTERFACE
export function setRoleCartState(next: RoleCartStateV1) {
  /** Write the role cart state to localStorage. */
  if (!canUseStorage()) return;
  window.localStorage.setItem(ROLE_CART_V1_KEY, JSON.stringify(next));
}

// PUBLIC_INTERFACE
export function getRoleCartRoles(): RoleCartRole[] {
  /** Get all roles currently in the cart (deduped by id). */
  const state = getRoleCartState();
  const seen = new Set<string>();
  const roles: RoleCartRole[] = [];
  for (const r of state.roles) {
    if (!r?.id) continue;
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    roles.push(r);
  }
  return roles;
}

// PUBLIC_INTERFACE
export function getRoleCartRoleIds(): string[] {
  /** Convenience: get just the role IDs in insertion order. */
  return getRoleCartRoles().map((r) => r.id);
}

// PUBLIC_INTERFACE
export function upsertRoleInCart(role: RoleCartRole) {
  /**
   * Add or update a role in the cart.
   * - Keeps insertion order stable
   * - Updates metadata (title/industry/compatibility) if re-added later
   */
  if (!canUseStorage()) return;

  const normalized = normalizeRole(role);
  if (!normalized) return;

  const state = getRoleCartState();
  const idx = state.roles.findIndex((r) => r.id === normalized.id);

  const nextRoles = [...state.roles];
  if (idx >= 0) {
    nextRoles[idx] = { ...nextRoles[idx], ...normalized };
  } else {
    nextRoles.push(normalized);
  }

  setRoleCartState({ version: 1, updatedAt: nowISO(), roles: nextRoles });

  // Keep legacy key in sync for any other page still reading it.
  try {
    window.localStorage.setItem("cn_role_cart_ids_v1", JSON.stringify(nextRoles.map((r) => r.id)));
  } catch {
    // ignore
  }
}

// PUBLIC_INTERFACE
export function removeRoleFromCart(roleId: string) {
  /** Remove a role from the cart by id. */
  if (!canUseStorage()) return;
  const state = getRoleCartState();
  const nextRoles = state.roles.filter((r) => r.id !== roleId);
  setRoleCartState({ version: 1, updatedAt: nowISO(), roles: nextRoles });

  try {
    window.localStorage.setItem("cn_role_cart_ids_v1", JSON.stringify(nextRoles.map((r) => r.id)));
  } catch {
    // ignore
  }
}

// PUBLIC_INTERFACE
export function clearRoleCart() {
  /** Clear the cart entirely. */
  if (!canUseStorage()) return;
  setRoleCartState({ version: 1, updatedAt: nowISO(), roles: [] });

  try {
    window.localStorage.setItem("cn_role_cart_ids_v1", JSON.stringify([]));
  } catch {
    // ignore
  }
}
