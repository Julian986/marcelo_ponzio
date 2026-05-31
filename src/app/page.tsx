"use client";

import { BrandLogo } from "@/components/brand-logo";
import { HOME_HERO_IMAGE_URL } from "@/lib/home-hero-image";
import { CalendarDays, Home as HomeIcon, Percent, Sparkles, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

let hasShownHomeSplash = false;

const SPLASH_MAX_MS = 900;
const SPLASH_MIN_VISIBLE_MS = 360;
const SPLASH_AFTER_LOAD_MS = 90;

function SplashScreen({ onLogoReady }: { onLogoReady: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white text-[#212121]">
      <div className="flex w-full max-w-md flex-col items-center px-6">
        <div className="mb-8 text-center">
          <div className="inline-flex flex-col items-center gap-2">
            <BrandLogo
              size="splash"
              fetchPriority="high"
              decoding="sync"
              onLoad={onLogoReady}
              onError={onLogoReady}
            />
            <h1 className="gold-text-gradient text-center font-heading text-2xl font-bold leading-tight tracking-wide uppercase">
              <span className="block">Marcelo Ponzio</span>
              <span className="mt-1 block text-lg tracking-[0.2em]">Estilista</span>
            </h1>
            <p className="text-xs tracking-[0.25em] text-gray-600">Color · Corte · Peinado</p>
          </div>
        </div>
        <p className="max-w-xs text-center text-sm leading-relaxed text-gray-600">
          Asesoramiento y técnica profesional para que tu pelo luzca como vos querés.
        </p>
      </div>
    </div>
  );
}

function HomeContent() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-[#212121]">
      <h1 className="sr-only">Marcelo Ponzio Estilista</h1>

      <section className="relative w-full shrink-0">
        <div className="relative h-[min(48vh,440px)] min-h-[280px] w-full">
          <Image
            src={HOME_HERO_IMAGE_URL}
            alt="Interior del salón Marcelo Ponzio Estilista"
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            quality={85}
            className="object-cover object-[center_35%]"
          />
          <div aria-hidden className="hero-gradient-overlay absolute inset-0" />
        </div>

        <div className="px-6 pt-5 pb-2 text-center">
          <p className="gold-text-gradient font-heading text-[32px] leading-tight font-bold tracking-wide uppercase">
            Marcelo Ponzio
            <br />
            Estilista
          </p>
          <p className="mt-2 text-lg font-normal tracking-widest text-gray-700">Color · Corte · Peinado</p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-md flex-grow px-6 pt-4 pb-32">
        <section className="space-y-6">
          <Link
            href="/turnos"
            className="flex h-16 w-full items-center justify-center rounded-full bg-[#B8860B] text-xl font-semibold text-white shadow-lg transition active:scale-[0.98]"
          >
            Reservar Turno
          </Link>

          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/tratamientos"
              className="flex h-[52px] items-center justify-center rounded-full border-[1.5px] border-[#B8860B] bg-[#212121] text-base font-medium text-white transition active:scale-[0.98]"
            >
              Tratamientos
            </Link>
            <Link
              href="/promociones"
              className="flex h-[52px] items-center justify-center rounded-full border-[1.5px] border-[#B8860B] bg-[#212121] text-base font-medium text-white transition active:scale-[0.98]"
            >
              Promociones
            </Link>
          </div>

          <div className="pt-4">
            <Link
              href="/contacto"
              className="flex h-16 w-full items-center justify-center rounded-full border border-gray-100 bg-white text-xl font-semibold text-[#212121] shadow-sm transition active:scale-[0.98]"
            >
              Contacto
            </Link>
          </div>
        </section>
      </main>

      <nav className="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-100 bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex h-16 max-w-md items-center justify-between px-4">
          <span className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[#B8860B]">
            <HomeIcon className="h-6 w-6" strokeWidth={1.9} />
            <span className="text-[10px] font-semibold tracking-[0.06em]">Inicio</span>
          </span>
          <Link
            href="/tratamientos"
            className="flex min-w-0 flex-1 flex-col items-center gap-1 text-gray-400"
          >
            <Sparkles className="h-6 w-6" strokeWidth={1.8} />
            <span className="text-[10px] font-medium tracking-[0.06em]">Tratamientos</span>
          </Link>
          <Link href="/turnos" className="flex min-w-0 flex-1 flex-col items-center gap-1 text-gray-400">
            <CalendarDays className="h-6 w-6" strokeWidth={1.8} />
            <span className="text-[10px] font-medium tracking-[0.06em]">Turnos</span>
          </Link>
          <Link href="/promociones" className="flex min-w-0 flex-1 flex-col items-center gap-1 text-gray-400">
            <Percent className="h-6 w-6" strokeWidth={1.8} />
            <span className="text-[10px] font-medium tracking-[0.06em]">Promos</span>
          </Link>
          <Link href="/perfil" className="flex min-w-0 flex-1 flex-col items-center gap-1 text-gray-400">
            <User className="h-6 w-6" strokeWidth={1.8} />
            <span className="text-[10px] font-medium tracking-[0.06em]">Perfil</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

export default function Home() {
  const [showSplash, setShowSplash] = useState(!hasShownHomeSplash);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissedRef = useRef(false);
  const openedAtRef = useRef(0);

  const dismissSplash = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    if (maxTimerRef.current !== null) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    hasShownHomeSplash = true;
    setShowSplash(false);
  }, []);

  useLayoutEffect(() => {
    if (hasShownHomeSplash || !showSplash) return;
    openedAtRef.current = Date.now();
  }, [showSplash]);

  useEffect(() => {
    if (hasShownHomeSplash) {
      setShowSplash(false);
      return;
    }
    if (!showSplash) return;
    maxTimerRef.current = setTimeout(dismissSplash, SPLASH_MAX_MS);
    return () => {
      if (maxTimerRef.current !== null) {
        clearTimeout(maxTimerRef.current);
        maxTimerRef.current = null;
      }
    };
  }, [showSplash, dismissSplash]);

  const handleSplashLogoReady = useCallback(() => {
    const elapsed = Date.now() - openedAtRef.current;
    const wait = Math.max(SPLASH_AFTER_LOAD_MS, SPLASH_MIN_VISIBLE_MS - elapsed);
    window.setTimeout(dismissSplash, wait);
  }, [dismissSplash]);

  if (showSplash) {
    return <SplashScreen onLogoReady={handleSplashLogoReady} />;
  }

  return <HomeContent />;
}
