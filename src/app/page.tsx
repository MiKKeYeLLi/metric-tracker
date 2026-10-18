import Image from "next/image";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { FileTextIcon, FolderOpenIcon, NewspaperIcon, ScanSearchIcon } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { SignInButton } from "@/components/AuthButtons";
import { Wordmark } from "@/components/Wordmark";

export const dynamic = "force-dynamic";

const CHANNELS = [
  { icon: FileTextIcon, label: "Content", detail: "Ideas to published, in one list" },
  { icon: ScanSearchIcon, label: "SEO", detail: "On-page checks with a fix list" },
  { icon: FolderOpenIcon, label: "Directories", detail: "Every listing and its status" },
  { icon: NewspaperIcon, label: "Press", detail: "Coverage, pitches and follow-ups" },
];

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/dashboard");

  return (
    <main className="grid min-h-screen bg-background p-3 md:p-[clamp(12px,2vw,24px)]">
      <div className="grid animate-settle-in grid-rows-[auto_1fr] overflow-hidden rounded-3xl bg-card ring-1 ring-border md:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)] md:grid-rows-1">
        <section className="relative isolate flex flex-col justify-between gap-12 overflow-hidden bg-sidebar px-7 py-8 text-sidebar-foreground md:p-[clamp(32px,5vw,72px)]">
          <span
            aria-hidden="true"
            className="absolute -top-40 -right-40 -z-10 aspect-square w-[min(80vw,620px)] rounded-full bg-primary/35 blur-3xl"
          />
          <span
            aria-hidden="true"
            className="absolute -bottom-48 -left-32 -z-10 aspect-square w-[min(70vw,520px)] rounded-full bg-primary/20 blur-3xl"
          />

          <Wordmark href="/" tone="inverse" />

          <div className="flex max-w-xl flex-col gap-5">
            <h1 className="m-0 text-[clamp(40px,9vw,64px)] leading-[0.98] font-extrabold tracking-[-0.045em] text-balance md:text-[clamp(44px,5.2vw,76px)]">
              Every Zedu growth channel, <span className="text-chart-2">one pulse.</span>
            </h1>
            <p className="m-0 max-w-[46ch] text-[15px]/relaxed text-sidebar-muted-foreground">
              Zedu Amp is where the marketing team tracks content, SEO, directories and press, and sees what is moving.
            </p>
          </div>

          <ul className="m-0 grid list-none grid-cols-1 gap-2.5 p-0 sm:grid-cols-2">
            {CHANNELS.map(({ icon: Icon, label, detail }) => (
              <li key={label} className="flex items-center gap-3 rounded-2xl bg-sidebar-accent px-3.5 py-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold">{label}</span>
                  <span className="block truncate text-xs text-sidebar-muted-foreground">{detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col justify-between gap-10 px-7 py-10 md:p-[clamp(36px,5vw,80px)]">
          <div aria-hidden="true" className="hidden md:block" />
          <div className="mx-auto flex w-full max-w-90 flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="m-0 text-[26px] leading-tight font-extrabold tracking-[-0.035em] text-foreground">
                Sign in to Zedu Amp
              </h2>
              <p className="m-0 text-[14px]/relaxed text-muted-foreground">
                Use your Zedu Google account to continue.
              </p>
            </div>
            <SignInButton />
          </div>
          <p className="m-0 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            A marketing workspace by
            <Image src="/Zedu.png" alt="Zedu" width={58} height={25} className="h-5 w-auto" />
          </p>
        </section>
      </div>
    </main>
  );
}
