import { requireTenant } from "@/server/guard";
import { getDashboardStats } from "@/server/services/stats";
import { listForms } from "@/server/services/forms";
import { DashboardView } from "@/components/views/DashboardView";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const tenant = await requireTenant();
  const stats = await getDashboardStats(tenant.business.id);
  const forms = await listForms(tenant.business.id);
  const mainForm = forms.find((f) => !f.is_template);
  const firstName = tenant.user.name.split(" ")[0] ?? tenant.user.name;

  return <DashboardView stats={stats} mainForm={mainForm} firstName={firstName} />;
}
