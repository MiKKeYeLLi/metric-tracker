import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignInButton, SignOutButton } from "@/components/AuthButtons";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className="min-h-screen p-[clamp(12px,2vw,28px)] max-[800px]:p-3">
      <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(390px,.85fr)] min-h-[calc(100vh-clamp(24px,4vw,56px))] overflow-hidden border border-line rounded-2xl bg-sheet animate-settle-in max-[800px]:grid-cols-1 max-[800px]:rounded-[14px]">
        <section className="auth-intro">
          <div className="relative z-[1] max-w-[660px]">
            <h1 className="max-w-[10ch] m-0 text-ink [font-size:clamp(52px,6.8vw,96px)] font-extrabold tracking-[-0.05em] leading-[0.92] [text-wrap:balance] max-[800px]:[font-size:clamp(46px,13vw,72px)] max-[800px]:max-w-[9ch]">
              Marketing Metrics Tracker
            </h1>
          </div>
        </section>

        <section className="grid items-center bg-sheet [padding:clamp(36px,6vw,100px)] max-[800px]:[padding:54px_28px]">
          {session?.user ? (
            <div className="w-[min(100%,360px)] mx-auto">
              <p className="m-0 mb-7 text-muted text-[15px] leading-[1.65]">
                Signed in as{" "}
                <strong className="text-ink font-semibold">{session.user.email}</strong>
              </p>
              <SignOutButton />
            </div>
          ) : (
            <div className="w-[min(100%,360px)] mx-auto">
              <p className="m-0 mb-7 text-muted text-[15px] leading-[1.65]">Sign in to continue.</p>
              <SignInButton />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
