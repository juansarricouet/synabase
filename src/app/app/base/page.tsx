import { requireTenant } from "@/server/guard";
import { listForms, listQuestions } from "@/server/services/forms";
import { listSubmissions } from "@/server/services/submissions";
import { PageHeader } from "@/components/shell/PageHeader";
import { DataGrid } from "./DataGrid";

export const dynamic = "force-dynamic";

export default async function DatabasePage() {
  const tenant = await requireTenant();
  const allForms = await listForms(tenant.business.id);
  const { rows, total } = await listSubmissions(tenant.business.id, { limit: 500 });

  // Cada formulario aporta sus preguntas como columnas de la grilla.
  const forms = await Promise.all(
    allForms
      .filter((f) => !f.is_template)
      .map(async (f) => ({
        id: f.id,
        name: f.name,
        questions: (await listQuestions(f.id)).map((q) => ({
          id: q.id,
          label: q.label,
          type: q.type,
          options: q.options,
        })),
      })),
  );

  return (
    <div>
      <PageHeader
        title="Base de datos"
        description={`${total} registros capturados por tus formularios. Filtrá, agrupá, editá y exportá.`}
      />
      <DataGrid
        rows={rows}
        forms={forms}
        businessName={tenant.business.name}
      />
    </div>
  );
}
