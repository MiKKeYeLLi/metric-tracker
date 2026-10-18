import { getLatestView, getSeoPageUrl } from "./data";
import { SeoChecker } from "./SeoChecker";

export const dynamic = "force-dynamic";

export default async function SeoPage() {
  // The dashboard layout already redirects signed-out visitors.
  const [initial, initialUrl] = await Promise.all([getLatestView(), getSeoPageUrl()]);
  return <SeoChecker initial={initial} initialUrl={initialUrl} />;
}
