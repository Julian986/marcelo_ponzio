/** Versión del aviso: subir al publicar un mensaje nuevo. */
export const DESIGN_UPDATE_ANNOUNCEMENT_VERSION = "v1";

export type DesignUpdateAnnouncementScope = "/" | "/turnos" | "/panel-turnos";

export type DesignUpdateAnnouncementCopy = {
  title: string;
  body: string;
  buttonLabel: string;
};

export const DESIGN_UPDATE_ANNOUNCEMENTS: Record<
  DesignUpdateAnnouncementScope,
  DesignUpdateAnnouncementCopy
> = {
  "/": {
    title: "¡Actualizamos la aplicación! 🎉",
    body: "El diseño es más claro y fácil de leer en el celular. El menú de abajo sigue igual.",
    buttonLabel: "Entendido",
  },
  "/turnos": {
    title: "¡Reserva de turnos actualizada! 🎉 📅",
    body: "Las pantallas están más ordenadas. El proceso para elegir servicio, día y horario es el mismo de siempre.",
    buttonLabel: "Continuar",
  },
  "/panel-turnos": {
    title: "¡Agenda actualizada! 🎉 📋",
    body: "Los turnos del día se ven con más claridad. Reprogramar está más visible; WhatsApp queda como opción aparte.",
    buttonLabel: "Entendido",
  },
};

export function designUpdateAnnouncementStorageKey(scope: DesignUpdateAnnouncementScope): string {
  return `mp_design_update_ann_${DESIGN_UPDATE_ANNOUNCEMENT_VERSION}:${scope}`;
}

export function hasSeenDesignUpdateAnnouncement(scope: DesignUpdateAnnouncementScope): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(designUpdateAnnouncementStorageKey(scope)) === "1";
  } catch {
    return true;
  }
}

export function markDesignUpdateAnnouncementSeen(scope: DesignUpdateAnnouncementScope): void {
  try {
    window.localStorage.setItem(designUpdateAnnouncementStorageKey(scope), "1");
  } catch {
    /* quota / private mode */
  }
}
