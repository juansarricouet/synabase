import "server-only";
import { nowIso, num, one, parseJson, rows, run, uid } from "../db";
import { ApiError } from "../http";
import type { Customer, Tag } from "@/lib/types";

function rowToCustomer(r: Record<string, unknown>): Customer {
  return {
    id: r.id as string,
    business_id: r.business_id as string,
    name: r.name as string,
    phone: (r.phone as string) ?? null,
    email: (r.email as string) ?? null,
    gender: (r.gender as string) ?? null,
    age: (r.age as number) ?? null,
    notes: (r.notes as string) ?? null,
    origin: (r.origin as Customer["origin"]) ?? "local",
    first_visit_at: r.first_visit_at as string,
    last_visit_at: r.last_visit_at as string,
    visits: Number(r.visits),
    created_at: r.created_at as string,
  };
}

/**
 * "Facts" por cliente: la vista enriquecida que alimenta la tabla de clientes,
 * la ficha, los segmentos y las campañas. Producto favorito, gasto total,
 * etiquetas y respuestas agregadas por pregunta.
 */
export interface CustomerFacts extends Customer {
  favorite_product: string | null;
  products: string[];
  total_spent: number;
  submissions_count: number;
  tags: Tag[];
  answers: Record<string, unknown[]>; // question_id → valores respondidos
  avg_days_between_visits: number | null;
}

export async function getCustomerFacts(businessId: string): Promise<CustomerFacts[]> {
  const customers = (
    await rows("SELECT * FROM customers WHERE business_id = $1 ORDER BY last_visit_at DESC", [
      businessId,
    ])
  ).map(rowToCustomer);

  const products = await rows<{
    customer_id: string;
    product: string | null;
    c: string;
    spent: string | null;
  }>(
    `SELECT customer_id, product, COUNT(*) AS c, SUM(COALESCE(amount, 0)) AS spent
     FROM submissions WHERE business_id = $1 AND customer_id IS NOT NULL
     GROUP BY customer_id, product`,
    [businessId],
  );

  const byCustomer = new Map<
    string,
    { fav: string | null; favCount: number; products: Set<string>; spent: number; subs: number }
  >();
  for (const p of products) {
    const count = num(p.c);
    const entry =
      byCustomer.get(p.customer_id) ??
      { fav: null, favCount: 0, products: new Set<string>(), spent: 0, subs: 0 };
    entry.subs += count;
    entry.spent += num(p.spent);
    if (p.product) {
      for (const piece of p.product.split(",").map((s) => s.trim()).filter(Boolean)) {
        entry.products.add(piece);
      }
      if (count > entry.favCount) {
        entry.favCount = count;
        entry.fav = p.product;
      }
    }
    byCustomer.set(p.customer_id, entry);
  }

  const tagRows = await rows<{ customer_id: string; id: string; name: string; color: string }>(
    `SELECT ct.customer_id, t.id, t.name, t.color
     FROM customer_tags ct JOIN tags t ON t.id = ct.tag_id
     WHERE t.business_id = $1`,
    [businessId],
  );
  const tagsByCustomer = new Map<string, Tag[]>();
  for (const t of tagRows) {
    const list = tagsByCustomer.get(t.customer_id) ?? [];
    list.push({ id: t.id, name: t.name, color: t.color });
    tagsByCustomer.set(t.customer_id, list);
  }

  const answerRows = await rows<{
    customer_id: string;
    question_id: string;
    value_json: string | null;
  }>(
    `SELECT s.customer_id, a.question_id, a.value_json
     FROM answers a JOIN submissions s ON s.id = a.submission_id
     WHERE s.business_id = $1 AND s.customer_id IS NOT NULL`,
    [businessId],
  );
  const answersByCustomer = new Map<string, Record<string, unknown[]>>();
  for (const a of answerRows) {
    const bucket = answersByCustomer.get(a.customer_id) ?? {};
    const list = (bucket[a.question_id] as unknown[]) ?? [];
    list.push(parseJson<unknown>(a.value_json, null));
    bucket[a.question_id] = list;
    answersByCustomer.set(a.customer_id, bucket);
  }

  return customers.map((c) => {
    const agg = byCustomer.get(c.id);
    const spanDays =
      (new Date(c.last_visit_at).getTime() - new Date(c.first_visit_at).getTime()) / 86400000;
    return {
      ...c,
      favorite_product: agg?.fav ?? null,
      products: [...(agg?.products ?? [])],
      total_spent: Math.round(agg?.spent ?? 0),
      submissions_count: agg?.subs ?? c.visits,
      tags: tagsByCustomer.get(c.id) ?? [],
      answers: answersByCustomer.get(c.id) ?? {},
      avg_days_between_visits: c.visits > 1 ? Math.round(spanDays / (c.visits - 1)) : null,
    };
  });
}

export async function getCustomer(
  businessId: string,
  customerId: string,
): Promise<CustomerFacts | null> {
  // Ficha individual: reutiliza el assembler filtrando (volúmenes chicos por negocio).
  const all = await getCustomerFacts(businessId);
  return all.find((c) => c.id === customerId) ?? null;
}

