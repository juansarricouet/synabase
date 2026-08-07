import Link from "next/link";
import { ArrowRight, Eye } from "lucide-react";
import { getDemoBusiness, getDemoUserName, demoForms } from "@/server/demo-data";
import { ToastProvider } from "@/components/ui/Toast";
import { AppShell } from "@/components/shell/AppShell";

export const metadata = {
  title: "Demo del panel",
  description:
    "Recorré el panel de SynapBase con un comercio de ejemplo: clientes, segmentos, campañas y estadísticas con datos reales.",
};

/**
 * Panel de demostración público: el mismo panel que ve un comercio, pero con
 * datos generados en memoria. No requiere cuenta, sesión ni base de datos.
 */
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const business = getDemoBusiness();
  const mainForm = demoForms().find((f) => f.status === "active");

  return (
    <ToastProvider>
      <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-ink-950 px-4 py-2 text-center text-[12.5px] text-white/80">
        <span className="inline-flex items-center gap-1.5 font-medium text-white">
          <Eye className="size-3.5" />
          Estás viendo una demostración
        </span>
        <span className="hidden text-white/50 sm:inline">
          Datos de ejemplo · nada de lo que hagas se guarda
        </span>
        <Link
          href="/register"
          className="group inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-ink-950 transition hover:bg-white/90"
        >
          Crear mi cuenta
          <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <AppShell
        demo
        user={{ id: "demo", email: "demo@synapbase.app", name: getDemoUserName() }}
        business={business}
        role="owner"
        memberships={[{ business_id: business.id, business_name: business.name, role: "owner" }]}
        mainFormSlug={mainForm?.slug ?? null}
      >
        {children}
      </AppShell>
    </ToastProvider>
  );
}
