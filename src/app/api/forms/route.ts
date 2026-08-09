import { z } from "zod";
import { NextResponse } from "next/server";
import { parseBody, withTenant } from "@/server/http";
import { createForm, listForms } from "@/server/services/forms";
import { checkPuedeCrearFormulario } from "@/server/plan-limits";

export const GET = withTenant(async (tenant) => {
  return NextResponse.json({ forms: await listForms(tenant.business.id) });
});

const schema = z.object({
  name: z.string().min(2, "Poné un nombre").max(80),
  withDefaults: z.boolean().optional(),
});

export const POST = withTenant(async (tenant, req) => {
  const { name, withDefaults } = await parseBody(req, schema);
  await checkPuedeCrearFormulario(tenant.business.id, tenant.business.plan);
  const form = await createForm(tenant.business.id, name, { withDefaults });
  return NextResponse.json({ form });
});
