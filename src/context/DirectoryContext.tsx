"use client";

import React, { createContext, useContext, useState } from "react";
import { DirectoryItem, DirectoryStatus } from "@/types/directory";
import { MOCK_DIRECTORIES } from "@/data/mockDirectories";

export interface ActivityEntry {
  id: string;
  title: string;
  owner: string;
  date: string;
  status: DirectoryStatus;
}

interface DirectoryContextType {
  directories: DirectoryItem[];
  activityLog: ActivityEntry[];
  addDirectory: (directory: DirectoryItem) => void;
  updateDirectory: (directory: DirectoryItem) => void;
}

const DirectoryContext = createContext<DirectoryContextType | undefined>(
  undefined,
);

function buildActivityEntry(directory: DirectoryItem): ActivityEntry {
  const title =
    directory.status === "Live"
      ? `${directory.name} went live`
      : directory.status === "Pending review"
        ? `${directory.name} is pending review`
        : directory.status === "Needs changes"
          ? `${directory.name} needs updates`
          : directory.status === "Rejected"
            ? `${directory.name} was rejected`
            : `${directory.name} is on the shortlist`;

  return {
    id: `${directory.id}-activity`,
    title,
    owner: directory.submittedBy,
    date: directory.dateSubmitted,
    status: directory.status,
  };
}

export function DirectoryProvider({ children }: { children: React.ReactNode }) {
  const [directories, setDirectories] =
    useState<DirectoryItem[]>(MOCK_DIRECTORIES);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>(() =>
    MOCK_DIRECTORIES.slice(0, 4).map((directory) => buildActivityEntry(directory)),
  );

  const addDirectory = (newDir: DirectoryItem) => {
    setDirectories((prev) => [newDir, ...prev]);
    setActivityLog((prev) => [buildActivityEntry(newDir), ...prev].slice(0, 8));
  };

  const updateDirectory = (updatedDirectory: DirectoryItem) => {
    setDirectories((prev) =>
      prev.map((directory) =>
        directory.id === updatedDirectory.id ? updatedDirectory : directory,
      ),
    );
  };

  return (
    <DirectoryContext.Provider
      value={{ directories, activityLog, addDirectory, updateDirectory }}
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
