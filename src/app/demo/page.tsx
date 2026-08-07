import { demoDashboardStats, demoForms, getDemoUserName } from "@/server/demo-data";
import { DashboardView } from "@/components/views/DashboardView";

export default function DemoDashboardPage() {
  const name = getDemoUserName();
  return (
    <DashboardView
      stats={demoDashboardStats()}
      mainForm={demoForms().find((f) => !f.is_template)}
      firstName={name.split(" ")[0] ?? name}
      basePath="/demo"
    />
  );
}
