import { PageContent, PageHeader } from "@/components/PageHeader";
import { getLatestView } from "./data";
import { SeoChecker } from "./SeoChecker";

export const dynamic = "force-dynamic";

export default async function SeoPage() {
  // The dashboard layout already redirects signed-out visitors.
  const initial = await getLatestView();
  return (
    <>
      <PageHeader
        title="SEO checker"
        description="Check how well a single page is set up for search engines. Only the page’s HTML is read, so content added by JavaScript isn’t seen."
      />
      <PageContent>
        <SeoChecker initial={initial} />
      </PageContent>
    </>
  );
}
