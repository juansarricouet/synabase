import { requireTenant } from "@/server/guard";
import { getCustomerFacts } from "@/server/services/customers";
import { PageHeader } from "@/components/shell/PageHeader";
import { UsageWarning } from "@/components/PlanGate";
import { avisoDeUso } from "@/server/plan-limits";
import { CustomersTable, type CustomerRow } from "./CustomersTable";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const tenant = await requireTenant();
  const facts = await getCustomerFacts(tenant.business.id);

  const rows: CustomerRow[] = facts.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    gender: c.gender,
    age: c.age,
    origin: c.origin,
    visits: c.visits,
    first_visit_at: c.first_visit_at,
    last_visit_at: c.last_visit_at,
    favorite_product: c.favorite_product,
    total_spent: c.total_spent,
    tags: c.tags,
  }));

  const uso = await avisoDeUso(tenant.business.id, tenant.business.plan);

  return (
    <div>
      <UsageWarning uso={uso} plan={tenant.business.plan} />
      <PageHeader
        title="Clientes"
        hint="Cada fila es una persona que escaneó tu QR. Entrá a una ficha para ver todas sus visitas, qué consume y hace cuánto no viene."
        description={`${rows.length} personas en tu base. Cada una con su historia de consumo.`}
      />
      <CustomersTable rows={rows} />
    </div>
  );
}
