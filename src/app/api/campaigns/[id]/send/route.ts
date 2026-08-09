import { NextResponse } from "next/server";
import { withTenant } from "@/server/http";
import { dispatchCampaign, getCampaign } from "@/server/services/campaigns";
import { checkPuedeCampaña } from "@/server/plan-limits";

/**
 * Dispara la campaña: materializa la cola de destinatarios y la marca como
 * enviada. La integración real de WhatsApp/Email se conecta sobre esta misma
 * cola (campaign_recipients) sin cambiar la API.
 */
export const POST = withTenant(async (tenant, _req, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const previa = await getCampaign(tenant.business.id, id);
  if (previa) checkPuedeCampaña(tenant.business.plan, previa.channel);
  const campaign = await dispatchCampaign(tenant.business.id, id);
  return NextResponse.json({ campaign });
});
