import "server-only";
import {
  localHour,
  localWeekday,
  nowIso,
  num,
  one,
  parseJson,
  rows,
  run,
  shortCode,
  tx,
  uid,
} from "../db";
import { ApiError } from "../http";
import { log } from "../log";
import { getPublicFormBySlug } from "./forms";
import { validarRespuesta } from "@/lib/answer-validation";
import { sendDiscountCode } from "../notify";
import type { Question, SubmissionRow } from "@/lib/types";

/* ————— Registro de escaneos ————— */

export async function recordScan(slug: string): Promise<boolean> {
  const found = await getPublicFormBySlug(slug);
  if (!found) return false;
  await run("INSERT INTO scans (id, business_id, form_id, created_at) VALUES ($1, $2, $3, $4)", [
    uid(),
    found.business.id,
    found.form.id,
    nowIso(),
  ]);
  return true;
}

/* ————— Normalización de identidad ————— */

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 6) return null;
  return digits.slice(-11);
}

function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function normalizeGender(raw: string): string | null {
  const g = raw.trim().toLowerCase();
  if (g.startsWith("f")) return "Femenino";
  if (g.startsWith("m") && !g.startsWith("me")) return "Masculino";
  if (g.length > 0) return "Otro / sin especificar";
  return null;
}

/* ————— Validación de respuestas contra las preguntas ————— */

function coerceAnswer(q: Question, value: unknown): unknown {
  if (value === undefined || value === null || value === "") {
    if (q.required) throw new ApiError(400, `Falta responder: ${q.label}`);
    return null;
  }
  switch (q.type) {
    case "text":
    case "date": {
      const s = String(value).trim().slice(0, 500);
      if (q.required && s.length === 0) throw new ApiError(400, `Falta responder: ${q.label}`);
      return s;
    }
    case "number":
    case "scale": {
      const n = Number(value);
      if (!Number.isFinite(n)) throw new ApiError(400, `Respuesta inválida en: ${q.label}`);
      return n;
    }
    case "boolean":
      return value === true || value === "true" || value === "Sí";
    case "select": {
      const s = String(value);
      if (q.options.length > 0 && !q.options.includes(s))
        throw new ApiError(400, `Opción inválida en: ${q.label}`);
      return s;
    }
    case "multiselect": {
      const arr = Array.isArray(value) ? value.map(String) : [String(value)];
      const invalid = q.options.length > 0 && arr.some((v) => !q.options.includes(v));
      if (invalid) throw new ApiError(400, `Opción inválida en: ${q.label}`);
      if (q.required && arr.length === 0) throw new ApiError(400, `Falta responder: ${q.label}`);
      return arr;
    }
    default:
      return String(value).slice(0, 500);
  }
}

/* ————— Submit público: acá se construye la base de datos ————— */

export interface SubmitResult {
  discount_code: string;
  first_time: boolean;
  customer_name: string;
  /** Cómo se le entrega el código, según lo que eligió el comercio. */
  code_delivery: "pantalla" | "email" | "ambos";
  /** Casilla a la que se mandó, para poder mostrarla en pantalla. */
  sent_to?: string | null;
  /** `false` si el envío falló: el formulario muestra el código igual. */
  email_sent?: boolean;
}

