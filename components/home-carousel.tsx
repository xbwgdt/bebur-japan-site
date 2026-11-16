"use client";

import { useEffect, useId, useState } from "react";
import type { HomeCarouselSettings } from "@/lib/home-carousel";
import "./home-carousel.css";

export function HomeCarousel({ settings }: { settings: HomeCarouselSettings }): React.ReactElement | null {
  const id = useId();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(settings.autoPlay);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [interactionOverride, setInteractionOverride] = useState(false);
  // Start suspended until browser preferences and visibility have been read.
  const [reducedMotion, setReducedMotion] = useState(true);
  const [hidden, setHidden] = useState(true);
  const count = settings.slides.length;
  const active = index < count ? index : 0;
  const rotating = settings.enabled && count > 1 && playing && !reducedMotion && !hidden && (interactionOverride || (!hovered && !focused));

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const motion = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    const visibility = () => setHidden(document.hidden);
    setReducedMotion(media?.matches ?? false); visibility();
    media?.addEventListener("change", motion);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      media?.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setTimeout(() => setIndex((current) => (current + 1) % count), settings.intervalSeconds * 1_000);
    return () => window.clearTimeout(timer);
  }, [rotating, active, count, settings.intervalSeconds]);

  if (!settings.enabled || count === 0) return null;

  return (
    <section className="home-carousel" aria-label="Beburの製品とソリューション" aria-roledescription="カルーセル"
      onMouseEnter={() => { setHovered(true); setInteractionOverride(false); }}
      onMouseLeave={() => { setHovered(false); setInteractionOverride(false); }}
      onFocusCapture={() => { setFocused(true); setInteractionOverride(false); }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) { setFocused(false); setInteractionOverride(false); }
      }}>
      <div className="home-carousel__slides" id={`${id}-slides`} aria-live={rotating ? "off" : "polite"} aria-atomic="false">
        {settings.slides.map((slide, position) => {
          const selected = position === active;
          const Heading = selected ? "h1" : "h2";
          return <article key={slide._key} className={`home-carousel__slide home-carousel__slide--${slide.style.alignment} home-carousel__slide--${slide.style.color} home-carousel__slide--font-${slide.style.fontFamily} home-carousel__slide--size-${slide.style.fontSize}`}
            data-active={selected} role="group" aria-roledescription="スライド" aria-label={`${position + 1} / ${count}`}
            aria-hidden={!selected} inert={!selected}>
            {/* Native images keep all six source URLs in static HTML without loader dependencies. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="home-carousel__image" src={slide.image.src} alt={slide.image.alt} width={1920} height={1080}
              loading={position === 0 ? "eager" : "lazy"} fetchPriority={position === 0 ? "high" : undefined} decoding="async" />
            <div className="home-carousel__copy-wrap"><div className="home-carousel__copy">
              <p className="home-carousel__eyebrow">{slide.eyebrow}</p>
              <Heading className="home-carousel__title">{slide.title}</Heading>
              <p className="home-carousel__summary">{slide.summary}</p>
              <a className="home-carousel__action" href={slide.primaryAction.href} tabIndex={selected ? undefined : -1}>{slide.primaryAction.label}<span aria-hidden="true"> →</span></a>
            </div></div>
          </article>;
        })}
      </div>
      <div className="home-carousel__controls" aria-label="スライド操作">
        <button type="button" aria-label="前のスライド" aria-controls={`${id}-slides`} onClick={() => setIndex((active - 1 + count) % count)}>←</button>
        <div className="home-carousel__dots">
          {settings.slides.map((slide, position) => <button type="button" key={slide._key} aria-label={`スライド${position + 1}を表示`}
            aria-current={position === active ? "true" : undefined} aria-controls={`${id}-slides`} onClick={() => setIndex(position)}><span aria-hidden="true" /></button>)}
        </div>
        <button type="button" aria-label="次のスライド" aria-controls={`${id}-slides`} onClick={() => setIndex((active + 1) % count)}>→</button>
        <button className="home-carousel__play" type="button" aria-label={playing && !reducedMotion ? "自動再生を一時停止" : "自動再生を再開"}
          onClick={() => {
            if (playing && !reducedMotion) { setPlaying(false); setInteractionOverride(false); }
            else { setPlaying(true); setInteractionOverride(true); }
          }}>{playing && !reducedMotion ? "一時停止" : "再生"}</button>
      </div>
      {reducedMotion && <p className="home-carousel__motion-note">動きを減らす設定のため、自動再生は停止しています。</p>}
    </section>
  );
}
