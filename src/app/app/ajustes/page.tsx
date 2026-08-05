import { requireTenant } from "@/server/guard";
import { listInvitations, listMembers } from "@/server/services/business";
import { num, one } from "@/server/db";
import { PageHeader } from "@/components/shell/PageHeader";
import { SettingsView } from "./SettingsView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const tenant = await requireTenant();
  const members = await listMembers(tenant.business.id);
  const invitations = await listInvitations(tenant.business.id);
  const count = async (sql: string) =>
    num((await one<{ c: string }>(sql, [tenant.business.id]))?.c);
  const usage = {
    customers: await count("SELECT COUNT(*) AS c FROM customers WHERE business_id = $1"),
    forms: await count("SELECT COUNT(*) AS c FROM forms WHERE business_id = $1 AND is_template = FALSE"),
    submissions: await count("SELECT COUNT(*) AS c FROM submissions WHERE business_id = $1"),
  };

  return (
    <div>
      <PageHeader
        title="Ajustes"
        description="El perfil de tu comercio, tu equipo y tu suscripción."
      />
      <SettingsView
        business={tenant.business}
        role={tenant.role}
        currentUserId={tenant.user.id}
        members={members}
        invitations={invitations}
        usage={usage}
      />
    </div>
  );
}
