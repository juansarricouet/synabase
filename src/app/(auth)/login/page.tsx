"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { api } from "@/lib/client";

/** Mismo alto y radio que los botones de la landing. */
const FIELD = "h-12 rounded-xl text-[15px]";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api("/api/auth/login", { body: { email, password } });
      router.push("/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos iniciar sesión");
      setLoading(false);
    }
  }

  return (
    <div className="stagger">
      <div>
        <p className="font-display text-[13px] font-bold tracking-tight text-coral">Iniciar sesión</p>
        {/* El titular entra línea por línea, igual que en la landing */}
        <h1 className="display-title mt-3 text-[34px] sm:text-[38px]">
          <span className="line-mask" style={{ ["--i" as string]: 0 }}>
            <span>Bienvenido</span>
          </span>
          <span className="line-mask" style={{ ["--i" as string]: 1 }}>
            <span>de nuevo</span>
          </span>
        </h1>
        <p className="body-copy mt-3.5 text-[15px] text-inkblack/55">
          Entrá a tu panel para ver cómo crece tu base de clientes.
        </p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-3.5">
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vos@tucomercio.com"
            autoComplete="email"
            className={FIELD}
            required
            autoFocus
          />
        </Field>
        <Field label="Contraseña">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className={FIELD}
            required
          />
        </Field>

        {error && (
          <p className="rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-[13px] font-medium leading-relaxed text-danger-600 animate-fade-in">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="coral"
          loading={loading}
          className="sheen h-12! w-full rounded-xl text-[15px]"
        >
          Iniciar sesión
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-[11.5px] text-inkblack/30">
        <span className="h-px flex-1 bg-inkblack/10" />o<span className="h-px flex-1 bg-inkblack/10" />
      </div>

      {/* La demo no necesita cuenta ni base de datos: es un enlace, no un
          formulario que pueda fallar. */}
      <Link
        href="/demo"
        className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-inkblack/15 bg-white text-[14.5px] font-bold text-inkblack transition-all hover:border-inkblack/35"
      >
        <Eye className="size-4 text-coral" />
        Recorrer la demo sin registrarme
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>

      <p className="mt-8 text-center text-[14px] text-inkblack/50">
        ¿Todavía no tenés cuenta?{" "}
        <Link href="/register" className="font-bold text-coral transition-colors hover:text-coral-600">
          Creala gratis
        </Link>
      </p>
    </div>
  );
}
