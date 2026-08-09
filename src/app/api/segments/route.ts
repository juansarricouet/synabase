import { z } from "zod";
import { NextResponse } from "next/server";
import { parseBody, withTenant } from "@/server/http";
import { ruleSchema } from "@/server/schemas";
import { createSegment, listSegments } from "@/server/services/segments";
import { checkPuedeSegmentar } from "@/server/plan-limits";

export const GET = withTenant(async (tenant) => {
  return NextResponse.json({ segments: await listSegments(tenant.business.id) });
});

const createSchema = z.object({
  name: z.string().min(2, "Poné un nombre").max(60),
  description: z.string().max(200).optional(),
  rules: z.array(ruleSchema).min(1, "Agregá al menos una condición").max(12),
});

export const POST = withTenant(async (tenant, req) => {
  checkPuedeSegmentar(tenant.business.plan);
  const data = await parseBody(req, createSchema);
  const segment = await createSegment(tenant.business.id, data);
  return NextResponse.json({ segment });
});
