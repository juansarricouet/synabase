import { demoForms, demoSubmissions, getDemoBusiness } from "@/server/demo-data";
import { PageHeader } from "@/components/shell/PageHeader";
import { DataGrid } from "@/app/app/base/DataGrid";

export default function DemoDatabasePage() {
  const rows = demoSubmissions();
  const forms = demoForms().filter((f) => !f.is_template).map((f) => ({
    id: f.id,
    name: f.name,
    questions: (f.questions ?? []).map((q) => ({ id: q.id, label: q.label, type: q.type, options: q.options })),
  }));
  return (
    <div>
      <PageHeader title="Base de datos" hint="La planilla cruda: una fila por respuesta del formulario. Se puede filtrar, agrupar, editar celda por celda y bajar a Excel, CSV o PDF." description={`${rows.length} registros capturados por tus formularios. Filtrá, agrupá y exportá.`} />
      <DataGrid rows={rows} forms={forms} businessName={getDemoBusiness().name} basePath="/demo" />
    </div>
  );
}
