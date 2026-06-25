"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActor } from "./providers";

const LINKS = [
  { href: "/records", label: "Records" },
  { href: "/dashboard", label: "Dashboard" },
];

export function TopNav() {
  const pathname = usePathname();
  const { actorName, setActorName, members } = useActor();

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/records" className="flex items-center gap-2 font-semibold">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-neutral-900 text-xs font-bold text-white">
                MT
              </span>
              <span className="hidden sm:inline">my-team-org</span>
            </Link>
            <nav className="flex items-center gap-1">
              {LINKS.map((l) => {
                const active =
                  pathname === l.href || pathname.startsWith(l.href + "/");
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      active
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <span className="hidden text-neutral-400 sm:inline">Acting as</span>
            <select
              value={actorName}
              onChange={(e) => setActorName(e.target.value)}
              className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm font-medium focus:border-neutral-900 focus:outline-none"
            >
              {members.length === 0 && <option>{actorName}</option>}
              {members.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </header>
  );
}
