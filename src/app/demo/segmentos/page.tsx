import { demoSegmentQuestions, demoSegments, demoTags, demoTotalCustomers } from "@/server/demo-data";
import { PageHeader } from "@/components/shell/PageHeader";
import { SegmentsView } from "@/app/app/segmentos/SegmentsView";

export default function DemoSegmentsPage() {
  return (
    <div>
      <PageHeader title="Segmentos" hint={'Un segmento es un grupo que se arma solo con reglas: por ejemplo "hace más de 30 días que no vienen". Se actualiza cada vez que entra un cliente nuevo.'} description="Agrupá clientes por comportamiento y datos reales. Después usalos en campañas para traerlos de vuelta." />
      <SegmentsView
        segments={demoSegments()}
        tags={demoTags()}
        questions={demoSegmentQuestions()}
        totalCustomers={demoTotalCustomers()}
        basePath="/demo"
      />
    </div>
  );
}
