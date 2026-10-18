import { getLatestView } from "./data";
import { SeoChecker } from "./SeoChecker";

export const dynamic = "force-dynamic";

export default async function SeoPage() {
  // The dashboard layout already redirects signed-out visitors.
  const initial = await getLatestView();
  return <SeoChecker initial={initial} />;
}
