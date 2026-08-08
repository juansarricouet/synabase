"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { api } from "@/lib/client";

/** Mismo alto y radio que los botones de la landing. */
const FIELD = "h-12 rounded-xl text-[15px]";

const PERKS = ["Sin tarjeta", "Tu QR en dos minutos", "El plan Free no vence"];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api("/api/auth/register", { body: { name, email, password } });
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos crear tu cuenta");
      setLoading(false);
    }
  }

  return (
    <div className="stagger">
      <div>
        <p className="font-display text-[13px] font-bold tracking-tight text-coral">Crear cuenta</p>
        {/* El titular entra línea por línea, igual que en la landing */}
        <h1 className="display-title mt-3 text-[34px] sm:text-[38px]">
          <span className="line-mask" style={{ ["--i" as string]: 0 }}>
            <span>Empezá a conocer</span>
          </span>
          <span className="line-mask" style={{ ["--i" as string]: 1 }}>
            <span>a tus clientes</span>
          </span>
        </h1>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
          {PERKS.map((p) => (
            <li key={p} className="flex items-center gap-1.5 text-[13px] text-inkblack/55">
              <Check className="size-3.5 shrink-0 text-coral" strokeWidth={3} />
              {p}
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-3.5">
        <Field label="Tu nombre">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej.: Martina López"
            autoComplete="name"
            className={FIELD}
            required
            autoFocus
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vos@tucomercio.com"
            autoComplete="email"
            className={FIELD}
            required
          />
        </Field>
        <Field label="Contraseña" hint="Mínimo 8 caracteres.">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            className={FIELD}
            minLength={8}
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
          className="sheen group h-12! w-full rounded-xl text-[15px]"
        >
          Crear mi cuenta
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </form>

      <p className="mt-8 text-center text-[14px] text-inkblack/50">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-bold text-coral transition-colors hover:text-coral-600">
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
}
