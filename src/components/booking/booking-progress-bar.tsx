const STEP_LABELS = ["Servicio", "Fecha", "Horario", "Datos", "Confirmación"] as const;

type BookingProgressBarProps = {
  currentStep: number;
  totalSteps?: number;
};

export function BookingProgressBar({ currentStep, totalSteps = 5 }: BookingProgressBarProps) {
  const safeStep = Math.min(Math.max(currentStep, 1), totalSteps);
  const progressPct = Math.round((safeStep / totalSteps) * 100);
  const label = STEP_LABELS[safeStep - 1] ?? "";

  return (
    <div className="mb-6" aria-label={`Paso ${safeStep} de ${totalSteps}: ${label}`}>
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <p className="text-[16px] font-semibold text-[var(--text-primary)]">
          Paso {safeStep} de {totalSteps}
        </p>
        <p className="text-[16px] font-medium text-[var(--text-secondary)]">{label}</p>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-[var(--border-light)]"
        role="progressbar"
        aria-valuenow={safeStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuetext={`${label}, ${progressPct}% completado`}
      >
        <div
          className="h-full rounded-full bg-[var(--premium-gold)] transition-[width] duration-300 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}
