export type DirectoryStatus =
  "Live" | "Pending review" | "Needs changes" | "Rejected" | "Not submitted";
export type Priority = "High" | "Medium" | "Low";

export interface DirectoryItem {
  id: string;
  name: string;
  website: string;
  status: DirectoryStatus;
  priority: Priority;
  submittedBy: string;
  dateSubmitted: string;
  listingUrl?: string;
  notes?: string;
}
