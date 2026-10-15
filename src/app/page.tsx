import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignInButton, SignOutButton } from "@/components/AuthButtons";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-intro">
          <div className="intro-copy">
            <h1 className="auth-title">Marketing Metrics Tracker</h1>
          </div>
        </section>
        <section className="auth-sheet">
          {session?.user ? (
            <div className="signed-in-state">
              <p>Signed in as {session.user.email}</p>
              <SignOutButton />
            </div>
          ) : (
            <div className="sign-in-state">
              <p>Sign in to continue.</p>
              <SignInButton />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
