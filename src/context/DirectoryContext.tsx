"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { DirectoryItem, DirectoryStatus } from "@/types/directory";
import { MOCK_DIRECTORIES } from "@/data/mockDirectories";

export interface ActivityItem {
  id: string;
  directoryName: string;
  actionText: string;
  owner: string;
  date: string;
  status: DirectoryStatus;
  timeAgo: string;
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
  logActivity: (
    directoryName: string,
    actionText: string,
    owner: string,
    status: DirectoryStatus,
  ) => void;
}

const DirectoryContext = createContext<DirectoryContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "metric_tracker_directories_v1";
const ACTIVITY_KEY = "metric_tracker_activities_v1";
const CHECKLIST_KEY = "metric_tracker_checklist_v1";

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: "act-1",
    directoryName: "Product Hunt",
    actionText: "marked Product Hunt as Live",
    owner: "Denise",
    date: "14 Oct 2026",
    status: "Live",
    timeAgo: "2 days ago",
    timestamp: Date.now() - 172800000,
  },
  {
    id: "act-2",
    directoryName: "BetaList",
    actionText: "submitted BetaList",
    owner: "Rabiah",
    date: "8 Oct 2026",
    status: "Pending review",
    timeAgo: "8 days ago",
    timestamp: Date.now() - 691200000,
  },
];

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

  const logActivity = (
    directoryName: string,
    actionText: string,
    owner: string,
    status: DirectoryStatus,
  ) => {
    const todayFormatted = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date());

    const newActivity: ActivityItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      directoryName,
      actionText,
      owner: owner && owner !== "Nobody yet" ? owner : "Denise",
      date: todayFormatted,
      status,
      timeAgo: "Just now",
      timestamp: Date.now(),
    };
    setActivities((prev) => [newActivity, ...prev]);
  };

  const addDirectory = (newDir: DirectoryItem) => {
    const ownerName =
      newDir.submittedBy && newDir.submittedBy.trim() !== ""
        ? newDir.submittedBy
        : "Denise";

    logActivity(
      newDir.name,
      `added ${newDir.name} (${newDir.status})`,
      ownerName,
      newDir.status,
    );

    setDirectories((prev) => [newDir, ...prev]);
    setSelectedDirectoryId(newDir.id);
  };

  const updateDirectory = (id: string, updates: Partial<DirectoryItem>) => {
    const targetItem = directories.find((d) => d.id === id);
    if (!targetItem) return;

    const updated = { ...targetItem, ...updates };
    const ownerName =
      updated.submittedBy && updated.submittedBy !== "Nobody yet"
        ? updated.submittedBy
        : "Denise";

    if (updates.status && updates.status !== targetItem.status) {
      logActivity(
        targetItem.name,
        `changed status to ${updates.status}`,
        ownerName,
        updated.status,
      );
    } else {
      logActivity(
        targetItem.name,
        `updated directory details`,
        ownerName,
        updated.status,
      );
    }

    setDirectories((prev) =>
      prev.map((item) => (item.id === id ? updated : item)),
    );
  };

  const deleteDirectory = (id: string) => {
    const dirToDelete = directories.find((d) => d.id === id);
    if (dirToDelete) {
      const ownerName =
        dirToDelete.submittedBy && dirToDelete.submittedBy !== "Nobody yet"
          ? dirToDelete.submittedBy
          : "Denise";
      logActivity(
        dirToDelete.name,
        `deleted ${dirToDelete.name}`,
        ownerName,
        dirToDelete.status,
      );
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
