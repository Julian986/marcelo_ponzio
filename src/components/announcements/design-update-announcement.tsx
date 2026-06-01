"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DESIGN_UPDATE_ANNOUNCEMENTS,
  hasSeenDesignUpdateAnnouncement,
  markDesignUpdateAnnouncementSeen,
  type DesignUpdateAnnouncementScope,
} from "@/lib/announcements/design-update";

type DesignUpdateAnnouncementProps = {
  scope: DesignUpdateAnnouncementScope;
  /** Si false, no se evalúa ni muestra (p. ej. mientras el splash de home está activo). */
  enabled?: boolean;
  /** Panel usa Montserrat en el título; app pública mantiene sans del body. */
  titleClassName?: string;
};

export function DesignUpdateAnnouncement({
  scope,
  enabled = true,
  titleClassName = "font-sans",
}: DesignUpdateAnnouncementProps) {
  const copy = DESIGN_UPDATE_ANNOUNCEMENTS[scope];
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (hasSeenDesignUpdateAnnouncement(scope)) return;
    setOpen(true);
  }, [enabled, scope]);

  const dismiss = useCallback(() => {
    markDesignUpdateAnnouncementSeen(scope);
    setOpen(false);
  }, [scope]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-5"
      onClick={dismiss}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`design-update-title-${scope}`}
        className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id={`design-update-title-${scope}`}
          className={`text-[22px] font-bold leading-snug text-gray-900 ${titleClassName}`}
        >
          {copy.title}
        </h2>
        <p className="mt-4 text-[17px] font-medium leading-[1.55] text-gray-900">{copy.body}</p>
        <button
          type="button"
          onClick={dismiss}
          className="mt-6 flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-[#B88E2F] text-[16px] font-semibold text-white shadow-sm transition hover:bg-[#A67D28] active:scale-[0.99]"
        >
          {copy.buttonLabel}
        </button>
      </div>
    </div>
  );
}
