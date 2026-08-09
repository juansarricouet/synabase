import { requireTenant } from "@/server/guard";
import { listSegments } from "@/server/services/segments";
import { listTags } from "@/server/services/customers";
import { num, one, parseJson, rows } from "@/server/db";
import { PageHeader } from "@/components/shell/PageHeader";
import { SegmentsView, type QuestionOption } from "./SegmentsView";

export const dynamic = "force-dynamic";

export default async function SegmentsPage() {
  const tenant = await requireTenant();
  const segments = await listSegments(tenant.business.id);
  const tags = await listTags(tenant.business.id);
  const totalCustomers = num(
    (
      await one<{ c: string }>("SELECT COUNT(*) AS c FROM customers WHERE business_id = $1", [
        tenant.business.id,
      ])
    )?.c,
  );

  // Preguntas propias del comercio: sirven como condición de segmentación.
  const questions = (
    await rows<{ id: string; label: string; type: string; options_json: string; form_name: string }>(
      `SELECT q.id, q.label, q.type, q.options_json, f.name AS form_name
       FROM questions q JOIN forms f ON f.id = q.form_id
       WHERE f.business_id = $1 AND f.is_template = FALSE AND q.maps_to IS NULL
       ORDER BY f.created_at ASC, q.position ASC`,
      [tenant.business.id],
    )
  ).map((q) => ({
    id: q.id,
    label: q.label,
    type: q.type,
    options: parseJson<string[]>(q.options_json, []),
    form_name: q.form_name,
  })) satisfies QuestionOption[];

  return (
    <div>
      <PageHeader
        title="Segmentos"
        hint={'Un segmento es un grupo que se arma solo con reglas: por ejemplo "hace más de 30 días que no vienen". Se actualiza cada vez que entra un cliente nuevo.'}
        description="Agrupá clientes por comportamiento y datos reales. Después usalos en campañas para traerlos de vuelta."
      />
      <SegmentsView segments={segments} tags={tags} questions={questions} totalCustomers={totalCustomers} />
    </div>
  );
}
