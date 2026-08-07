import "server-only";
import { nowIso, one, parseJson, rows, run, shortCode, tx, uid, type Executor } from "../db";
import { ApiError } from "../http";
import { log } from "../log";
import { slugify } from "@/lib/utils";
import type { Form, FormTheme, MapsTo, Question, QuestionType } from "@/lib/types";

const DEFAULT_THEME: FormTheme = { color: "#c73418", showLogo: true, emoji: "👋" };

function rowToQuestion(r: Record<string, unknown>): Question {
  return {
    id: r.id as string,
    form_id: r.form_id as string,
    type: r.type as QuestionType,
    label: r.label as string,
    placeholder: (r.placeholder as string) ?? null,
    options: parseJson<string[]>(r.options_json, []),
    required: !!r.required,
    active: !!r.active,
    position: r.position as number,
    maps_to: (r.maps_to as MapsTo) ?? null,
    scale_max: (r.scale_max as number) ?? null,
  };
}

function rowToForm(r: Record<string, unknown>): Form {
  return {
    id: r.id as string,
    business_id: r.business_id as string,
    name: r.name as string,
    slug: r.slug as string,
    status: (r.status as Form["status"]) ?? "active",
    incentive: r.incentive as string,
    welcome_title: (r.welcome_title as string) ?? "",
    welcome_text: (r.welcome_text as string) ?? "",
    success_title: (r.success_title as string) ?? "",
    success_text: (r.success_text as string) ?? "",
    theme: { ...DEFAULT_THEME, ...parseJson<Partial<FormTheme>>(r.theme_json, {}) },
    is_template: !!r.is_template,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
  };
}

export async function listForms(businessId: string): Promise<Form[]> {
  const result = await rows(
    `SELECT f.*,
       (SELECT COUNT(*) FROM submissions s WHERE s.form_id = f.id) AS submissions_count,
       (SELECT COUNT(*) FROM scans sc WHERE sc.form_id = f.id) AS scans_count
     FROM forms f WHERE f.business_id = $1
     ORDER BY f.is_template ASC, f.created_at ASC`,
    [businessId],
  );
  return result.map((r) => ({
    ...rowToForm(r),
    submissions_count: Number(r.submissions_count),
    scans_count: Number(r.scans_count),
  }));
}

export async function getForm(businessId: string, formId: string): Promise<Form | null> {
  const row = await one("SELECT * FROM forms WHERE id = $1 AND business_id = $2", [
    formId,
    businessId,
  ]);
  if (!row) return null;
  const form = rowToForm(row);
  form.questions = await listQuestions(formId);
  return form;
}

export async function listQuestions(formId: string): Promise<Question[]> {
  const result = await rows(
    "SELECT * FROM questions WHERE form_id = $1 ORDER BY position ASC, created_at ASC",
    [formId],
  );
  return result.map(rowToQuestion);
}

export async function getPublicFormBySlug(slug: string): Promise<{
  form: Form;
  business: { id: string; name: string; logo_url: string | null; brand_color: string };
} | null> {
  const row = await one("SELECT * FROM forms WHERE slug = $1 AND is_template = FALSE", [slug]);
  if (!row) return null;
  const form = rowToForm(row);
  form.questions = (await listQuestions(form.id)).filter((q) => q.active);
  const biz = await one<{ id: string; name: string; logo_url: string | null; brand_color: string }>(
    "SELECT id, name, logo_url, brand_color FROM businesses WHERE id = $1",
    [form.business_id],
  );
  if (!biz) return null;
  return { form, business: { ...biz } };
}

async function uniqueSlug(base: string): Promise<string> {
  let candidate = base || `form-${shortCode(4)}`;
  let i = 0;
  while (await one("SELECT 1 FROM forms WHERE slug = $1", [candidate])) {
    i++;
    candidate = `${base}-${shortCode(3)}`;
    if (i > 20) candidate = `${base}-${uid().slice(0, 8)}`;
  }
  return candidate;
}

interface QuestionSeed {
  type: QuestionType;
  label: string;
  placeholder?: string | null;
  options?: string[];
  required?: boolean;
  active?: boolean;
  maps_to?: MapsTo;
  scale_max?: number | null;
}

