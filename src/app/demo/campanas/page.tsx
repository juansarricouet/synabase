import { demoCampaigns, demoSegments, demoWhatsappThisMonth, getDemoBusiness } from "@/server/demo-data";
import { PageHeader } from "@/components/shell/PageHeader";
import { CampaignsView } from "@/app/app/campanas/CampaignsView";

export default function DemoCampaignsPage() {
  return (
    <div>
      <PageHeader title="Campañas" description="Mensajes segmentados para que tus clientes vuelvan. Guardá borradores, programá y llevá el historial." />
      <CampaignsView
        campaigns={demoCampaigns()}
        segments={demoSegments()}
        presetSegmentId={null}
        whatsappUsed={demoWhatsappThisMonth()}
        planId={getDemoBusiness().plan}
      />
    </div>
  );
}
