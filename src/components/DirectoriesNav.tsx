"use client";

import { FolderIcon } from "lucide-react";
import { AddDirectoryModal } from "@/components/AddDirectoryModal";
import { SidebarNavLink, SidebarNavList, SidebarSectionLabel } from "@/components/SidebarNav";

interface Directory {
  id: string;
  name: string;
  _count: { submissions: number };
}

interface DirectoriesNavProps {
  initialDirectories: Directory[];
}

export function DirectoriesNav({ initialDirectories }: DirectoriesNavProps) {
  return (
    <>
      <SidebarSectionLabel>Directories</SidebarSectionLabel>
      <SidebarNavList aria-label="Directories">
        {initialDirectories.map((dir) => (
          <SidebarNavLink
            href={`/dashboard/directories/${dir.id}`}
            key={dir.id}
            icon={<FolderIcon aria-hidden="true" />}
            badge={dir._count.submissions > 0 ? dir._count.submissions : undefined}
          >
            {dir.name}
          </SidebarNavLink>
        ))}
        <AddDirectoryModal />
      </SidebarNavList>
    </>
  );
}
