"use server";

import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SeoCheckError } from "@/lib/seo/errors";
import { runSeoCheck } from "@/lib/seo/run";
import { buildView, getViewById, type SeoView } from "./data";

export type ActionResult = { ok: true; view: SeoView } | { ok: false; error: string };

const input = z.object({
  url: z.string().trim().min(1, "Enter a page address.").max(2048, "That address is too long."),
});

// 10 checks per user per minute. In memory, so per server instance: fine for version one.
const hits = new Map<string, number[]>();
function limited(userId: string): boolean {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < 60_000);
  const over = recent.length >= 10;
  if (!over) recent.push(now);
  hits.set(userId, recent);
  return over;
}

async function currentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function runCheck(raw: { url: string }): Promise<ActionResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Please sign in to run a check." };

  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a page address." };

  if (limited(userId)) return { ok: false, error: "You’re running checks too quickly. Wait a minute and try again." };

  try {
    const report = await runSeoCheck(parsed.data.url);
    const row = await prisma.seoCheck.create({
      data: {
        url: report.requestedUrl,
        normalizedUrl: report.normalizedUrl,
        score: report.score,
        categoryScores: report.categoryScores as object,
        snapshot: report.snapshot as object,
        results: report.results as object[],
        errorCount: report.errorCount,
        createdById: userId,
      },
    });
    return { ok: true, view: await buildView(row) };
  } catch (err) {
    if (err instanceof SeoCheckError) return { ok: false, error: err.message };
    console.error("SEO check failed", err);
    return { ok: false, error: "Something went wrong running that check. Please try again." };
  }
}

/** Open an earlier saved check from the history list. */
export async function openCheck(id: string): Promise<ActionResult> {
  if (!(await currentUserId())) return { ok: false, error: "Please sign in." };
  const view = await getViewById(id);
  return view ? { ok: true, view } : { ok: false, error: "That check no longer exists." };
}
