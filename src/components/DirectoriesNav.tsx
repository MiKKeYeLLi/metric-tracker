"use client";

import { AddDirectoryModal } from "@/components/AddDirectoryModal";

function IconFolder() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      <path d="M1 4a1 1 0 0 1 1-1h3l1.5 2H12a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4z" />
    </svg>
  );
}

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
      <div className="dash-nav-section-label" aria-hidden="true">Directories</div>
      <nav aria-label="Directories">
        {initialDirectories.map((dir) => (
          <a
            className="dash-nav-link"
            href={`/dashboard/directories/${dir.id}`}
            key={dir.id}
          >
            <IconFolder />
            <span className="dash-nav-link-text">{dir.name}</span>
            {dir._count.submissions > 0 && (
              <span className="dash-nav-badge">{dir._count.submissions}</span>
            )}
          </a>
        ))}
        <AddDirectoryModal />
      </nav>
    </>
  );
}
