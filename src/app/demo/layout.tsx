import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye } from "lucide-react";
import { getDemoBusiness, getDemoUserName } from "@/server/demo-data";
import { ToastProvider } from "@/components/ui/Toast";
import { AppShell } from "@/components/shell/AppShell";
import { DemoModeProvider } from "@/components/demo/DemoMode";

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

  return (
    <DemoModeProvider>
      <ToastProvider>
        {/* Barra fija de alto conocido (DEMO_BAR_H): el panel se corre esa
            misma cantidad para que la barra no le tape el encabezado. */}
        <div className="fixed inset-x-0 top-0 z-50 flex h-11 items-center justify-between gap-3 overflow-hidden bg-inkblack px-4 text-[12.5px] text-white/80">
          <Link
            href="/"
            className="group inline-flex shrink-0 items-center gap-1.5 font-medium text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            Volver al inicio
          </Link>
          <span className="hidden items-center gap-1.5 font-medium text-white sm:inline-flex">
            <Eye className="size-3.5 text-coral" />
            Estás viendo una demostración
            <span className="hidden text-white/45 lg:inline">· datos de ejemplo, no se guarda nada</span>
          </span>
          <Link
            href="/register"
            className="group inline-flex shrink-0 items-center gap-1.5 rounded-full bg-coral px-3 py-1 text-[12px] font-semibold text-white transition hover:bg-coral-600"
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
          /* El formulario público sale de la base de datos, que la demo no usa:
             sin slug, el panel lateral no ofrece un enlace que daría error. */
          mainFormSlug={null}
        >
          {children}
        </AppShell>
      </ToastProvider>
    </DemoModeProvider>
  );
}
