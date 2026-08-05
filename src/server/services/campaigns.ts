import "server-only";
import { nowIso, one, rows, run, tx, uid } from "../db";
import { ApiError } from "../http";
import { log } from "../log";
import { evaluateRules, getSegment } from "./segments";
import type { Campaign, CampaignChannel, CampaignStatus } from "@/lib/types";
import type { CustomerFacts } from "./customers";

function rowToCampaign(r: Record<string, unknown>): Campaign {
  return {
    id: r.id as string,
    business_id: r.business_id as string,
    name: r.name as string,
    channel: r.channel as CampaignChannel,
    segment_id: (r.segment_id as string) ?? null,
    segment_name: (r.segment_name as string) ?? null,
    subject: (r.subject as string) ?? null,
    message: r.message as string,
    status: r.status as CampaignStatus,
    scheduled_for: (r.scheduled_for as string) ?? null,
    sent_at: (r.sent_at as string) ?? null,
    audience_count: Number(r.audience_count ?? 0),
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
  };
}

export async function listCampaigns(businessId: string): Promise<Campaign[]> {
  const result = await rows(
    `SELECT c.*, s.name AS segment_name FROM campaigns c
     LEFT JOIN segments s ON s.id = c.segment_id
     WHERE c.business_id = $1 ORDER BY c.created_at DESC`,
    [businessId],
  );
  return result.map(rowToCampaign);
}

export async function getCampaign(
  businessId: string,
  campaignId: string,
): Promise<Campaign | null> {
  const row = await one(
    `SELECT c.*, s.name AS segment_name FROM campaigns c
     LEFT JOIN segments s ON s.id = c.segment_id
     WHERE c.id = $1 AND c.business_id = $2`,
    [campaignId, businessId],
  );
  return row ? rowToCampaign(row) : null;
}

/** Audiencia efectiva de una campaña (clientes del segmento con canal disponible). */
export async function resolveAudience(
  businessId: string,
  segmentId: string | null,
  channel: CampaignChannel,
): Promise<CustomerFacts[]> {
  const segment = segmentId ? await getSegment(businessId, segmentId) : null;
  const base = await evaluateRules(businessId, segment?.rules ?? []);
  if (channel === "whatsapp") return base.filter((c) => !!c.phone);
  return base.filter((c) => !!c.email);
}

export interface CampaignInput {
  name: string;
  channel: CampaignChannel;
  segment_id: string | null;
  subject?: string | null;
  message: string;
  status?: CampaignStatus;
  scheduled_for?: string | null;
}

export async function createCampaign(
  businessId: string,
  data: CampaignInput,
): Promise<Campaign> {
  const id = uid();
  const now = nowIso();
  const audience = await resolveAudience(businessId, data.segment_id, data.channel);
  await run(
    `INSERT INTO campaigns (id, business_id, name, channel, segment_id, subject, message, status, scheduled_for, audience_count, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      id,
      businessId,
      data.name.trim(),
      data.channel,
      data.segment_id,
      data.subject ?? null,
      data.message,
      data.status ?? "draft",
      data.scheduled_for ?? null,
      audience.length,
      now,
      now,
    ],
  );
  log.info("campaign.created", { businessId, campaignId: id, status: data.status ?? "draft" });
  return (await getCampaign(businessId, id))!;
}

export async function updateCampaign(
  businessId: string,
  campaignId: string,
  data: Partial<CampaignInput>,
): Promise<Campaign> {
  const existing = await getCampaign(businessId, campaignId);
  if (!existing) throw new ApiError(404, "Campaña no encontrada");
  if (existing.status === "sent") throw new ApiError(400, "Una campaña enviada no se puede editar");

  const merged = {
    name: data.name ?? existing.name,
    channel: data.channel ?? existing.channel,
    segment_id: data.segment_id !== undefined ? data.segment_id : existing.segment_id,
    subject: data.subject !== undefined ? data.subject : existing.subject,
    message: data.message ?? existing.message,
    status: data.status ?? existing.status,
    scheduled_for: data.scheduled_for !== undefined ? data.scheduled_for : existing.scheduled_for,
  };
  const audience = await resolveAudience(businessId, merged.segment_id, merged.channel);
  await run(
    `UPDATE campaigns SET name = $1, channel = $2, segment_id = $3, subject = $4, message = $5,
            status = $6, scheduled_for = $7, audience_count = $8, updated_at = $9
     WHERE id = $10 AND business_id = $11`,
    [
      merged.name,
      merged.channel,
      merged.segment_id,
      merged.subject,
      merged.message,
      merged.status,
      merged.scheduled_for,
      audience.length,
      nowIso(),
      campaignId,
      businessId,
    ],
  );
  return (await getCampaign(businessId, campaignId))!;
}

export async function deleteCampaign(businessId: string, campaignId: string) {
  const changes = await run("DELETE FROM campaigns WHERE id = $1 AND business_id = $2", [
    campaignId,
    businessId,
  ]);
  if (changes === 0) throw new ApiError(404, "Campaña no encontrada");
}

/**
 * "Envío" de campaña. La integración real (WhatsApp Business API / proveedor
 * de email) se conecta acá: hoy materializa la cola de destinatarios con el
 * snapshot de la audiencia y marca la campaña como enviada. Un worker externo
 * solo tendría que consumir campaign_recipients con status 'queued'.
 */
export async function dispatchCampaign(
  businessId: string,
  campaignId: string,
): Promise<Campaign> {
  const campaign = await getCampaign(businessId, campaignId);
  if (!campaign) throw new ApiError(404, "Campaña no encontrada");
  if (campaign.status === "sent") throw new ApiError(400, "Esta campaña ya fue enviada");

  const audience = await resolveAudience(businessId, campaign.segment_id, campaign.channel);
  if (audience.length === 0) {
    throw new ApiError(400, "La audiencia está vacía: no hay clientes con ese canal de contacto");
  }
  const now = nowIso();

  await tx(async (client) => {
    for (const c of audience) {
      await run(
        "INSERT INTO campaign_recipients (id, campaign_id, customer_id, channel_to, status, sent_at, created_at) VALUES ($1, $2, $3, $4, 'sent', $5, $6)",
        [uid(), campaignId, c.id, campaign.channel === "whatsapp" ? c.phone : c.email, now, now],
        client,
      );
    }
    await run(
      "UPDATE campaigns SET status = 'sent', sent_at = $1, audience_count = $2, updated_at = $3 WHERE id = $4",
      [now, audience.length, now, campaignId],
      client,
    );
  });

  log.info("campaign.dispatched", { businessId, campaignId, audience: audience.length });
  return (await getCampaign(businessId, campaignId))!;
}

/** Reemplaza variables {{nombre}}, {{producto_favorito}}, etc. en el mensaje. */
export function renderMessage(template: string, c: CustomerFacts): string {
  return template
    .replaceAll("{{nombre}}", c.name.split(" ")[0] ?? c.name)
    .replaceAll("{{nombre_completo}}", c.name)
    .replaceAll("{{producto_favorito}}", c.favorite_product ?? "tu pedido de siempre")
    .replaceAll("{{visitas}}", String(c.visits));
}
