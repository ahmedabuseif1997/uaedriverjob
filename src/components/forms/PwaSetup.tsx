"use client";

import { useEffect, useState } from "react";
import { X, Share, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";

export function PwaSetup() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    if (localStorage.getItem(DISMISS_KEY)) return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
    if (isStandalone) return;

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setDismissed(false);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    // One-time client-only check (navigator/matchMedia aren't available during SSR, so this
    // can't be derived synchronously during render) — not a subscription to changing state.
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIos) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowIosHint(true);
      setDismissed(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  function dismiss() {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "1");
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }

  if (dismissed || (!deferredPrompt && !showIosHint)) return null;

  return (
    <div className="fixed inset-x-4 bottom-20 z-40 flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg sm:bottom-4 sm:start-4 sm:max-w-sm dark:border-neutral-800 dark:bg-neutral-900">
      {deferredPrompt ? (
        <>
          <Download className="h-5 w-5 shrink-0 text-emerald-600" />
          <p className="flex-1 text-sm">Install UAE Driver Jobs for quick access.</p>
          <Button size="sm" onClick={install}>
            Install
          </Button>
        </>
      ) : (
        <>
          <Share className="h-5 w-5 shrink-0 text-emerald-600" />
          <p className="flex-1 text-sm">
            Tap <strong>Share</strong> then <strong>Add to Home Screen</strong> to install this app.
          </p>
        </>
      )}
      <button onClick={dismiss} aria-label="Dismiss" className="shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
