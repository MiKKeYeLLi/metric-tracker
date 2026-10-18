export type DirectoryStatus = "Live" | "Pending review" | "Needs changes" | "Rejected" | "Not submitted";
export type Priority = "High" | "Medium" | "Low";

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  isDefault: boolean;
  position: number;
}

/** A directory as `/api/directories` returns it. Dates are `YYYY-MM-DD`. */
export interface DirectoryItem {
  id: string;
  name: string;
  website: string;
  status: DirectoryStatus;
  priority: Priority;
  dateSubmitted: string | null;
  listingUrl: string | null;
  notes: string | null;
  checklist: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export type DirectoryInput = {
  name: string;
  website: string;
  status: DirectoryStatus;
  priority: Priority;
  dateSubmitted: string | null;
  listingUrl: string | null;
  notes: string | null;
};

export interface DirectoryActivity {
  id: string;
  directoryId: string | null;
  directoryName: string;
  message: string;
  status: DirectoryStatus | null;
  createdAt: string;
}
