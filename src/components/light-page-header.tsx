import { ChevronLeft } from "lucide-react";
import Link from "next/link";

type LightPageHeaderProps = {
  title: string;
  subtitle: string;
  backHref?: string;
  backLabel?: string;
};

export function LightPageHeader({ title, subtitle, backHref, backLabel = "Volver" }: LightPageHeaderProps) {
  if (backHref) {
    return (
      <header className="mb-6 flex items-center gap-3">
        <Link
          href={backHref}
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
          aria-label={backLabel}
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2} />
        </Link>
        <div>
          <h1 className="font-heading text-3xl font-bold leading-tight text-gray-900">{title}</h1>
          <p className="mt-0.5 text-[16px] text-gray-500">{subtitle}</p>
        </div>
      </header>
    );
  }

  return (
    <header className="mb-2">
      <h1 className="font-heading text-5xl font-bold tracking-tight text-gray-900">{title}</h1>
      <p className="mt-2 text-lg text-gray-600">{subtitle}</p>
    </header>
  );
}
