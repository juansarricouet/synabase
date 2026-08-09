"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Mail, MessageCircle, PartyPopper } from "lucide-react";
import { cn, whatsappLink } from "@/lib/utils";
import { validarRespuesta } from "@/lib/answer-validation";
import { api } from "@/lib/client";
import type { Form, Question } from "@/lib/types";

interface PublicBusiness {
  name: string;
  logo_url: string | null;
  /** Para ofrecer el código por WhatsApp al terminar. Puede no estar cargado. */
  phone?: string | null;
}

interface Props {
  form: Form;
  business: PublicBusiness;
  slug: string;
  /** Modo vista previa (constructor): sin llamadas de red */
  preview?: boolean;
  className?: string;
}

interface SubmitResult {
  discount_code: string;
  first_time: boolean;
  customer_name: string;
  code_delivery?: "pantalla" | "email" | "ambos";
  sent_to?: string | null;
  email_sent?: boolean;
}

export function PublicFormFlow({ form, business, slug, preview, className }: Props) {
  const questions = useMemo(() => (form.questions ?? []).filter((q) => q.active), [form.questions]);
  const [step, setStep] = useState(-1); // -1 bienvenida · 0..n-1 preguntas · n listo
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<{ qid: string; valor: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const accent = form.theme.color || "#c73418";

  /* Enlace para que el cliente reciba su código por WhatsApp. En la vista
     previa del constructor no se ofrece: no hay código real que mandar. */
  const waLink =
    result && !preview
      ? whatsappLink(
          business.phone,
          `¡Hola ${business.name}! Soy ${result.customer_name}, completé el formulario. Mi código es ${result.discount_code} 🙌`,
        )
      : null;

  // Registrar el escaneo una sola vez por sesión
  useEffect(() => {
    if (preview) return;
    const key = `sb-scan-${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch(`/api/public/forms/${slug}/scan`, { method: "POST" }).catch(() => {});
  }, [slug, preview]);

  const total = questions.length;
  const current = step >= 0 && step < total ? questions[step]! : null;
  const progress = step < 0 ? 0 : Math.min(1, step / Math.max(total, 1));

  const setValue = useCallback(
    (qid: string, value: unknown) => {
      setAnswers((a) => ({ ...a, [qid]: value }));
      setError(null);
    },
    [],
  );

  /**
   * Revisa la respuesta antes de dejar avanzar.
   *
   * Devuelve además la corrección propuesta cuando parece un error de tipeo,
   * para poder ofrecer el arreglo en un clic en vez de sólo señalar la falla.
   */
  function validate(q: Question, value: unknown): { mensaje: string; sugerencia?: string } | null {
    const empty =
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0);
    if (q.required && empty) return { mensaje: "Esta respuesta es necesaria para continuar" };
    if (!empty && (q.type === "number" || q.type === "scale") && !Number.isFinite(Number(value)))
      return { mensaje: "Ingresá un número válido" };
    if (empty) return null;
    return validarRespuesta(q.maps_to, value);
  }

  const goNext = useCallback(() => {
    if (!current) return;
    const err = validate(current, answers[current.id]);
    if (err) {
      setError(err.mensaje);
      setSuggestion(err.sugerencia ? { qid: current.id, valor: err.sugerencia } : null);
      return;
    }
    setError(null);
    setSuggestion(null);
    if (step < total - 1) setStep(step + 1);
    else void finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, answers, step, total]);

  async function finish() {
    if (preview) {
      setResult({ discount_code: "DEMO-1234", first_time: true, customer_name: "Vista previa" });
      setStep(total);
      return;
    }
    setSubmitting(true);
    try {
      const res = await api<SubmitResult>(`/api/public/forms/${slug}/submit`, {
        body: { answers },
      });
      setResult(res);
      setStep(total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos enviar tus respuestas");
    } finally {
      setSubmitting(false);
    }
  }

  // Enter para avanzar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || step < 0 || step >= total) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") return;
      e.preventDefault();
      goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, step, total]);

  const autoAdvance = useCallback(
    (qid: string, value: unknown) => {
      setValue(qid, value);
      setTimeout(() => {
        setError(null);
        setStep((s) => {
          if (s < total - 1) return s + 1;
          void finish();
          return s;
        });
      }, 260);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setValue, total, answers, preview, slug],
  );

  return (
    <main
      className={cn("relative flex min-h-dvh flex-col overflow-hidden bg-white", className)}
      style={{ ["--pf" as string]: accent }}
    >
      {/* Barra de progreso */}
      <div className="absolute inset-x-0 top-0 z-10 h-1 bg-ink-100">
        <div
          className="h-full rounded-r-full transition-all duration-500 ease-out"
          style={{ width: `${progress * 100}%`, background: accent }}
        />
      </div>

      {/* Fondo suave */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ background: `radial-gradient(600px 400px at 50% -10%, ${accent}, transparent 70%)` }}
      />

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-8 pt-10">
        {/* Encabezado del comercio */}
        <div className="flex items-center justify-center gap-2.5">
          {form.theme.showLogo && business.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logo_url} alt={business.name} className="size-8 rounded-lg object-cover" />
          ) : (
            <span className="flex size-8 items-center justify-center rounded-lg text-lg" style={{ background: `${accent}1a` }}>
              {form.theme.emoji || "👋"}
            </span>
          )}
          <span className="text-sm font-semibold tracking-tight text-ink-800">{business.name}</span>
        </div>

        {/* ————— Bienvenida ————— */}
        {step === -1 && (
          <div key="welcome" className="flex flex-1 flex-col justify-center py-10 text-center animate-fade-up">
            <h1 className="text-balance text-[27px] font-semibold leading-tight tracking-tight text-ink-950">
              {form.welcome_title || `¡Hola! Somos ${business.name}`}
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-balance text-[15px] leading-relaxed text-ink-500">
              {form.welcome_text || "Contanos quién sos y llevate un beneficio. Te toma menos de un minuto."}
            </p>
            <div
              className="mx-auto mt-6 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-raised"
              style={{ background: accent }}
            >
              <PartyPopper className="size-4" />
              {form.incentive}
            </div>
            <button
              onClick={() => setStep(0)}
              className="mx-auto mt-10 flex h-12 items-center gap-2 rounded-2xl bg-ink-950 px-7 text-[15px] font-semibold text-white shadow-pop transition-all duration-200 hover:scale-[1.02] hover:bg-ink-800 active:scale-[0.98]"
            >
              Empezar
              <ArrowRight className="size-4.5" />
            </button>
            <p className="mt-4 text-xs text-ink-400">
              {total} {total === 1 ? "pregunta" : "preguntas"} · menos de 1 minuto
            </p>
          </div>
        )}

        {/* ————— Preguntas ————— */}
        {current && (
          <div key={current.id} className="flex flex-1 flex-col justify-center py-8 animate-slide-in">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
              {step + 1} de {total}
              {!current.required && <span className="ml-2 normal-case tracking-normal">· opcional</span>}
            </p>
            <h2 className="mt-2 text-balance text-[23px] font-semibold leading-snug tracking-tight text-ink-950">
              {current.label}
            </h2>

            <div className="mt-6">
              <QuestionInput
                question={current}
                value={answers[current.id]}
                accent={accent}
                onChange={(v) => setValue(current.id, v)}
                onAuto={(v) => autoAdvance(current.id, v)}
              />
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-danger-100 bg-danger-50 px-3.5 py-2.5 animate-fade-in">
                <p className="text-[13px] font-medium leading-relaxed text-danger-600">{error}</p>
                {/* Si parece un error de tipeo, se ofrece el arreglo en un clic
                    en vez de dejar a la persona corrigiéndolo a mano. */}
                {suggestion && current && suggestion.qid === current.id && (
                  <button
                    onClick={() => {
                      setAnswers((a) => ({ ...a, [suggestion.qid]: suggestion.valor }));
                      setError(null);
                      setSuggestion(null);
                    }}
                    className="mt-2 text-[13px] font-bold underline underline-offset-2"
                    style={{ color: accent }}
                  >
                    Sí, usar {suggestion.valor}
                  </button>
                )}
              </div>
            )}

            <div className="mt-8 flex items-center gap-3">
              {step > 0 ? (
                <button
                  onClick={() => {
                    setError(null);
                    setStep(step - 1);
                  }}
                  className="flex size-11 items-center justify-center rounded-xl border border-line-strong bg-white text-ink-500 transition hover:bg-ink-50"
                  aria-label="Anterior"
                >
                  <ArrowLeft className="size-4.5" />
                </button>
              ) : null}
              <button
                onClick={goNext}
                disabled={submitting}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white shadow-raised transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
                style={{ background: accent }}
              >
                {submitting ? "Enviando…" : step === total - 1 ? "Obtener mi beneficio" : "Continuar"}
                {!submitting && <ArrowRight className="size-4.5" />}
              </button>
            </div>
          </div>
        )}

        {/* ————— Éxito ————— */}
        {step >= total && total > 0 && result && (
          <div key="success" className="flex flex-1 flex-col items-center justify-center py-10 text-center animate-fade-up">
            <div
              className="flex size-16 items-center justify-center rounded-full text-white shadow-pop animate-scale-in"
              style={{ background: accent }}
            >
              <Check className="size-8" strokeWidth={3} />
            </div>
            <h2 className="mt-6 text-balance text-[25px] font-semibold tracking-tight text-ink-950">
              {form.success_title || `¡Gracias, ${result.customer_name.split(" ")[0]}!`}
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-balance text-sm leading-relaxed text-ink-500">
              {form.success_text ||
                (result.code_delivery === "email" && result.email_sent
                  ? "Abrí el mail y mostralo en la caja para usar tu beneficio."
                  : "Mostrá este código en la caja para usar tu beneficio.")}
            </p>

            {/* Con entrega sólo por mail el código no se muestra: si estuviera
                acá, poner una casilla falsa no tendría costo y la verificación
                no serviría de nada. Si el envío falló se muestra igual, para no
                dejar a nadie sin su beneficio por un problema nuestro. */}
            {result.code_delivery === "email" && result.email_sent ? (
              <div className="mt-7 w-full max-w-xs rounded-2xl border-2 border-dashed px-6 py-6" style={{ borderColor: `${accent}66` }}>
                <Mail className="mx-auto size-7" style={{ color: accent }} strokeWidth={1.75} />
                <p className="mt-3 text-[14px] font-semibold text-ink-950">Te mandamos tu código</p>
                <p className="mt-1 break-all text-[12.5px] text-ink-500">{result.sent_to}</p>
                <p className="mt-3 text-[13px] font-medium" style={{ color: accent }}>
                  {form.incentive}
                </p>
              </div>
            ) : (
              <div className="mt-7 w-full max-w-xs rounded-2xl border-2 border-dashed px-6 py-5" style={{ borderColor: `${accent}66` }}>
                <p className="text-[11px] font-medium uppercase tracking-widest text-ink-400">Tu código</p>
                <p className="mt-1 font-mono text-[28px] font-bold tracking-wider text-ink-950">{result.discount_code}</p>
                <p className="mt-1.5 text-[13px] font-medium" style={{ color: accent }}>
                  {form.incentive}
                </p>
              </div>
            )}

            {result.email_sent && result.code_delivery !== "email" && (
              <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-ink-400">
                <Mail className="size-3.5" />
                También te lo mandamos a {result.sent_to}
              </p>
            )}

            {/* El cliente abre el chat: el comercio queda con su número
                verificado y con la conversación iniciada de su lado. */}
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex h-12 w-full max-w-xs items-center justify-center gap-2.5 rounded-xl text-[14.5px] font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: accent }}
              >
                <MessageCircle className="size-4.5" strokeWidth={2} />
                Recibilo por WhatsApp
              </a>
            )}

            <p className="mt-6 text-xs leading-relaxed text-ink-400">
              {result.first_time
                ? "Te registramos. La próxima te reconocemos apenas escanees el QR ✨"
                : "¡Qué bueno verte de nuevo por acá!"}
            </p>
          </div>
        )}
      </div>

      <footer className="relative pb-5 text-center text-[11px] text-ink-300">
        Impulsado por <span className="font-semibold text-ink-400">SynapBase</span>
      </footer>
    </main>
  );
}

/* ————— Inputs por tipo de pregunta ————— */

function QuestionInput({
  question: q,
  value,
  accent,
  onChange,
  onAuto,
}: {
  question: Question;
  value: unknown;
  accent: string;
  onChange: (v: unknown) => void;
  onAuto: (v: unknown) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [q.id]);

  const baseInput =
    "w-full border-0 border-b-2 border-ink-200 bg-transparent pb-2.5 text-lg text-ink-950 outline-none transition-colors placeholder:text-ink-300 focus:border-[var(--pf)]";

  switch (q.type) {
    case "text":
      return (
        <input
          ref={inputRef}
          type={q.maps_to === "email" ? "email" : q.maps_to === "phone" ? "tel" : "text"}
          className={baseInput}
          placeholder={q.placeholder ?? "Escribí tu respuesta…"}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "number":
      return (
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          className={baseInput}
          placeholder={q.placeholder ?? "0"}
          value={(value as string | number) ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
      );
    case "date":
      return (
        <input
          ref={inputRef}
          type="date"
          className={baseInput}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "select": {
      const letters = "ABCDEFGHIJ";
      return (
        <div className="space-y-2">
          {q.options.map((opt, i) => {
            const selected = value === opt;
            return (
              <button
                key={opt}
                onClick={() => onAuto(opt)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[15px] font-medium transition-all duration-150",
                  selected
                    ? "text-ink-950 shadow-raised"
                    : "border-line-strong/70 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50",
                )}
                style={selected ? { borderColor: accent, background: `${accent}0f` } : undefined}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold",
                    selected ? "text-white" : "border-ink-200 text-ink-400",
                  )}
                  style={selected ? { background: accent, borderColor: accent } : undefined}
                >
                  {letters[i] ?? "•"}
                </span>
                {opt}
                {selected && <Check className="ml-auto size-4.5" style={{ color: accent }} />}
              </button>
            );
          })}
        </div>
      );
    }
    case "multiselect": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="flex flex-wrap gap-2">
          {q.options.map((opt) => {
            const on = selected.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => onChange(on ? selected.filter((s) => s !== opt) : [...selected, opt])}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[14px] font-medium transition-all duration-150",
                  on ? "text-white shadow-raised" : "border-line-strong/70 bg-white text-ink-700 hover:border-ink-300",
                )}
                style={on ? { background: accent, borderColor: accent } : undefined}
              >
                {on && <Check className="size-3.5" strokeWidth={3} />}
                {opt}
              </button>
            );
          })}
        </div>
      );
    }
    case "boolean":
      return (
        <div className="grid grid-cols-2 gap-3">
          {[
            ["Sí", true],
            ["No", false],
          ].map(([label, val]) => {
            const on = value === val;
            return (
              <button
                key={String(label)}
                onClick={() => onAuto(val)}
                className={cn(
                  "rounded-xl border py-4 text-lg font-semibold transition-all duration-150",
                  on ? "text-white shadow-raised" : "border-line-strong/70 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50",
                )}
                style={on ? { background: accent, borderColor: accent } : undefined}
              >
                {label as string}
              </button>
            );
          })}
        </div>
      );
    case "scale": {
      const max = q.scale_max ?? 10;
      return (
        <div>
          <div className={cn("grid gap-1.5", max <= 5 ? "grid-cols-5" : "grid-cols-5 sm:grid-cols-10")}>
            {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
              const on = value === n;
              return (
                <button
                  key={n}
                  onClick={() => onAuto(n)}
                  className={cn(
                    "flex h-11 items-center justify-center rounded-lg border text-[15px] font-semibold transition-all duration-150",
                    on ? "text-white shadow-raised" : "border-line-strong/70 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50",
                  )}
                  style={on ? { background: accent, borderColor: accent } : undefined}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-ink-400">
            <span>Para nada</span>
            <span>Totalmente</span>
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}
