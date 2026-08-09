import { demoCampaigns, demoSegments, demoWhatsappThisMonth, getDemoBusiness } from "@/server/demo-data";
import { PageHeader } from "@/components/shell/PageHeader";
import { CampaignsView } from "@/app/app/campanas/CampaignsView";

export default function DemoCampaignsPage() {
  return (
    <div>
      <PageHeader title="Campañas" hint="Elegís un segmento, escribís un mensaje con el nombre y el gusto de cada uno, y lo mandás por email o WhatsApp. Antes de enviar te decimos a cuánta gente le llega." description="Mensajes segmentados para que tus clientes vuelvan. Guardá borradores, programá y llevá el historial." />
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
