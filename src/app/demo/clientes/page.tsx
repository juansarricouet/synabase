import { demoCustomerFacts } from "@/server/demo-data";
import { PageHeader } from "@/components/shell/PageHeader";
import { CustomersTable, type CustomerRow } from "@/app/app/clientes/CustomersTable";

export default function DemoCustomersPage() {
  const rows: CustomerRow[] = demoCustomerFacts().map((c) => ({
    id: c.id, name: c.name, phone: c.phone, email: c.email, gender: c.gender, age: c.age,
    visits: c.visits, first_visit_at: c.first_visit_at, last_visit_at: c.last_visit_at,
    favorite_product: c.favorite_product, total_spent: c.total_spent, tags: c.tags,
  }));
  return (
    <div>
      <PageHeader title="Clientes" description={`${rows.length} personas en tu base. Cada una con su historia de consumo.`} />
      <CustomersTable rows={rows} basePath="/demo" />
    </div>
  );
}
