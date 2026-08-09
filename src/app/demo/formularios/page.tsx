import { demoForms } from "@/server/demo-data";
import { PageHeader } from "@/components/shell/PageHeader";
import { FormsGrid } from "@/app/app/formularios/FormsGrid";

export default function DemoFormsPage() {
  return (
    <div>
      <PageHeader title="Formularios y QR" hint="Acá elegís qué le preguntás a tus clientes y descargás el QR para imprimir. Cada formulario tiene su propio QR y su propio link." description="Cada formulario tiene su propio QR. Personalizá las preguntas, el diseño y descargalo para tu local." />
      <FormsGrid forms={demoForms()} basePath="/demo" />
    </div>
  );
}
