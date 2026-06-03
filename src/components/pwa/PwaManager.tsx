"use client";

import { useEffect, useState } from "react";
import { Share, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "finance.pwa.dismissed";

export function PwaManager() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      dismissed = false;
    }
    if (dismissed) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    const ua = window.navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /^((?!chrome|crios|fxios|edgios).)*safari/i.test(ua);
    if (isIOS && isSafari) {
      setIosHint(true);
      setShow(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => undefined);
    setShow(false);
    setDeferred(null);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-[60] px-3 lg:hidden">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-xl animate-fade-in">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF7A18] to-[#FF3D2E] text-white">
          <Wallet className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            Installer l’application
          </p>
          {iosHint ? (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              Appuyez sur Partager
              <Share className="inline h-3.5 w-3.5" />
              puis « Sur l’écran d’accueil ».
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Accès rapide, plein écran, comme une vraie app.
            </p>
          )}
        </div>
        {!iosHint && (
          <Button size="sm" onClick={install} className="shrink-0">
            Installer
          </Button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fermer"
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
