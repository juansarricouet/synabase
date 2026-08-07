import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { demoForms, getDemoBusiness } from "@/server/demo-data";
import { FormBuilder } from "@/app/app/formularios/[id]/FormBuilder";

export default async function DemoFormBuilderPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await props.params;
  const { tab } = await props.searchParams;
  const form = demoForms().find((f) => f.id === id);
  if (!form) notFound();
  const business = getDemoBusiness();

  return (
    <div>
      <Link href="/demo/formularios" className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-500 transition-colors hover:text-ink-900">
        <ArrowLeft className="size-3.5" />
        Formularios
      </Link>
      <FormBuilder
        initialForm={form}
        business={{ name: business.name, logo_url: business.logo_url }}
        initialTab={tab === "qr" ? "qr" : tab === "diseno" ? "diseno" : "preguntas"}
      />
    </div>
  );
}
