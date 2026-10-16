import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignInButton, SignOutButton } from "@/components/AuthButtons";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className="min-h-screen p-3 md:p-[clamp(12px,2vw,28px)]">
      <div className="grid min-h-[calc(100vh-24px)] animate-settle-in overflow-hidden rounded-[14px] border bg-card md:min-h-[calc(100vh-clamp(24px,4vw,56px))] md:grid-cols-[minmax(0,1.15fr)_minmax(390px,0.85fr)] md:rounded-2xl">
        <section className="relative grid min-h-[min(54vh,480px)] place-items-[end_start] overflow-hidden bg-brand-wash px-7 py-12 md:min-h-165 md:place-items-center md:p-[clamp(34px,6vw,96px)]">
          <span
            aria-hidden="true"
            className="absolute top-6.5 left-7 size-4.5 rounded-[5px] bg-primary md:top-[clamp(28px,5vw,70px)] md:left-[clamp(28px,5vw,70px)]"
          />
          <span
            aria-hidden="true"
            className="absolute -right-24 -bottom-37 aspect-square w-77.5 rounded-full border-53 border-brand-wash-strong opacity-95 md:-right-[14vw] md:-bottom-[19vw] md:w-[min(60vw,740px)] md:border-[length:clamp(60px,9vw,128px)]"
          />
          <div className="relative z-1 max-w-165">
            <h1 className="m-0 max-w-[9ch] text-[clamp(46px,13vw,72px)] leading-[0.92] font-extrabold tracking-[-0.05em] text-balance text-foreground md:max-w-[10ch] md:text-[clamp(52px,6.8vw,96px)]">
              Marketing Metrics Tracker
            </h1>
          </div>
        </section>
        <section className="grid items-center bg-card px-7 py-13.5 md:p-[clamp(36px,6vw,100px)]">
          <div className="m-auto w-full max-w-90">
            <p className="mb-7 text-[15px]/relaxed text-muted-foreground">
              {session?.user ? `Signed in as ${session.user.email}` : "Sign in to continue."}
            </p>
            {session?.user ? <SignOutButton /> : <SignInButton />}
          </div>
        </section>
      </div>
    </main>
  );
}
