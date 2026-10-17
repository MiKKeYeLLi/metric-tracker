import { getLatestView } from "./data";
import { SeoChecker } from "./SeoChecker";

export const dynamic = "force-dynamic";

export default async function SeoPage() {
  // The dashboard layout already redirects signed-out visitors.
  const initial = await getLatestView();
  return (
    <>
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center border-b bg-background/90 px-4 backdrop-blur-sm sm:px-[clamp(20px,4vw,48px)]">
        <h1 className="m-0 text-base leading-none font-bold tracking-[-0.03em] text-foreground">SEO checker</h1>
      </header>
      <div className="px-4 py-6 sm:px-[clamp(20px,4vw,48px)]">
        <SeoChecker initial={initial} />
      </div>
    </>
  );
}
