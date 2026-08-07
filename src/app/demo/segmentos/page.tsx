import { demoSegmentQuestions, demoSegments, demoTags, demoTotalCustomers } from "@/server/demo-data";
import { PageHeader } from "@/components/shell/PageHeader";
import { SegmentsView } from "@/app/app/segmentos/SegmentsView";

export default function DemoSegmentsPage() {
  return (
    <div>
      <PageHeader title="Segmentos" description="Agrupá clientes por comportamiento y datos reales. Después usalos en campañas para traerlos de vuelta." />
      <SegmentsView
        segments={demoSegments()}
        tags={demoTags()}
        questions={demoSegmentQuestions()}
        totalCustomers={demoTotalCustomers()}
      />
    </div>
  );
}
