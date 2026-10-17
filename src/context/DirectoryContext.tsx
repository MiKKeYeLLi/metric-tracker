"use client";

import React, { createContext, useContext, useState } from "react";
import { DirectoryItem } from "@/types/directory";
import { MOCK_DIRECTORIES } from "@/data/mockDirectories";

interface DirectoryContextType {
  directories: DirectoryItem[];
  addDirectory: (directory: DirectoryItem) => void;
  updateDirectory: (directory: DirectoryItem) => void;
}

const DirectoryContext = createContext<DirectoryContextType | undefined>(
  undefined,
);

export function DirectoryProvider({ children }: { children: React.ReactNode }) {
  const [directories, setDirectories] =
    useState<DirectoryItem[]>(MOCK_DIRECTORIES);

  const addDirectory = (newDir: DirectoryItem) => {
    setDirectories((prev) => [newDir, ...prev]);
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
      value={{ directories, addDirectory, updateDirectory }}
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
