import { requireTenant } from "@/server/guard";
import { listCampaigns, whatsappSentThisMonth } from "@/server/services/campaigns";
import { listSegments } from "@/server/services/segments";
import { PageHeader } from "@/components/shell/PageHeader";
import { CampaignsView } from "./CampaignsView";
import { PlanGate } from "@/components/PlanGate";

export const dynamic = "force-dynamic";

export default async function CampaignsPage(props: { searchParams: Promise<{ segmento?: string }> }) {
  const { segmento } = await props.searchParams;
  const tenant = await requireTenant();

  if (tenant.business.plan === "free") {
    return (
      <div>
        <PageHeader title="Campañas" description="Mensajes segmentados para que tus clientes vuelvan." />
        <PlanGate plan={tenant.business.plan} necesita="pro" titulo="Las campañas vienen con Pro">
          Elegís un segmento, escribís un mensaje con el nombre y el gusto de cada cliente, y lo
          mandás por email. Con Business se suma WhatsApp.
        </PlanGate>
      </div>
    );
  }

  const campaigns = await listCampaigns(tenant.business.id);
  const segments = await listSegments(tenant.business.id);
  const whatsappUsed = await whatsappSentThisMonth(tenant.business.id);

  return (
    <div>
      <PageHeader
        title="Campañas"
        hint="Elegís un segmento, escribís un mensaje con el nombre y el gusto de cada uno, y lo mandás por email o WhatsApp. Antes de enviar te decimos a cuánta gente le llega."
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
