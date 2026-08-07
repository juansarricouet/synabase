"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  Database,
  ExternalLink,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Send,
  Settings,
  Target,
  Users,
  Check,
  ChevronsUpDown,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/client";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/ui/misc";
import type { Business, Role } from "@/lib/types";
import type { SessionUser } from "@/server/auth";

const navItems = (base: string) => [
  { href: base, label: "Panel", icon: LayoutDashboard, exact: true },
  { href: `${base}/clientes`, label: "Clientes", icon: Users },
  { href: `${base}/base`, label: "Base de datos", icon: Database },
  { href: `${base}/formularios`, label: "Formularios y QR", icon: ClipboardList },
  { href: `${base}/segmentos`, label: "Segmentos", icon: Target },
  { href: `${base}/campanas`, label: "Campañas", icon: Send },
  { href: `${base}/estadisticas`, label: "Estadísticas", icon: BarChart3 },
  { href: `${base}/ajustes`, label: "Ajustes", icon: Settings },
];

const PLAN_LABELS: Record<string, string> = { free: "Plan Free", pro: "Plan Pro", business: "Plan Business" };

interface Props {
  user: SessionUser;
  business: Business;
  role: Role;
  memberships: { business_id: string; business_name: string; role: Role }[];
  mainFormSlug: string | null;
  children: React.ReactNode;
  /** Panel de demostración público: sin sesión, navegación bajo /demo. */
  demo?: boolean;
}

export function AppShell({ user, business, role, memberships, mainFormSlug, children, demo = false }: Props) {
  const basePath = demo ? "/demo" : "/app";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await api("/api/auth/logout", { body: {} });
    router.push("/login");
    router.refresh();
  }

  async function switchBusiness(id: string) {
    if (id === business.id) return;
    await api("/api/auth/switch", { body: { businessId: id } });
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pb-2 pt-5">
        <Link href={basePath}>
          <Logo />
        </Link>
        <button className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 lg:hidden" onClick={() => setMobileOpen(false)}>
          <X className="size-4.5" />
        </button>
      </div>

      {/* Selector de comercio */}
      <div className="relative px-3.5 pt-3">
        <button
          onClick={() => !demo && setSwitcherOpen((v) => !v)}
          className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-2.5 text-left shadow-card transition hover:border-ink-300"
        >
          {business.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logo_url} alt="" className="size-7 rounded-lg object-cover" />
          ) : (
            <span
              className="flex size-7 items-center justify-center rounded-lg text-[13px] font-bold text-white"
              style={{ background: business.brand_color }}
            >
              {business.name[0]?.toUpperCase()}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-ink-950">{business.name}</span>
            <span className="block text-[11px] text-ink-400">{PLAN_LABELS[business.plan] ?? business.plan}</span>
          </span>
          {!demo && <ChevronsUpDown className="size-3.5 shrink-0 text-ink-400" />}
        </button>
        {switcherOpen && !demo && (
          <div className="absolute inset-x-3.5 z-30 mt-1.5 overflow-hidden rounded-xl border border-line bg-white p-1 shadow-pop animate-scale-in">
            {memberships.map((m) => (
              <button
                key={m.business_id}
                onClick={() => {
                  setSwitcherOpen(false);
                  void switchBusiness(m.business_id);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-ink-700 hover:bg-ink-50"
              >
                <span className="flex-1 truncate">{m.business_name}</span>
                {m.business_id === business.id && <Check className="size-3.5 text-brand-600" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3.5">
        {navItems(basePath).map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group relative flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13.5px] font-medium transition-all duration-200",
                active
                  ? "bg-white text-ink-950 shadow-[0_1px_3px_rgb(23_23_28/0.07),0_0_0_1px_rgb(23_23_28/0.05)]"
                  : "text-ink-500 hover:translate-x-0.5 hover:bg-ink-100/60 hover:text-ink-900",
              )}
            >
              {/* Barra que crece a la izquierda del ítem abierto */}
              <span
                className={cn(
                  "absolute left-0 top-1/2 w-0.5 -translate-y-1/2 rounded-full bg-brand-600 transition-all duration-300",
                  active ? "h-4 opacity-100" : "h-0 opacity-0",
                )}
              />
              <item.icon
                className={cn(
                  "size-[17px] transition-all duration-200",
                  active ? "text-brand-600" : "text-ink-400 group-hover:scale-110 group-hover:text-ink-600",
                )}
                strokeWidth={active ? 2 : 1.75}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {mainFormSlug && (
        <div className="mx-3.5 mb-3 rounded-xl border border-brand-200/70 bg-brand-50 p-3.5">
          <p className="text-[12px] font-semibold text-brand-900">Tu formulario está activo</p>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-brand-800/70">
            Probalo como lo ven tus clientes.
          </p>
          <a
            href={`/f/${mainFormSlug}`}
            target="_blank"
            className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-700 hover:text-brand-600"
          >
            Abrir formulario
            <ExternalLink className="size-3" />
          </a>
        </div>
      )}

      <div className="border-t border-line px-3.5 py-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
          <Avatar name={user.name} size={30} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-ink-900">{user.name}</span>
            <span className="block truncate text-[11px] text-ink-400">
              {demo ? "Cuenta de ejemplo" : role === "owner" ? "Propietario" : role === "admin" ? "Administrador" : "Miembro"}
            </span>
          </span>
          {demo ? (
            <Link
              href="/"
              title="Volver al sitio"
              className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
            >
              <Home className="size-4" />
            </Link>
          ) : (
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
            >
              <LogOut className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  /* La demo agrega una barra fija de 44px arriba de todo: el panel entero
     arranca esa altura más abajo para que no le tape nada. */
  const offset = demo ? "top-11" : "top-0";

  return (
    <div className={cn("flex min-h-dvh bg-canvas", demo && "pt-11")}>
      {/* Sidebar escritorio */}
      <aside className={cn("fixed bottom-0 left-0 z-30 hidden w-[248px] border-r border-line bg-canvas lg:block", offset)}>
        {sidebar}
      </aside>

      {/* Sidebar móvil */}
      {mobileOpen && (
        <div className={cn("fixed inset-x-0 bottom-0 z-40 lg:hidden", offset)}>
          <div className="absolute inset-0 bg-ink-950/30 backdrop-blur-[2px] animate-fade-in" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[280px] border-r border-line bg-canvas shadow-modal animate-slide-in">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1 lg:pl-[248px]">
        {/* Barra superior móvil */}
        <div className={cn("sticky z-20 flex h-14 items-center gap-3 border-b border-line bg-canvas/90 px-4 backdrop-blur lg:hidden", offset)}>
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-ink-600 hover:bg-ink-100">
            <Menu className="size-5" />
          </button>
          <Logo compact />
          <span className="text-sm font-semibold text-ink-900">{business.name}</span>
        </div>
        <main className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-7 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