export async function submitForm(
  slug: string,
  rawAnswers: Record<string, unknown>,
): Promise<SubmitResult> {
  const found = await getPublicFormBySlug(slug);
  if (!found) throw new ApiError(404, "Este formulario ya no está disponible");
  const { form, business } = found;
  if (form.status !== "active")
    throw new ApiError(410, "Este formulario está pausado en este momento");

  const questions = form.questions ?? [];
  const clean = new Map<string, unknown>();
  for (const q of questions) {
    const valor = coerceAnswer(q, rawAnswers[q.id]);

    /* Se revalida en el servidor: el formulario ya avisa mientras se escribe,
       pero ese control se saltea mandando el pedido a mano, y una base llena de
       "11111" no sirve para segmentar ni para contactar a nadie. */
    const problema = validarRespuesta(q.maps_to, valor);
    if (problema) throw new ApiError(400, problema.mensaje);

    clean.set(q.id, valor);
  }

  // Campos mapeados a la ficha del cliente
  const mapped: Partial<Record<string, unknown>> = {};
  for (const q of questions) {
    if (q.maps_to && clean.get(q.id) != null) mapped[q.maps_to] = clean.get(q.id);
  }

  const name =
    typeof mapped.name === "string" && mapped.name.trim()
      ? mapped.name.trim().slice(0, 80)
      : "Sin nombre";
  const phone = typeof mapped.phone === "string" ? normalizePhone(mapped.phone) : null;
  const email = typeof mapped.email === "string" ? normalizeEmail(mapped.email) : null;
  const gender = typeof mapped.gender === "string" ? normalizeGender(mapped.gender) : null;
  const age =
    typeof mapped.age === "number" && mapped.age > 0 && mapped.age < 120
      ? Math.round(mapped.age)
      : null;
  const product =
    typeof mapped.product === "string"
      ? mapped.product.trim().slice(0, 200)
      : Array.isArray(mapped.product)
        ? (mapped.product as string[]).join(", ").slice(0, 200)
        : null;
  const amount = typeof mapped.amount === "number" && mapped.amount >= 0 ? mapped.amount : null;

  const now = new Date();
  const nowStr = now.toISOString();

  const resultado = await tx(async (client) => {
    // Resolución de identidad: teléfono → email → nombre (dentro del negocio)
    let customer = phone
      ? await one<{ id: string }>(
          "SELECT id FROM customers WHERE business_id = $1 AND phone = $2",
          [business.id, phone],
          client,
        )
      : undefined;
    if (!customer && email) {
      customer = await one<{ id: string }>(
        "SELECT id FROM customers WHERE business_id = $1 AND email = $2",
        [business.id, email],
        client,
      );
    }
    if (!customer && !phone && !email) {
      customer = await one<{ id: string }>(
        `SELECT id FROM customers
         WHERE business_id = $1 AND lower(name) = lower($2) AND phone IS NULL AND email IS NULL`,
        [business.id, name],
        client,
      );
    }

    let customerId: string;
    let firstTime: boolean;
    if (customer) {
      customerId = customer.id;
      firstTime = false;
      await run(
        `UPDATE customers SET
           visits = visits + 1,
           last_visit_at = $1,
           name = CASE WHEN name = 'Sin nombre' THEN $2 ELSE name END,
           phone = COALESCE(phone, $3),
           email = COALESCE(email, $4),
           gender = COALESCE(gender, $5),
           age = COALESCE(age, $6)
         WHERE id = $7`,
        [nowStr, name, phone, email, gender, age, customerId],
        client,
      );
    } else {
      customerId = uid();
      firstTime = true;
      /* El origen se toma del QR que escaneó y queda fijo: si entró por el QR
         de un pedido a domicilio, ese cliente se ganó ahí. Que después venga
         al local es justamente lo que el comercio quiere medir, así que
         pisarlo borraría el dato que importa. */
      await run(
        `INSERT INTO customers (id, business_id, name, phone, email, gender, age, origin, first_visit_at, last_visit_at, visits, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1, $11)`,
        [customerId, business.id, name, phone, email, gender, age, form.origin, nowStr, nowStr, nowStr],
        client,
      );
    }

    const submissionId = uid();
    const prefix = business.name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "SYN";
    const discountCode = `${prefix}-${shortCode(4).toUpperCase()}`;
    await run(
      `INSERT INTO submissions (id, business_id, form_id, customer_id, product, amount, discount_code, hour, weekday, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        submissionId,
        business.id,
        form.id,
        customerId,
        product,
        amount,
        discountCode,
        localHour(now),
        localWeekday(now),
        nowStr,
      ],
      client,
    );

    for (const [qid, value] of clean) {
      if (value === null) continue;
      await run(
        "INSERT INTO answers (id, submission_id, question_id, value_json) VALUES ($1, $2, $3, $4)",
        [uid(), submissionId, qid, JSON.stringify(value)],
        client,
      );
    }

    log.info("submission.created", { businessId: business.id, formId: form.id, firstTime });
    return { discount_code: discountCode, first_time: firstTime, customer_name: name };
  });

  /* El mail se manda después de cerrar la transacción: si el proveedor tarda o
     falla, el registro ya quedó guardado igual. */
  let emailSent = false;
  const quiereMail = form.code_delivery === "email" || form.code_delivery === "ambos";
  if (quiereMail && email) {
    const resumen = questions
      .filter((q) => !q.maps_to || q.maps_to === "product" || q.maps_to === "amount")
      .map((q) => ({ label: q.label, value: textoDeRespuesta(clean.get(q.id)) }));

    emailSent = await sendDiscountCode({
      to: email,
      customerName: resultado.customer_name,
      businessName: business.name,
      code: resultado.discount_code,
      incentive: form.incentive,
      answers: resumen,
    });
  }

  return {
    ...resultado,
    code_delivery: form.code_delivery,
    sent_to: emailSent ? email : null,
    email_sent: emailSent,
  };
}

/** Cómo se escribe una respuesta en el resumen del mail. */
function textoDeRespuesta(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  if (Array.isArray(valor)) return valor.join(", ");
  return String(valor);
}

/* ————— Lectura para el panel ————— */

export interface ListSubmissionsOptions {
  formId?: string;
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export async function listSubmissions(
  businessId: string,
  opts: ListSubmissionsOptions = {},
): Promise<{ rows: SubmissionRow[]; total: number }> {
  const where: string[] = [];
  const params: unknown[] = [];
  const push = (clause: (n: number) => string, value: unknown) => {
    params.push(value);
    where.push(clause(params.length));
  };

  push((n) => `s.business_id = $${n}`, businessId);
  if (opts.formId) push((n) => `s.form_id = $${n}`, opts.formId);
  if (opts.from) push((n) => `s.created_at >= $${n}`, opts.from);
  if (opts.to) push((n) => `s.created_at <= $${n}`, opts.to);
  if (opts.search) {
    params.push(`%${opts.search}%`);
    const n = params.length;
    where.push(`(c.name ILIKE $${n} OR s.product ILIKE $${n} OR c.email ILIKE $${n} OR c.phone ILIKE $${n})`);
  }
  const whereSql = where.join(" AND ");

  const totalRow = await one<{ c: string }>(
    `SELECT COUNT(*) AS c FROM submissions s
     LEFT JOIN customers c ON c.id = s.customer_id
     WHERE ${whereSql}`,
    params,
  );
  const total = num(totalRow?.c);

  const limit = Math.min(opts.limit ?? 100, 500);
  const offset = opts.offset ?? 0;
  const result = await rows(
    `SELECT s.id, s.form_id, s.customer_id, s.product, s.amount, s.discount_code, s.created_at,
            c.name AS customer_name, f.name AS form_name
     FROM submissions s
     LEFT JOIN customers c ON c.id = s.customer_id
     JOIN forms f ON f.id = s.form_id
     WHERE ${whereSql}
     ORDER BY s.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );

  const ids = result.map((r) => r.id as string);
  const answersBySubmission = new Map<string, Record<string, unknown>>();
  if (ids.length > 0) {
    const answerRows = await rows<{
      submission_id: string;
      question_id: string;
      value_json: string | null;
    }>(
      "SELECT submission_id, question_id, value_json FROM answers WHERE submission_id = ANY($1)",
      [ids],
    );
    for (const a of answerRows) {
      const bucket = answersBySubmission.get(a.submission_id) ?? {};
      bucket[a.question_id] = parseJson<unknown>(a.value_json, null);
      answersBySubmission.set(a.submission_id, bucket);
    }
  }

  return {
    total,
    rows: result.map((r) => ({
      id: r.id as string,
      form_id: r.form_id as string,
      form_name: r.form_name as string,
      customer_id: (r.customer_id as string) ?? null,
      customer_name: (r.customer_name as string) ?? null,
      product: (r.product as string) ?? null,
      amount: r.amount != null ? Number(r.amount) : null,
      discount_code: (r.discount_code as string) ?? null,
      created_at: r.created_at as string,
      answers: answersBySubmission.get(r.id as string) ?? {},
    })),
  };
}

export async function updateAnswer(
  businessId: string,
  submissionId: string,
  questionId: string,
  value: unknown,
) {
  const sub = await one("SELECT id FROM submissions WHERE id = $1 AND business_id = $2", [
    submissionId,
    businessId,
  ]);
  if (!sub) throw new ApiError(404, "Registro no encontrado");

  const existing = await one<{ id: string }>(
    "SELECT id FROM answers WHERE submission_id = $1 AND question_id = $2",
    [submissionId, questionId],
  );
  const json = value === null || value === "" ? null : JSON.stringify(value);
  if (existing) {
    await run("UPDATE answers SET value_json = $1 WHERE id = $2", [json, existing.id]);
  } else {
    await run(
      "INSERT INTO answers (id, submission_id, question_id, value_json) VALUES ($1, $2, $3, $4)",
      [uid(), submissionId, questionId, json],
    );
  }

  // Mantener sincronizado el campo desnormalizado si la pregunta mapea a producto
  const q = await one<{ maps_to: string | null }>(
    "SELECT maps_to FROM questions WHERE id = $1",
    [questionId],
  );
  if (q?.maps_to === "product") {
    await run("UPDATE submissions SET product = $1 WHERE id = $2", [
      typeof value === "string" ? value : Array.isArray(value) ? value.join(", ") : null,
      submissionId,
    ]);
  }
}

export async function deleteSubmission(businessId: string, submissionId: string) {
  const sub = await one<{ customer_id: string | null }>(
    "SELECT customer_id FROM submissions WHERE id = $1 AND business_id = $2",
    [submissionId, businessId],
  );
  if (!sub) throw new ApiError(404, "Registro no encontrado");

  await tx(async (client) => {
    await run("DELETE FROM submissions WHERE id = $1", [submissionId], client);
    if (sub.customer_id) {
      // Recalcular contadores del cliente
      const agg = await one<{ visits: string; first: string | null; last: string | null }>(
        "SELECT COUNT(*) AS visits, MIN(created_at) AS first, MAX(created_at) AS last FROM submissions WHERE customer_id = $1",
        [sub.customer_id],
        client,
      );
      if (num(agg?.visits) === 0) {
        await run("DELETE FROM customers WHERE id = $1", [sub.customer_id], client);
      } else {
        await run(
          "UPDATE customers SET visits = $1, first_visit_at = $2, last_visit_at = $3 WHERE id = $4",
          [num(agg?.visits), agg?.first, agg?.last, sub.customer_id],
          client,
        );
      }
    }
  });
}