export interface CustomerHistoryEntry {
  submission_id: string;
  form_name: string;
  product: string | null;
  amount: number | null;
  discount_code: string | null;
  created_at: string;
  answers: { question_id: string; label: string; type: string; value: unknown }[];
}

export async function getCustomerHistory(
  businessId: string,
  customerId: string,
): Promise<CustomerHistoryEntry[]> {
  const subs = await rows(
    `SELECT s.id, s.product, s.amount, s.discount_code, s.created_at, f.name AS form_name
     FROM submissions s JOIN forms f ON f.id = s.form_id
     WHERE s.business_id = $1 AND s.customer_id = $2
     ORDER BY s.created_at DESC`,
    [businessId, customerId],
  );
  if (subs.length === 0) return [];

  const ids = subs.map((s) => s.id as string);
  const answers = await rows<{
    submission_id: string;
    question_id: string;
    value_json: string | null;
    label: string;
    type: string;
  }>(
    `SELECT a.submission_id, a.question_id, a.value_json, q.label, q.type
     FROM answers a JOIN questions q ON q.id = a.question_id
     WHERE a.submission_id = ANY($1)
     ORDER BY q.position ASC`,
    [ids],
  );
  const grouped = new Map<string, CustomerHistoryEntry["answers"]>();
  for (const a of answers) {
    const list = grouped.get(a.submission_id) ?? [];
    list.push({
      question_id: a.question_id,
      label: a.label,
      type: a.type,
      value: parseJson<unknown>(a.value_json, null),
    });
    grouped.set(a.submission_id, list);
  }

  return subs.map((s) => ({
    submission_id: s.id as string,
    form_name: s.form_name as string,
    product: (s.product as string) ?? null,
    amount: s.amount != null ? Number(s.amount) : null,
    discount_code: (s.discount_code as string) ?? null,
    created_at: s.created_at as string,
    answers: grouped.get(s.id as string) ?? [],
  }));
}

const CUSTOMER_FIELDS = ["name", "phone", "email", "gender", "age", "notes"] as const;

export async function updateCustomer(
  businessId: string,
  customerId: string,
  patch: Partial<Pick<Customer, (typeof CUSTOMER_FIELDS)[number]>>,
) {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const f of CUSTOMER_FIELDS) {
    if (patch[f] !== undefined) {
      values.push(patch[f] ?? null);
      sets.push(`${f} = $${values.length}`);
    }
  }
  if (sets.length === 0) throw new ApiError(400, "Nada para actualizar");
  values.push(customerId, businessId);
  const changes = await run(
    `UPDATE customers SET ${sets.join(", ")} WHERE id = $${values.length - 1} AND business_id = $${values.length}`,
    values,
  );
  if (changes === 0) throw new ApiError(404, "Cliente no encontrado");
}

export async function deleteCustomer(businessId: string, customerId: string) {
  const changes = await run("DELETE FROM customers WHERE id = $1 AND business_id = $2", [
    customerId,
    businessId,
  ]);
  if (changes === 0) throw new ApiError(404, "Cliente no encontrado");
}

/* ————— Etiquetas ————— */

export async function listTags(businessId: string): Promise<Tag[]> {
  const result = await rows<Tag & Record<string, unknown>>(
    "SELECT id, name, color FROM tags WHERE business_id = $1 ORDER BY name ASC",
    [businessId],
  );
  return result.map((r) => ({ ...r }));
}

export async function createTag(
  businessId: string,
  name: string,
  color = "violet",
): Promise<Tag> {
  const existing = await one<Tag & Record<string, unknown>>(
    "SELECT id, name, color FROM tags WHERE business_id = $1 AND lower(name) = lower($2)",
    [businessId, name.trim()],
  );
  if (existing) return { id: existing.id, name: existing.name, color: existing.color };

  const id = uid();
  await run(
    "INSERT INTO tags (id, business_id, name, color, created_at) VALUES ($1, $2, $3, $4, $5)",
    [id, businessId, name.trim(), color, nowIso()],
  );
  return { id, name: name.trim(), color };
}

export async function setCustomerTags(
  businessId: string,
  customerId: string,
  tagIds: string[],
) {
  const customer = await one("SELECT 1 FROM customers WHERE id = $1 AND business_id = $2", [
    customerId,
    businessId,
  ]);
  if (!customer) throw new ApiError(404, "Cliente no encontrado");

  await run("DELETE FROM customer_tags WHERE customer_id = $1", [customerId]);
  if (tagIds.length === 0) return;
  // Solo se asocian etiquetas que pertenezcan al mismo comercio.
  await run(
    `INSERT INTO customer_tags (customer_id, tag_id)
     SELECT $1, id FROM tags WHERE id = ANY($2) AND business_id = $3
     ON CONFLICT DO NOTHING`,
    [customerId, tagIds, businessId],
  );
}
