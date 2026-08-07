import { notFound } from "next/navigation";
import { demoCustomer, demoCustomerHistory, demoSegments, demoTags } from "@/server/demo-data";
import { matchesRule } from "@/server/services/segments";
import { CustomerProfileView } from "@/components/views/CustomerProfileView";

export default async function DemoCustomerProfilePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const customer = demoCustomer(id);
  if (!customer) notFound();

  const segments = demoSegments().filter(
    (s) => s.rules.length > 0 && s.rules.every((r) => matchesRule(customer, r)),
  );

  return (
    <CustomerProfileView
      customer={customer}
      history={demoCustomerHistory(id)}
      allTags={demoTags()}
      segments={segments}
      basePath="/demo"
      readOnly
    />
  );
}
