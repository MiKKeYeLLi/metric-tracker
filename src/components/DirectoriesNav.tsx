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
      <div className="px-[10px] mt-[18px] mb-[2px] text-muted text-[10px] font-bold tracking-[0.08em] uppercase max-[980px]:hidden" aria-hidden="true">
        Directories
      </div>
      <nav aria-label="Directories">
        {initialDirectories.map((dir) => (
          <a
            className="group flex items-center gap-2 px-[10px] py-[7px] rounded-[7px] text-muted text-[13px] font-medium no-underline transition-[color,background-color] duration-[120ms] whitespace-nowrap overflow-hidden hover:text-ink hover:bg-white/[0.64] aria-[current=page]:text-violet-deep aria-[current=page]:bg-white/[0.64] aria-[current=page]:font-semibold aria-[current=page]:rounded-l-none aria-[current=page]:shadow-[inset_2px_0_0_#8e6afa] aria-[current=page]:pl-2 max-[980px]:flex-shrink-0 max-[980px]:aria-[current=page]:rounded-[7px] max-[980px]:aria-[current=page]:shadow-none max-[980px]:aria-[current=page]:pl-[10px] max-[980px]:aria-[current=page]:bg-violet-tint"
            href={`/dashboard/directories/${dir.id}`}
            key={dir.id}
          >
            <IconFolder />
            <span className="flex-1 min-w-0 overflow-hidden text-ellipsis">{dir.name}</span>
            {dir._count.submissions > 0 && (
              <span className="flex-shrink-0 px-[6px] py-[1px] rounded-full bg-black/[0.07] text-muted font-mono text-[10px] font-medium leading-[1.7] group-aria-[current=page]:bg-violet-tint group-aria-[current=page]:text-violet-deep">
                {dir._count.submissions}
              </span>
            )}
          </a>
        ))}
        <AddDirectoryModal />
      </nav>
    </>
  );
}
