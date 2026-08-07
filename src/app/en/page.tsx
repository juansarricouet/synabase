import { Landing } from "@/components/landing/Landing";
import { COPY } from "@/lib/landing-copy";

export const metadata = {
  title: COPY.en.meta.title,
  description: COPY.en.meta.description,
  alternates: { languages: { es: "/", en: "/en" } },
};

export default function LandingPageEn() {
  return <Landing lang="en" />;
}
