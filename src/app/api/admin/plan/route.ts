import { z } from "zod";
import { NextResponse } from "next/server";
import { parseBody, withPublic } from "@/server/http";
import { requireAdmin } from "@/server/admin-guard";
import { setPlanManually } from "@/server/services/billing";

const schema = z.object({
  businessId: z.string().min(1),
  plan: z.enum(["free", "pro", "business"]),
});

/** Cambia el plan de un comercio a mano, sin pago de por medio. */
export const POST = withPublic(async (req) => {
  await requireAdmin();
  const { businessId, plan } = await parseBody(req, schema);
  await setPlanManually(businessId, plan);
  return NextResponse.json({ ok: true });
});
