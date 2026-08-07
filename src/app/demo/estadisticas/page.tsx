import { demoAnalytics, getDemoBusiness } from "@/server/demo-data";
import { AnalyticsView } from "@/components/views/AnalyticsView";

export default function DemoAnalyticsPage() {
  return <AnalyticsView a={demoAnalytics()} businessName={getDemoBusiness().name} basePath="/demo" />;
}