const DEFAULT_QUESTIONS: QuestionSeed[] = [
  { type: "text", label: "¿Cómo te llamás?", placeholder: "Tu nombre", required: true, maps_to: "name" },
  { type: "text", label: "¿Qué consumiste hoy?", placeholder: "Ej.: hamburguesa completa y limonada", required: true, maps_to: "product" },
  { type: "text", label: "Tu teléfono", placeholder: "Ej.: 11 5555 0000", maps_to: "phone" },
  { type: "text", label: "Tu email", placeholder: "nombre@email.com", maps_to: "email" },
  { type: "select", label: "¿Cómo nos conociste?", options: ["Pasaba por el local", "Redes sociales", "Me lo recomendaron", "Otro"] },
  { type: "scale", label: "¿Qué tan probable es que nos recomiendes?", scale_max: 10 },
  { type: "select", label: "Género", options: ["Femenino", "Masculino", "Prefiero no decirlo"], active: false, maps_to: "gender" },
  { type: "number", label: "¿Cuántos años tenés?", placeholder: "Ej.: 28", active: false, maps_to: "age" },
];

export async function insertQuestions(
  formId: string,
  seeds: QuestionSeed[],
  startPos = 0,
  runner?: Executor,
) {
  for (let i = 0; i < seeds.length; i++) {
    const q = seeds[i]!;
    await run(
      `INSERT INTO questions (id, form_id, type, label, placeholder, options_json, required, active, position, maps_to, scale_max, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        uid(),
        formId,
        q.type,
        q.label,
        q.placeholder ?? null,
        JSON.stringify(q.options ?? []),
        !!q.required,
        q.active !== false,
        startPos + i,
        q.maps_to ?? null,
        q.scale_max ?? null,
        nowIso(),
      ],
      runner,
    );
  }
}

export async function createForm(
  businessId: string,
  name: string,
  opts?: { slugBase?: string; withDefaults?: boolean; incentive?: string },
): Promise<Form> {
  const id = uid();
  const slug = await uniqueSlug(slugify(opts?.slugBase ?? name));
  const now = nowIso();
  await tx(async (client) => {
    await run(
      `INSERT INTO forms (id, business_id, name, slug, status, incentive, theme_json, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'active', $5, $6, $7, $8)`,
      [
        id,
        businessId,
        name,
        slug,
        opts?.incentive ?? "5% de descuento en tu consumo",
        JSON.stringify(DEFAULT_THEME),
        now,
        now,
      ],
      client,
    );
    if (opts?.withDefaults !== false) await insertQuestions(id, DEFAULT_QUESTIONS, 0, client);
  });
  log.info("form.created", { businessId, formId: id });
  return (await getForm(businessId, id))!;
}

const FORM_PATCH_FIELDS = [
  "name",
  "status",
  "incentive",
  "welcome_title",
  "welcome_text",
  "success_title",
  "success_text",
] as const;

export async function updateForm(
  businessId: string,
  formId: string,
  patch: Partial<Pick<Form, (typeof FORM_PATCH_FIELDS)[number]>> & { theme?: Partial<FormTheme> },
): Promise<Form> {
  const existing = await getForm(businessId, formId);
  if (!existing) throw new ApiError(404, "Formulario no encontrado");

  const sets: string[] = [];
  const values: unknown[] = [];
  for (const field of FORM_PATCH_FIELDS) {
    if (patch[field] !== undefined) {
      values.push(patch[field]);
      sets.push(`${field} = $${values.length}`);
    }
  }
  if (patch.theme) {
    values.push(JSON.stringify({ ...existing.theme, ...patch.theme }));
    sets.push(`theme_json = $${values.length}`);
  }
  values.push(nowIso());
  sets.push(`updated_at = $${values.length}`);
  values.push(formId, businessId);

  await run(
    `UPDATE forms SET ${sets.join(", ")} WHERE id = $${values.length - 1} AND business_id = $${values.length}`,
    values,
  );
  return (await getForm(businessId, formId))!;
}

export async function deleteForm(businessId: string, formId: string) {
  const changes = await run("DELETE FROM forms WHERE id = $1 AND business_id = $2", [
    formId,
    businessId,
  ]);
  if (changes === 0) throw new ApiError(404, "Formulario no encontrado");
  log.info("form.deleted", { businessId, formId });
}

export async function duplicateForm(
  businessId: string,
  formId: string,
  opts?: { asTemplate?: boolean; name?: string },
): Promise<Form> {
  const source = await getForm(businessId, formId);
  if (!source) throw new ApiError(404, "Formulario no encontrado");
  const id = uid();
  const now = nowIso();
  const name =
    opts?.name ?? (opts?.asTemplate ? `${source.name} (plantilla)` : `${source.name} (copia)`);
  const slug = await uniqueSlug(slugify(name));

  await tx(async (client) => {
    await run(
      `INSERT INTO forms (id, business_id, name, slug, status, incentive, welcome_title, welcome_text, success_title, success_text, theme_json, is_template, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        id,
        businessId,
        name,
        slug,
        opts?.asTemplate ? "paused" : "active",
        source.incentive,
        source.welcome_title,
        source.welcome_text,
        source.success_title,
        source.success_text,
        JSON.stringify(source.theme),
        !!opts?.asTemplate,
        now,
        now,
      ],
      client,
    );
    await insertQuestions(
      id,
      (source.questions ?? []).map((q) => ({
        type: q.type,
        label: q.label,
        placeholder: q.placeholder ?? undefined,
        options: q.options,
        required: q.required,
        active: q.active,
        maps_to: q.maps_to,
        scale_max: q.scale_max ?? undefined,
      })),
      0,
      client,
    );
  });
  return (await getForm(businessId, id))!;
}

