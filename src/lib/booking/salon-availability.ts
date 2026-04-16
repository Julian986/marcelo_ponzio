import {
  SALON_TREATMENTS,
  TREATMENT_CATEGORIES,
  type TreatmentCategory,
} from "@/lib/treatments/catalog";

export type SalonTreatmentOption = {
  id: string;
  name: string;
  subtitle: string;
  category: TreatmentCategory;
};

export const SALON_TREATMENT_CATEGORIES: TreatmentCategory[] = [...TREATMENT_CATEGORIES];

export const SALON_TREATMENT_OPTIONS: SalonTreatmentOption[] = SALON_TREATMENTS.map((t) => ({
  id: t.id,
  name: t.name,
  subtitle: t.subtitle,
  category: t.category,
}));

const availableTimesByWeekday: Record<number, string[]> = {
  1: ["08:00", "09:00", "10:00", "11:00", "15:00", "16:00", "17:00"],
  2: ["08:00", "09:00", "10:00", "11:00", "15:00", "16:00", "17:00"],
  3: ["08:00", "09:00", "10:00", "11:00", "15:00", "16:00", "17:00"],
  4: ["08:00", "09:00", "10:00", "11:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
  5: ["08:00", "09:00", "10:00", "11:00", "15:00", "16:00", "17:00"],
  6: ["08:00", "09:00", "10:00", "11:00", "12:00"],
};

/**
 * Excepciones manuales de disponibilidad (prioridad sobre la plantilla semanal).
 * Fuente: agenda enviada por la clienta para cierre de marzo / abril 2026.
 */
const availableTimesByDateOverride: Record<string, string[]> = {
  "2026-03-30": ["09:00", "16:30", "18:15"],
  "2026-03-31": ["10:00", "17:00", "18:00"],
  "2026-04-01": ["08:00", "10:00", "11:00", "12:00", "17:00"],
  "2026-04-04": ["09:00", "10:00", "11:00", "12:00"],
  "2026-04-07": ["10:00", "11:00", "15:00", "16:00", "17:30", "18:30"],
  "2026-04-08": ["08:00", "09:00", "10:00", "10:30", "15:00", "16:00"],
  "2026-04-09": ["08:00", "09:00", "10:00"],
  "2026-04-10": ["11:00", "15:00", "16:00", "17:30", "18:30"],
  "2026-04-11": ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00"],
};

export const salonWeekdayLabels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export const salonMonthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function formatSalonDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getAvailableTimesForDate(value: string) {
  const date = parseDateKey(value);
  const today = startOfDay(new Date());

  if (startOfDay(date) < today) {
    return [];
  }

  const override = availableTimesByDateOverride[value];
  if (override) {
    return override;
  }

  return availableTimesByWeekday[date.getDay()] ?? [];
}

export type SalonCalendarItem = {
  value: string;
  dayNumber: number;
  weekday: string;
  isCurrentMonth: boolean;
  isAvailable: boolean;
};

export function buildSalonCalendarItems(year: number, monthIndex: number): SalonCalendarItem[] {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const startWeekday = firstDayOfMonth.getDay();
  const gridStartDate = new Date(year, monthIndex, 1 - startWeekday);

  return Array.from({ length: 35 }, (_, index) => {
    const currentDate = new Date(gridStartDate);
    currentDate.setDate(gridStartDate.getDate() + index);

    const value = formatSalonDateKey(currentDate);

    return {
      value,
      dayNumber: currentDate.getDate(),
      weekday: salonWeekdayLabels[currentDate.getDay()],
      isCurrentMonth: currentDate.getMonth() === monthIndex,
      isAvailable: getAvailableTimesForDate(value).length > 0,
    };
  });
}

export function formatSalonDisplayDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "Elegí día";

  const date = new Date(year, month - 1, day);
  return `${salonWeekdayLabels[date.getDay()]}, ${day} ${salonMonthNames[month - 1].slice(0, 3).toLowerCase()}`;
}

export function isLikelyWhatsappNumber(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}
