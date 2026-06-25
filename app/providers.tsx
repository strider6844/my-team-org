"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { TeamMember } from "@/lib/types";

// ── Toasts ───────────────────────────────────────────────────────────────────

type ToastKind = "success" | "error";
interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(
  () => {},
);

export function useToast() {
  return useContext(ToastContext);
}

// ── Actor ("acting as", since v1 has no auth) ────────────────────────────────

interface ActorState {
  actorName: string;
  setActorName: (name: string) => void;
  members: TeamMember[];
}

const ActorContext = createContext<ActorState>({
  actorName: "Someone",
  setActorName: () => {},
  members: [],
});

export function useActor() {
  return useContext(ActorContext);
}

let toastSeq = 0;

export function Providers({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [actorName, setActorNameState] = useState<string>("Someone");

  const toast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = ++toastSeq;
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3500);
  }, []);

  const setActorName = useCallback((name: string) => {
    setActorNameState(name);
    try {
      window.localStorage.setItem("actorName", name);
    } catch {
      /* ignore */
    }
  }, []);

  // Load the team roster once for the actor selector + assignee dropdowns.
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("team_members")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        const list = (data ?? []) as TeamMember[];
        setMembers(list);
        const saved =
          (typeof window !== "undefined" &&
            window.localStorage.getItem("actorName")) ||
          "";
        if (saved && list.some((m) => m.name === saved)) {
          setActorNameState(saved);
        } else if (list.length > 0) {
          setActorNameState(list[0].name);
        }
      });
  }, []);

  const actorValue = useMemo(
    () => ({ actorName, setActorName, members }),
    [actorName, setActorName, members],
  );

  return (
    <ActorContext.Provider value={actorValue}>
      <ToastContext.Provider value={toast}>
        {children}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg ring-1 ${
                t.kind === "error"
                  ? "bg-red-600 text-white ring-red-700"
                  : "bg-neutral-900 text-white ring-black/10"
              }`}
            >
              {t.message}
            </div>
          ))}
        </div>
      </ToastContext.Provider>
    </ActorContext.Provider>
  );
}
