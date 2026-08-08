import "server-only";
import { nowIso, one, rows, run, shortCode, tx, uid } from "../db";
import { ApiError } from "../http";
import { log } from "../log";
import { slugify } from "@/lib/utils";
import { createForm } from "./forms";
import type { Business, Role } from "@/lib/types";

async function uniqueBizSlug(base: string): Promise<string> {
  let candidate = base || `comercio-${shortCode(4)}`;
  while (await one("SELECT 1 FROM businesses WHERE slug = $1", [candidate])) {
    candidate = `${base}-${shortCode(3)}`;
  }
  return candidate;
}

export async function createBusiness(
  userId: string,
  data: { name: string; category?: string; address?: string; phone?: string },
): Promise<Business> {
  const id = uid();
  const now = nowIso();
  const slug = await uniqueBizSlug(slugify(data.name));

  await tx(async (client) => {
    await run(
      `INSERT INTO businesses (id, name, slug, category, address, phone, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, data.name.trim(), slug, data.category ?? null, data.address ?? null, data.phone ?? null, now],
      client,
    );
    await run(
      "INSERT INTO memberships (id, user_id, business_id, role, created_at) VALUES ($1, $2, $3, 'owner', $4)",
      [uid(), userId, id, now],
      client,
    );
    const defaultTags: [string, string][] = [
      ["VIP", "amber"],
      ["Frecuente", "violet"],
      ["Nuevo", "sky"],
    ];
    for (const [name, color] of defaultTags) {
      await run(
        "INSERT INTO tags (id, business_id, name, color, created_at) VALUES ($1, $2, $3, $4, $5)",
        [uid(), id, name, color, now],
        client,
      );
    }
  });

  // Formulario inicial listo para usar apenas se crea el negocio.
  await createForm(id, "Formulario principal", { slugBase: slug });
  log.info("business.created", { businessId: id, userId });
  return (await getBusiness(id))!;
}

export async function getBusiness(id: string): Promise<Business | null> {
  const row = await one("SELECT * FROM businesses WHERE id = $1", [id]);
  if (!row) return null;
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    category: (row.category as string) ?? null,
    address: (row.address as string) ?? null,
    phone: (row.phone as string) ?? null,
    logo_url: (row.logo_url as string) ?? null,
    brand_color: (row.brand_color as string) ?? "#c73418",
    hours: (row.hours as string) ?? null,
    plan: (row.plan as string) ?? "pro",
    created_at: row.created_at as string,
  };
}

const BIZ_FIELDS = ["name", "category", "address", "phone", "logo_url", "brand_color", "hours", "plan"] as const;

export async function updateBusiness(
  businessId: string,
  patch: Partial<Pick<Business, (typeof BIZ_FIELDS)[number]>>,
): Promise<Business> {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const f of BIZ_FIELDS) {
    if (patch[f] !== undefined) {
      values.push(patch[f] ?? null);
      sets.push(`${f} = $${values.length}`);
    }
  }
  if (sets.length === 0) throw new ApiError(400, "Nada para actualizar");
  values.push(businessId);
  await run(`UPDATE businesses SET ${sets.join(", ")} WHERE id = $${values.length}`, values);
  log.info("business.updated", { businessId, fields: sets.length });
  return (await getBusiness(businessId))!;
}

/* ————— Equipo ————— */

export interface Member {
  membership_id: string;
  user_id: string;
  name: string;
  email: string;
  role: Role;
  joined_at: string;
}

export async function listMembers(businessId: string): Promise<Member[]> {
  const result = await rows<Member & Record<string, unknown>>(
    `SELECT m.id AS membership_id, u.id AS user_id, u.name, u.email, m.role, m.created_at AS joined_at
     FROM memberships m JOIN users u ON u.id = m.user_id
     WHERE m.business_id = $1 ORDER BY m.created_at ASC`,
    [businessId],
  );
  return result.map((r) => ({ ...r }));
}

export interface Invitation {
  id: string;
  email: string;
  role: Role;
  token: string;
  status: string;
  created_at: string;
}

export async function listInvitations(businessId: string): Promise<Invitation[]> {
  const result = await rows<Invitation & Record<string, unknown>>(
    `SELECT id, email, role, token, status, created_at FROM invitations
     WHERE business_id = $1 AND status = 'pending' ORDER BY created_at DESC`,
    [businessId],
  );
  return result.map((r) => ({ ...r }));
}

export async function createInvitation(
  businessId: string,
  email: string,
  role: Role,
): Promise<Invitation> {
  const cleanEmail = email.toLowerCase().trim();
  const existingUser = await one(
    `SELECT m.id FROM memberships m JOIN users u ON u.id = m.user_id
     WHERE m.business_id = $1 AND u.email = $2`,
    [businessId, cleanEmail],
  );
  if (existingUser) throw new ApiError(409, "Esa persona ya es parte del equipo");

  const id = uid();
  const token = shortCode(12);
  const now = nowIso();
  await run(
    "INSERT INTO invitations (id, business_id, email, role, token, status, created_at) VALUES ($1, $2, $3, $4, $5, 'pending', $6)",
    [id, businessId, cleanEmail, role, token, now],
  );
  log.info("invitation.created", { businessId });
  return { id, email: cleanEmail, role, token, status: "pending", created_at: now };
}

export async function revokeInvitation(businessId: string, invitationId: string) {
  const changes = await run("DELETE FROM invitations WHERE id = $1 AND business_id = $2", [
    invitationId,
    businessId,
  ]);
  if (changes === 0) throw new ApiError(404, "Invitación no encontrada");
}

/** Días que vale una invitación antes de caducar sola. */
const INVITATION_TTL_DAYS = 7;

/**
 * Busca una invitación por su token.
 *
 * Descarta las vencidas: un enlace de invitación da acceso a los datos de un
 * comercio, así que no puede quedar válido para siempre en la bandeja de
 * entrada de alguien.
 */
export async function getInvitationByToken(token: string) {
  const minCreatedAt = new Date(Date.now() - INVITATION_TTL_DAYS * 86400000).toISOString();
  return one<{
    id: string;
    business_id: string;
    email: string;
    role: Role;
    business_name: string;
  }>(
    `SELECT i.id, i.business_id, i.email, i.role, b.name AS business_name
     FROM invitations i JOIN businesses b ON b.id = i.business_id
     WHERE i.token = $1 AND i.status = 'pending' AND i.created_at >= $2`,
    [token, minCreatedAt],
  );
}

export async function acceptInvitation(token: string, userId: string): Promise<string> {
  const inv = await getInvitationByToken(token);
  if (!inv) throw new ApiError(404, "La invitación no existe o ya fue usada");
  await tx(async (client) => {
    await run(
      `INSERT INTO memberships (id, user_id, business_id, role, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, business_id) DO NOTHING`,
      [uid(), userId, inv.business_id, inv.role, nowIso()],
      client,
    );
    await run("UPDATE invitations SET status = 'accepted' WHERE id = $1", [inv.id], client);
  });
  return inv.business_id;
}

export async function updateMemberRole(businessId: string, membershipId: string, role: Role) {
  const changes = await run(
    "UPDATE memberships SET role = $1 WHERE id = $2 AND business_id = $3 AND role <> 'owner'",
    [role, membershipId, businessId],
  );
  if (changes === 0) throw new ApiError(400, "No se pudo cambiar el rol");
}

export async function removeMember(businessId: string, membershipId: string) {
  const changes = await run(
    "DELETE FROM memberships WHERE id = $1 AND business_id = $2 AND role <> 'owner'",
    [membershipId, businessId],
  );
  if (changes === 0) throw new ApiError(400, "No se pudo quitar a esta persona");
}
