import { Hint } from "@/components/ui/Hint";

export function PageHeader({
  title,
  description,
  hint,
  actions,
}: {
  title: string;
  description?: string;
  /** Explicación de para qué sirve la sección, en la viñeta del título. */
  hint?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 animate-fade-up">
      <div>
        <h1 className="font-display flex items-center gap-2 text-[23px] font-extrabold tracking-[-0.028em] text-ink-950">
          {title}
          {hint && <Hint side="bottom">{hint}</Hint>}
        </h1>
        {description && <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}
