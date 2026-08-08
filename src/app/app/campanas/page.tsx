import { requireTenant } from "@/server/guard";
import { listCampaigns, whatsappSentThisMonth } from "@/server/services/campaigns";
import { listSegments } from "@/server/services/segments";
import { PageHeader } from "@/components/shell/PageHeader";
import { CampaignsView } from "./CampaignsView";

export const dynamic = "force-dynamic";

export default async function CampaignsPage(props: { searchParams: Promise<{ segmento?: string }> }) {
  const { segmento } = await props.searchParams;
  const tenant = await requireTenant();
  const campaigns = await listCampaigns(tenant.business.id);
  const segments = await listSegments(tenant.business.id);
  const whatsappUsed = await whatsappSentThisMonth(tenant.business.id);

  return (
    <div>
      <PageHeader
        title="Campañas"
        description="Mensajes segmentados para que tus clientes vuelvan. Guardá borradores, programá y llevá el historial."
      />
      <CampaignsView
        campaigns={campaigns}
        segments={segments}
        presetSegmentId={segmento ?? null}
        whatsappUsed={whatsappUsed}
        planId={tenant.business.plan}
      />
    </div>
  );
}
