import { notFound } from "next/navigation";
import { requireTenant } from "@/server/guard";
import { getCustomer, getCustomerHistory, listTags } from "@/server/services/customers";
import { listSegments, matchesRule } from "@/server/services/segments";
import { CustomerProfileView } from "@/components/views/CustomerProfileView";

export const dynamic = "force-dynamic";

export default async function CustomerProfilePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const tenant = await requireTenant();
  const customer = await getCustomer(tenant.business.id, id);
  if (!customer) notFound();

  const history = await getCustomerHistory(tenant.business.id, id);
  const allTags = await listTags(tenant.business.id);
  const segments = (await listSegments(tenant.business.id, false)).filter(
    (s) => s.rules.length > 0 && s.rules.every((r) => matchesRule(customer, r)),
  );

  return <CustomerProfileView customer={customer} history={history} allTags={allTags} segments={segments} />;
}
