import { demoForms, demoSubmissions, demoTotalCustomers, demoWhatsappThisMonth, getDemoBusiness, getDemoUserName } from "@/server/demo-data";
import { PageHeader } from "@/components/shell/PageHeader";
import { SettingsView } from "@/app/app/ajustes/SettingsView";

export default function DemoSettingsPage() {
  const business = getDemoBusiness();
  return (
    <div>
      <PageHeader title="Ajustes" description="El perfil de tu comercio, tu equipo y tu suscripción." />
      <SettingsView
        business={business}
        role="owner"
        currentUserId="demo"
        members={[
          { membership_id: "m1", user_id: "demo", name: getDemoUserName(), email: "demo@synapbase.app", role: "owner", joined_at: business.created_at },
          { membership_id: "m2", user_id: "demo2", name: "Julián Paz", email: "julian@cafemartina.com", role: "admin", joined_at: business.created_at },
        ]}
        invitations={[{ id: "i1", email: "caja@cafemartina.com", role: "miembro", token: "demo", status: "pending", created_at: business.created_at }]}
        usage={{
          customers: demoTotalCustomers(),
          forms: demoForms().filter((f) => !f.is_template).length,
          submissions: demoSubmissions().length,
          whatsappThisMonth: demoWhatsappThisMonth(),
        }}
      />
    </div>
  );
}
