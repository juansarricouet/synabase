import { z } from "zod";
import { NextResponse } from "next/server";
import { parseBody, withPublic } from "@/server/http";
import { requireAdmin } from "@/server/admin-guard";
import { confirmPayment, rejectPayment } from "@/server/services/billing";

const schema = z.object({
  action: z.enum(["confirmar", "rechazar"]),
  note: z.string().max(300).optional(),
});

/** Resuelve una solicitud de pago. Sólo para los emails de administración. */
export const POST = withPublic(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const { action, note } = await parseBody(req, schema);

  const payment =
    action === "confirmar"
      ? await confirmPayment(id, admin.id)
      : await rejectPayment(id, admin.id, note);

  return NextResponse.json({ payment });
});
