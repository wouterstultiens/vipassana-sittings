// Floating variant switcher. Hidden in production builds.
import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

export function useVariant(keys: string[]) {
  const [variant, setVariant] = React.useState(() => {
    if (typeof window === "undefined") return keys[0];
    const v = new URLSearchParams(window.location.search).get("variant");
    return v && keys.includes(v) ? v : keys[0];
  });
  const set = React.useCallback(
    (v: string) => {
      setVariant(v);
      const url = new URL(window.location.href);
      url.searchParams.set("variant", v);
      window.history.replaceState(null, "", url);
    },
    [],
  );
  const step = React.useCallback(
    (d: number) => set(keys[(keys.indexOf(variant) + d + keys.length) % keys.length]),
    [keys, variant, set],
  );
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);
  return { variant, set, step };
}

export function PrototypeSwitcher({ keys, names, current, step }: { keys: string[]; names: Record<string, string>; current: string; step: (d: number) => void }) {
  if (import.meta.env.PROD) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-zinc-900 px-2 py-1.5 font-mono text-xs text-white shadow-xl ring-2 ring-fuchsia-500">
      <button className="rounded-full p-1 hover:bg-white/20" onClick={() => step(-1)} aria-label="Previous variant">
        <ChevronLeftIcon className="size-4" />
      </button>
      <span className="px-1">
        PROTOTYPE {current} · {names[current]} <span className="opacity-60">({keys.indexOf(current) + 1}/{keys.length})</span>
      </span>
      <button className="rounded-full p-1 hover:bg-white/20" onClick={() => step(1)} aria-label="Next variant">
        <ChevronRightIcon className="size-4" />
      </button>
    </div>
  );
}
