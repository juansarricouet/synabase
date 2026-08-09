import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getAdminUser } from "@/server/admin-guard";
import { adminEmails } from "@/server/billing-config";
import { listAllBusinesses } from "@/server/services/billing";
import { ToastProvider } from "@/components/ui/Toast";
import { AdminView } from "./AdminView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Administración",
  robots: { index: false, follow: false },
};

/**
 * Panel interno: todos los comercios, su plan y los pagos por confirmar.
 *
 * Devuelve 404 —y no 403— a quien no está en la lista de administración: un 403
 * confirmaría que la ruta existe y que hay algo detrás.
 */
export default async function AdminPage() {
  const admin = await getAdminUser();
  if (!admin) notFound();

  const businesses = await listAllBusinesses();
  const soloUno = adminEmails().length === 1;

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-offwhite font-sans text-inkblack antialiased">
        <header className="border-b border-inkblack/8 bg-white">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-inkblack text-white">
                <ShieldCheck className="size-4.5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="font-display text-[17px] font-extrabold tracking-tight text-inkblack">
                  Administración
                </p>
                <p className="text-[12px] text-inkblack/45">
                  {admin.email}
                  {soloUno && " · único acceso"}
                </p>
              </div>
            </div>
            <Link
              href="/app"
              className="group inline-flex items-center gap-2 rounded-lg border border-inkblack/12 px-3.5 py-2 text-[13px] font-medium text-inkblack/60 transition-colors hover:border-inkblack/30 hover:text-inkblack"
            >
              <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
              Ir a mi panel
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1240px] px-6 py-8">
          <AdminView businesses={businesses} />
        </main>
      </div>
    </ToastProvider>
  );
}
