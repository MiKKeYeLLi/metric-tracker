"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { DirectoryItem, DirectoryStatus } from "@/types/directory";
import { MOCK_DIRECTORIES } from "@/data/mockDirectories";

export interface ActivityItem {
  id: string;
  directoryName: string;
  actionText: string;
  status: DirectoryStatus;
  timestamp: number;
}

export interface ChecklistState {
  [directoryId: string]: Record<string, boolean>;
}

interface DirectoryContextType {
  directories: DirectoryItem[];
  selectedDirectoryId: string | null;
  setSelectedDirectoryId: (id: string) => void;
  activities: ActivityItem[];
  checklistState: ChecklistState;
  isMounted: boolean;
  addDirectory: (directory: DirectoryItem) => void;
  updateDirectory: (id: string, updates: Partial<DirectoryItem>) => void;
  deleteDirectory: (id: string) => void;
  toggleChecklistItem: (directoryId: string, itemKey: string) => void;
  logActivity: (directoryName: string, actionText: string, status: DirectoryStatus) => void;
}

const DirectoryContext = createContext<DirectoryContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "metric_tracker_directories_v1";
// v2 drops the per-person names the first version stored.
const ACTIVITY_KEY = "metric_tracker_activities_v2";
const CHECKLIST_KEY = "metric_tracker_checklist_v1";

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: "act-1",
    directoryName: "Product Hunt",
    actionText: "Product Hunt went live",
    status: "Live",
    timestamp: Date.now() - 172800000,
  },
  {
    id: "act-2",
    directoryName: "BetaList",
    actionText: "BetaList was submitted and is pending review",
    status: "Pending review",
    timestamp: Date.now() - 691200000,
  },
];

// Same wording as the API's activity log (src/lib/directories.ts), so switching storage keeps the feed consistent.
function statusMessage(name: string, status: DirectoryStatus) {
  switch (status) {
    case "Live":
      return `${name} went live`;
    case "Pending review":
      return `${name} was submitted and is pending review`;
    case "Needs changes":
      return `${name} needs changes`;
    case "Rejected":
      return `${name} was rejected`;
    case "Not submitted":
      return `${name} moved back to the shortlist`;
  }
}

export function DirectoryProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  const [directories, setDirectories] =
    useState<DirectoryItem[]>(MOCK_DIRECTORIES);
  const [selectedDirectoryId, setSelectedDirectoryId] = useState<string | null>(
    null,
  );
  const [activities, setActivities] =
    useState<ActivityItem[]>(DEFAULT_ACTIVITIES);
  const [checklistState, setChecklistState] = useState<ChecklistState>({});

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const savedDirs = localStorage.getItem(STORAGE_KEY);
      if (savedDirs) {
        try {
          const parsed = JSON.parse(savedDirs);
          setDirectories(parsed);
          if (parsed.length > 0) setSelectedDirectoryId(parsed[0].id);
        } catch (e) {
          console.error(e);
        }
      } else if (MOCK_DIRECTORIES.length > 0) {
        setSelectedDirectoryId(MOCK_DIRECTORIES[0].id);
      }

      const savedActs = localStorage.getItem(ACTIVITY_KEY);
      if (savedActs) {
        try {
          setActivities(JSON.parse(savedActs));
        } catch (e) {
          console.error(e);
        }
      }

      const savedChecks = localStorage.getItem(CHECKLIST_KEY);
      if (savedChecks) {
        try {
          setChecklistState(JSON.parse(savedChecks));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(directories));
    }
  }, [directories, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activities));
    }
  }, [activities, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklistState));
    }
  }, [checklistState, isMounted]);

  const logActivity = (directoryName: string, actionText: string, status: DirectoryStatus) => {
    const newActivity: ActivityItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      directoryName,
      actionText,
      status,
      timestamp: Date.now(),
    };
    setActivities((prev) => [newActivity, ...prev]);
  };

  const addDirectory = (newDir: DirectoryItem) => {
    logActivity(
      newDir.name,
      newDir.status === "Not submitted" ? `${newDir.name} added to the shortlist` : `${newDir.name} added as ${newDir.status}`,
      newDir.status,
    );
    setDirectories((prev) => [newDir, ...prev]);
    setSelectedDirectoryId(newDir.id);
  };

  const updateDirectory = (id: string, updates: Partial<DirectoryItem>) => {
    const targetItem = directories.find((d) => d.id === id);
    if (!targetItem) return;

    const updated = { ...targetItem, ...updates };
    if (updates.status && updates.status !== targetItem.status) {
      logActivity(updated.name, statusMessage(updated.name, updates.status), updates.status);
    }

    setDirectories((prev) => prev.map((item) => (item.id === id ? updated : item)));
  };

  const deleteDirectory = (id: string) => {
    const dirToDelete = directories.find((d) => d.id === id);
    if (dirToDelete) {
      logActivity(dirToDelete.name, `${dirToDelete.name} removed from the list`, dirToDelete.status);
    }
    setDirectories((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleChecklistItem = (directoryId: string, itemKey: string) => {
    setChecklistState((prev) => {
      const currentDirChecklist = prev[directoryId] || {
        logo: false,
        screenshots: false,
        tagline: false,
        "long-description": false,
        pricing: false,
      };
      return {
        ...prev,
        [directoryId]: {
          ...currentDirChecklist,
          [itemKey]: !currentDirChecklist[itemKey],
        },
      };
    });
  };

  return (
    <DirectoryContext.Provider
      value={{
        directories,
        selectedDirectoryId,
        setSelectedDirectoryId,
        activities,
        checklistState,
        isMounted,
        addDirectory,
        updateDirectory,
        deleteDirectory,
        toggleChecklistItem,
        logActivity,
      }}
    >
      {children}
    </DirectoryContext.Provider>
  );
}

export function useDirectories() {
  const context = useContext(DirectoryContext);
  if (!context) {
    throw new Error("useDirectories must be used within a DirectoryProvider");
  }
  return context;
}
