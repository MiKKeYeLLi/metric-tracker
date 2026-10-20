/** Placeholder list. Goal types will be managed by a platform admin, so the UI treats a type as plain data. */
export const GOAL_TYPES = ["SEO", "Content", "Research", "Lead hunting", "Press"];

export type DemoUser = { id: string; name: string };

export type Goal = {
  id: string;
  title: string;
  type: string;
  description: string;
  ownerId: string;
  ownerName: string;
  createdAt: string;
};

export type Agent = {
  id: string;
  name: string;
  speciality: string;
  ownerName: string;
};

export type IdeaStatus = "proposed" | "accepted" | "rejected";

/** An idea an agent proposed under a goal. Once accepted it is a workstream, so the task roll-ups live here too. */
export type Idea = {
  id: string;
  goalId: string;
  agentId: string;
  title: string;
  description: string;
  proposedAt: string;
  status: IdeaStatus;
  decidedBy?: string;
  decidedAt?: string;
  rejectionReason?: string;
  openTasks: number;
  approvedTasks: number;
  totalTasks: number;
  pointsReleased: number;
};

export type GoalSummary = {
  workstreams: number;
  pendingIdeas: number;
  openTasks: number;
  approvedTasks: number;
  totalTasks: number;
  pointsReleased: number;
};

export function summarizeGoal(goalId: string, ideas: Idea[]): GoalSummary {
  const own = ideas.filter((idea) => idea.goalId === goalId);
  const workstreams = own.filter((idea) => idea.status === "accepted");
  const sum = (key: "openTasks" | "approvedTasks" | "totalTasks" | "pointsReleased") =>
    workstreams.reduce((total, idea) => total + idea[key], 0);

  return {
    workstreams: workstreams.length,
    pendingIdeas: own.filter((idea) => idea.status === "proposed").length,
    openTasks: sum("openTasks"),
    approvedTasks: sum("approvedTasks"),
    totalTasks: sum("totalTasks"),
    pointsReleased: sum("pointsReleased"),
  };
}

export const DEMO_AGENTS: Agent[] = [
  { id: "agent_scout", name: "SEO Scout", speciality: "Technical SEO", ownerName: "Ada Okafor" },
  { id: "agent_quill", name: "Quill", speciality: "Long-form content", ownerName: "Tunde Bello" },
  { id: "agent_hunter", name: "Lead Hunter", speciality: "Lead research", ownerName: "Chioma Eze" },
  { id: "agent_wire", name: "Newswire", speciality: "Press outreach", ownerName: "Ada Okafor" },
];

/** The first goal belongs to whoever is signed in, so the demo shows both the owner's and a viewer's view. */
export function demoGoals(currentUser: DemoUser): Goal[] {
  return [
    {
      id: "goal_seo",
      title: "Make Zedu SEO compliant",
      type: "SEO",
      description: "Fix on-page issues across the marketing site so every page passes the SEO checker.",
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      createdAt: "2026-10-14T09:00:00.000Z",
    },
    {
      id: "goal_content",
      title: "Get really good at content production",
      type: "Content",
      description: "Publish a steady stream of articles about how travel and work are changing.",
      ownerId: "user_tunde",
      ownerName: "Tunde Bello",
      createdAt: "2026-10-15T11:30:00.000Z",
    },
    {
      id: "goal_leads",
      title: "Build a bootcamp contacts list",
      type: "Lead hunting",
      description: "Find coding bootcamps and their programme leads so we can pitch Zedu to them.",
      ownerId: "user_ada",
      ownerName: "Ada Okafor",
      createdAt: "2026-10-17T08:15:00.000Z",
    },
    {
      id: "goal_press",
      title: "Land Zedu in three tech publications",
      type: "Press",
      description: "Pitch launch stories to African tech outlets and track who responds.",
      ownerId: "user_chioma",
      ownerName: "Chioma Eze",
      createdAt: "2026-10-19T14:45:00.000Z",
    },
  ];
}

const noTasks = { openTasks: 0, approvedTasks: 0, totalTasks: 0, pointsReleased: 0 };

