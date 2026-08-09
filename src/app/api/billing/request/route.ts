import { z } from "zod";
import { NextResponse } from "next/server";
import { parseBody, requireRole, withTenant } from "@/server/http";
import { requestPlan } from "@/server/services/billing";
import { canCharge } from "@/server/billing-config";
import { notifyPlanRequested } from "@/server/notify";

const schema = z.object({ plan: z.enum(["pro", "business"]) });

/** El comercio avisa que pagó. Deja la solicitud pendiente de confirmación. */
export const POST = withTenant(async (tenant, req) => {
  requireRole(tenant, ["owner", "admin"]);
  const { plan } = await parseBody(req, schema);

  if (!canCharge(plan)) {
    return NextResponse.json(
      { error: "Todavía no hay un medio de pago configurado. Escribinos y lo resolvemos." },
      { status: 503 },
    );
  }

  const payment = await requestPlan(tenant.business.id, tenant.user.id, plan);

  void notifyPlanRequested({
    businessName: tenant.business.name,
    plan,
    amountArs: payment.amount_ars,
    userName: tenant.user.name,
    userEmail: tenant.user.email,
  });

  return NextResponse.json({ payment });
});
