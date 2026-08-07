import { requireTenant } from "@/server/guard";
import { getAnalytics } from "@/server/services/stats";
import { AnalyticsView } from "@/components/views/AnalyticsView";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const tenant = await requireTenant();
  const a = await getAnalytics(tenant.business.id);
  return <AnalyticsView a={a} businessName={tenant.business.name} />;
}