export function demoIdeas(currentUser: DemoUser): Idea[] {
  return [
    {
      id: "idea_onpage",
      goalId: "goal_seo",
      agentId: "agent_scout",
      title: "On-page SEO",
      description: "Fix titles, meta descriptions, H1s and image alt text on every marketing page.",
      proposedAt: "2026-10-14T12:10:00.000Z",
      status: "accepted",
      decidedBy: currentUser.name,
      decidedAt: "2026-10-14T15:00:00.000Z",
      openTasks: 3,
      approvedTasks: 5,
      totalTasks: 9,
      pointsReleased: 150,
    },
    {
      id: "idea_technical",
      goalId: "goal_seo",
      agentId: "agent_scout",
      title: "Technical SEO",
      description: "Sitemap, robots.txt, canonical tags and page speed fixes.",
      proposedAt: "2026-10-15T09:20:00.000Z",
      status: "accepted",
      decidedBy: currentUser.name,
      decidedAt: "2026-10-15T10:05:00.000Z",
      openTasks: 2,
      approvedTasks: 2,
      totalTasks: 5,
      pointsReleased: 60,
    },
    {
      id: "idea_schema",
      goalId: "goal_seo",
      agentId: "agent_scout",
      title: "Structured data for every page",
      description: "Add schema.org markup (Organization, Article, FAQ) so search results show rich snippets.",
      proposedAt: "2026-10-20T07:40:00.000Z",
      status: "proposed",
      ...noTasks,
    },
    {
      id: "idea_backlinks",
      goalId: "goal_seo",
      agentId: "agent_quill",
      title: "Backlinks from bootcamp blogs",
      description: "Write guest posts for coding bootcamp blogs that link back to Zedu's guides.",
      proposedAt: "2026-10-20T08:55:00.000Z",
      status: "proposed",
      ...noTasks,
    },
    {
      id: "idea_pricing_h1",
      goalId: "goal_seo",
      agentId: "agent_hunter",
      title: "Fix the H1 tag on the pricing page",
      description: "The pricing page has two H1 tags.",
      proposedAt: "2026-10-16T13:30:00.000Z",
      status: "rejected",
      decidedBy: currentUser.name,
      decidedAt: "2026-10-16T16:00:00.000Z",
      rejectionReason: "This is a task, not a workstream. Propose it under On-page SEO.",
      ...noTasks,
    },
    {
      id: "idea_industry",
      goalId: "goal_content",
      agentId: "agent_quill",
      title: "Write content about our industry",
      description: "A weekly series on how remote work and travel are changing business.",
      proposedAt: "2026-10-15T14:00:00.000Z",
      status: "accepted",
      decidedBy: "Tunde Bello",
      decidedAt: "2026-10-15T17:30:00.000Z",
      openTasks: 3,
      approvedTasks: 2,
      totalTasks: 6,
      pointsReleased: 90,
    },
    {
      id: "idea_guides",
      goalId: "goal_content",
      agentId: "agent_quill",
      title: "How-to guides for new users",
      description: "Step-by-step guides that answer the questions new users ask support most.",
      proposedAt: "2026-10-19T10:15:00.000Z",
      status: "proposed",
      ...noTasks,
    },
    {
      id: "idea_bootcamps",
      goalId: "goal_leads",
      agentId: "agent_hunter",
      title: "Nigerian coding bootcamps",
      description: "List bootcamps in Lagos, Abuja and online, with programme leads and contact emails.",
      proposedAt: "2026-10-17T11:00:00.000Z",
      status: "accepted",
      decidedBy: "Ada Okafor",
      decidedAt: "2026-10-17T12:20:00.000Z",
      openTasks: 4,
      approvedTasks: 0,
      totalTasks: 4,
      pointsReleased: 0,
    },
    {
      id: "idea_outlets",
      goalId: "goal_press",
      agentId: "agent_wire",
      title: "Launch story for TechCabal and Techpoint",
      description: "Pitch the Zedu launch as a founder story with usage numbers.",
      proposedAt: "2026-10-19T16:30:00.000Z",
      status: "proposed",
      ...noTasks,
    },
  ];
}

export const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
export const shortDateTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});
