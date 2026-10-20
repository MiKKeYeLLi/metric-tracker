/** Placeholder list. Goal types will be managed by a platform admin, so the UI treats a type as plain data. */
export const GOAL_TYPES = ["SEO", "Content", "Research", "Lead hunting", "Press"];

export type Goal = {
  id: string;
  title: string;
  type: string;
  description: string;
  createdBy: string;
  createdAt: string;
  workstreams: number;
  pendingIdeas: number;
  openTasks: number;
  approvedTasks: number;
  totalTasks: number;
  pointsReleased: number;
};

export const DEMO_GOALS: Goal[] = [
  {
    id: "goal_seo",
    title: "Make Zedu SEO compliant",
    type: "SEO",
    description: "Fix on-page issues across the marketing site so every page passes the SEO checker.",
    createdBy: "Abraham Bishop",
    createdAt: "2026-10-14T09:00:00.000Z",
    workstreams: 3,
    pendingIdeas: 2,
    openTasks: 5,
    approvedTasks: 7,
    totalTasks: 14,
    pointsReleased: 210,
  },
  {
    id: "goal_content",
    title: "Get really good at content production",
    type: "Content",
    description: "Publish a steady stream of articles about how travel and work are changing.",
    createdBy: "Abraham Bishop",
    createdAt: "2026-10-15T11:30:00.000Z",
    workstreams: 2,
    pendingIdeas: 4,
    openTasks: 3,
    approvedTasks: 2,
    totalTasks: 8,
    pointsReleased: 90,
  },
  {
    id: "goal_leads",
    title: "Build a bootcamp contacts list",
    type: "Lead hunting",
    description: "Find coding bootcamps and their programme leads so we can pitch Zedu to them.",
    createdBy: "Ada Okafor",
    createdAt: "2026-10-17T08:15:00.000Z",
    workstreams: 1,
    pendingIdeas: 1,
    openTasks: 4,
    approvedTasks: 0,
    totalTasks: 4,
    pointsReleased: 0,
  },
  {
    id: "goal_press",
    title: "Land Zedu in three tech publications",
    type: "Press",
    description: "Pitch launch stories to African tech outlets and track who responds.",
    createdBy: "Tunde Bello",
    createdAt: "2026-10-19T14:45:00.000Z",
    workstreams: 0,
    pendingIdeas: 3,
    openTasks: 0,
    approvedTasks: 0,
    totalTasks: 0,
    pointsReleased: 0,
  },
];
