"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { HomeIndustrySettings } from "@/lib/home-industries";
import "./home-industry-carousel.css";

export function HomeIndustryCarousel({settings}:{settings:HomeIndustrySettings}): React.ReactElement | null {
  const id=useId(), rail=useRef<HTMLUListElement>(null);
  const [active,setActive]=useState(0),[visible,setVisible]=useState(1);
  const [playing,setPlaying]=useState(settings.autoPlay),[hovered,setHovered]=useState(false),[focused,setFocused]=useState(false),[override,setOverride]=useState(false);
  const [reduced,setReduced]=useState(true),[hidden,setHidden]=useState(true),[inView,setInView]=useState(false);
  const count=settings.slides.length, maxIndex=Math.max(0,count-visible), current=Math.min(active,maxIndex);
  const rotating=playing && count>visible && !reduced && !hidden && inView && (override || (!hovered&&!focused));
  const go=useCallback((index:number)=>{
    const list=rail.current, first=list?.children[0] as HTMLElement|undefined;
    const next=Math.max(0,Math.min(index,Math.max(0,count-visible))), item=list?.children[next] as HTMLElement|undefined;
    if(list&&first&&item) list.scrollTo?.({left:item.offsetLeft-first.offsetLeft,behavior:reduced?"auto":"smooth"});
    setActive(next);
  },[count,visible,reduced]);

  useEffect(()=>{
    const media=window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const motion=()=>setReduced(media?.matches??false),visibility=()=>setHidden(document.hidden);
    motion();visibility();media?.addEventListener("change",motion);document.addEventListener("visibilitychange",visibility);
    const list=rail.current;
    const measure=()=>{
      const first=list?.children[0] as HTMLElement|undefined;
      const width=first?.getBoundingClientRect().width??0;
      const gap=list?parseFloat(getComputedStyle(list).columnGap)||0:0;
      const amount=list&&width?Math.max(1,Math.floor((list.clientWidth+gap)/(width+gap))):1;
      setVisible(amount);setActive(index=>Math.min(index,Math.max(0,count-amount)));
    };
    measure();window.addEventListener("resize",measure);
    const resize=typeof ResizeObserver!=="undefined"?new ResizeObserver(measure):undefined;if(list)resize?.observe(list);
    const observer=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(entries=>setInView(entries[0]?.isIntersecting??false)):undefined;
    if(list&&observer)observer.observe(list);else setInView(true);
    return()=>{media?.removeEventListener("change",motion);document.removeEventListener("visibilitychange",visibility);window.removeEventListener("resize",measure);resize?.disconnect();observer?.disconnect();};
  },[count]);
  useEffect(()=>{
    if(!rotating)return;
    const timer=window.setTimeout(()=>go(current>=maxIndex?0:current+1),settings.intervalSeconds*1000);
    return()=>window.clearTimeout(timer);
  },[rotating,current,maxIndex,go,settings.intervalSeconds]);
  if(!settings.enabled||!count)return null;

  const manual=(next:number)=>{setPlaying(false);setOverride(false);go(next);};
  return <div className={`industry-carousel industry-carousel--${settings.fontFamily} industry-carousel--${settings.fontSize}`} role="region" aria-label="産業別用途" aria-roledescription="カルーセル"
    onMouseEnter={()=>{setHovered(true);setOverride(false);}} onMouseLeave={()=>{setHovered(false);setOverride(false);}}
    onFocusCapture={()=>{setFocused(true);setOverride(false);}} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget)){setFocused(false);setOverride(false);}}}>
    <ul className="industry-carousel__track" ref={rail} id={`${id}-track`} tabIndex={0} aria-label="業界別の写真。左右の矢印キーで切り替えられます。"
      onPointerDown={()=>{setPlaying(false);setOverride(false);}} onWheel={event=>{if(event.deltaX||event.shiftKey){setPlaying(false);setOverride(false);}}}
      onKeyDown={event=>{if(event.target!==event.currentTarget)return;const next=event.key==="ArrowRight"?current+1:event.key==="ArrowLeft"?current-1:event.key==="Home"?0:event.key==="End"?maxIndex:undefined;if(next!==undefined){event.preventDefault();manual(next);}}}
      onScroll={()=>{
        const list=rail.current, first=list?.children[0] as HTMLElement|undefined, second=list?.children[1] as HTMLElement|undefined;
        const step=first&&second?second.offsetLeft-first.offsetLeft:0;
        if(list&&step)setActive(Math.max(0,Math.min(Math.round(list.scrollLeft/step),maxIndex)));
      }}>
      {settings.slides.map(slide=><li className="industry-carousel__slide" key={slide._key}>
        <a className="industry-carousel__card" href={slide.href} aria-labelledby={`${id}-${slide._key}`}>
          {/* Plain images preserve all approved photo URLs in the static export. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slide.image.src} alt={slide.image.alt} width={640} height={800} loading="lazy" decoding="async" />
          <h3 id={`${id}-${slide._key}`} className="industry-carousel__caption">{slide.title}</h3>
        </a>
      </li>)}
    </ul>
    <div className="industry-carousel__controls" aria-label="業界写真の操作">
      <button type="button" aria-label="前の業界写真" aria-controls={`${id}-track`} disabled={count<=visible} onClick={()=>manual(current===0?maxIndex:current-1)}>←</button>
      <p role="status" aria-live={rotating?"off":"polite"}>{current+1}–{Math.min(current+visible,count)} / {count}</p>
      <button type="button" aria-label="次の業界写真" aria-controls={`${id}-track`} disabled={count<=visible} onClick={()=>manual(current===maxIndex?0:current+1)}>→</button>
      <button type="button" className="industry-carousel__play" disabled={count<=visible||reduced} onClick={()=>{setPlaying(!playing);setOverride(!playing);}} aria-label={playing?"業界写真の自動再生を停止":"業界写真の自動再生を開始"}>{playing?"一時停止":"自動再生"}</button>
    </div>
  </div>;
}
