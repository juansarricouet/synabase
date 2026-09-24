import { NextResponse } from "next/server";
import { withTenant } from "@/server/http";
import { dispatchCampaign, getCampaign } from "@/server/services/campaigns";
import { checkPuedeCampaña } from "@/server/plan-limits";

/**
 * Dispara la campaña: manda los mails y guarda qué pasó con cada uno.
 *
 * El envío ocurre dentro de este pedido, así que necesita más aire que los
 * diez segundos que trae por defecto una función serverless.
 */
export const maxDuration = 60;

export const POST = withTenant(async (tenant, _req, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const previa = await getCampaign(tenant.business.id, id);
  if (previa) checkPuedeCampaña(tenant.business.plan, previa.channel);
  const { campaign, enviados, fallados } = await dispatchCampaign(tenant.business.id, id);
  return NextResponse.json({ campaign, enviados, fallados });
});
