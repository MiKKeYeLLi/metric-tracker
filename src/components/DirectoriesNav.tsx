"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddDirectoryModal } from "@/components/AddDirectoryModal";

function IconFolder() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      <path d="M1 4a1 1 0 0 1 1-1h3l1.5 2H12a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4z" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <line x1="6" y1="1" x2="6" y2="11" />
      <line x1="1" y1="6" x2="11" y2="6" />
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
  const [directories, setDirectories] = useState<Directory[]>(initialDirectories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  function handleSuccess(directory: Directory) {
    setDirectories((prev) => [...prev, directory]);
    router.refresh();
  }

  return (
    <>
      <div className="dash-nav-section-label" aria-hidden="true">Directories</div>
      <nav aria-label="Directories">
        {directories.map((dir) => (
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
        <button
          className="dash-nav-add"
          type="button"
          onClick={() => setIsModalOpen(true)}
        >
          <IconPlus />
          Add directory
        </button>
      </nav>

      <AddDirectoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