/* ————— Preguntas ————— */

async function assertFormOwnership(businessId: string, formId: string) {
  const row = await one("SELECT 1 FROM forms WHERE id = $1 AND business_id = $2", [
    formId,
    businessId,
  ]);
  if (!row) throw new ApiError(404, "Formulario no encontrado");
}

export async function addQuestion(
  businessId: string,
  formId: string,
  data: QuestionSeed,
): Promise<Question> {
  await assertFormOwnership(businessId, formId);
  const max = await one<{ m: string | number }>(
    "SELECT COALESCE(MAX(position), -1) AS m FROM questions WHERE form_id = $1",
    [formId],
  );
  const id = uid();
  await run(
    `INSERT INTO questions (id, form_id, type, label, placeholder, options_json, required, active, position, maps_to, scale_max, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      id,
      formId,
      data.type,
      data.label,
      data.placeholder ?? null,
      JSON.stringify(data.options ?? []),
      !!data.required,
      data.active !== false,
      Number(max?.m ?? -1) + 1,
      data.maps_to ?? null,
      data.scale_max ?? null,
      nowIso(),
    ],
  );
  await touchForm(formId);
  const row = (await one("SELECT * FROM questions WHERE id = $1", [id]))!;
  return rowToQuestion(row);
}

export async function updateQuestion(
  businessId: string,
  formId: string,
  questionId: string,
  patch: Partial<QuestionSeed> & { required?: boolean; active?: boolean },
): Promise<Question> {
  await assertFormOwnership(businessId, formId);
  const sets: string[] = [];
  const values: unknown[] = [];
  const push = (col: string, value: unknown) => {
    values.push(value);
    sets.push(`${col} = $${values.length}`);
  };
  if (patch.label !== undefined) push("label", patch.label);
  if (patch.type !== undefined) push("type", patch.type);
  if (patch.placeholder !== undefined) push("placeholder", patch.placeholder ?? null);
  if (patch.options !== undefined) push("options_json", JSON.stringify(patch.options));
  if (patch.required !== undefined) push("required", patch.required);
  if (patch.active !== undefined) push("active", patch.active);
  if (patch.maps_to !== undefined) push("maps_to", patch.maps_to ?? null);
  if (patch.scale_max !== undefined) push("scale_max", patch.scale_max ?? null);
  if (sets.length === 0) throw new ApiError(400, "Nada para actualizar");

  values.push(questionId, formId);
  const changes = await run(
    `UPDATE questions SET ${sets.join(", ")} WHERE id = $${values.length - 1} AND form_id = $${values.length}`,
    values,
  );
  if (changes === 0) throw new ApiError(404, "Pregunta no encontrada");
  await touchForm(formId);
  const row = (await one("SELECT * FROM questions WHERE id = $1", [questionId]))!;
  return rowToQuestion(row);
}

export async function deleteQuestion(businessId: string, formId: string, questionId: string) {
  await assertFormOwnership(businessId, formId);
  const changes = await run("DELETE FROM questions WHERE id = $1 AND form_id = $2", [
    questionId,
    formId,
  ]);
  if (changes === 0) throw new ApiError(404, "Pregunta no encontrada");
  await touchForm(formId);
}

export async function reorderQuestions(businessId: string, formId: string, orderedIds: string[]) {
  await assertFormOwnership(businessId, formId);
  await tx(async (client) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await run(
        "UPDATE questions SET position = $1 WHERE id = $2 AND form_id = $3",
        [i, orderedIds[i], formId],
        client,
      );
    }
  });
  await touchForm(formId);
}

async function touchForm(formId: string) {
  await run("UPDATE forms SET updated_at = $1 WHERE id = $2", [nowIso(), formId]);
}
