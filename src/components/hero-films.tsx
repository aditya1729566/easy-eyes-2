'use client';

import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { filmSources } from '@/config/editorial-looks';

type HeroFilmsProps = {
  railTitle: ReactNode;
  railAction: ReactNode;
};

export function HeroFilms({ railTitle, railAction }: HeroFilmsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videosRef = useRef<(HTMLVideoElement | null)[]>([]);
  const activeRef = useRef(0);
  const outgoingRef = useRef<number | null>(null);
  const requestRef = useRef(0);
  const pendingRef = useRef(false);
  const transitionTimerRef = useRef<number | null>(null);
  const visibleRef = useRef(false);
  const pausedRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [outgoingIndex, setOutgoingIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const videos = videosRef.current;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyPreference = () => {
      if (preference.matches) {
        pausedRef.current = true;
        setPlaying(false);
        videosRef.current.forEach(video => video?.pause());
      }
    };
    applyPreference();
    preference.addEventListener('change', applyPreference);
    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
      if (!entry.isIntersecting) {
        requestRef.current += 1;
        pendingRef.current = false;
        videosRef.current.forEach(video => video?.pause());
      } else if (!pausedRef.current) {
        void videosRef.current[activeRef.current]?.play().catch(() => setPlaying(false));
      }
    }, { threshold: 0.15 });
    observer.observe(container);
    return () => {
      observer.disconnect();
      preference.removeEventListener('change', applyPreference);
      requestRef.current += 1;
      if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
      videos.forEach(video => video?.pause());
    };
  }, []);

  const activate = (index: number, manual = false) => {
    if (!manual && (pausedRef.current || !visibleRef.current || pendingRef.current)) return;
    if (manual) {
      pausedRef.current = false;
      setPlaying(true);
    }
    const previous = activeRef.current;
    const incoming = videosRef.current[index];
    if (!incoming) return;
    const request = ++requestRef.current;
    pendingRef.current = true;
    incoming.currentTime = 0;
    if (!visibleRef.current) {
      pendingRef.current = false;
      return;
    }
    void incoming.play().then(() => {
      if (request !== requestRef.current || pausedRef.current || !visibleRef.current) {
        incoming.pause();
        return;
      }
      pendingRef.current = false;
      if (previous === index) return;
      if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
      if (outgoingRef.current !== null && outgoingRef.current !== previous && outgoingRef.current !== index) {
        videosRef.current[outgoingRef.current]?.pause();
      }
      outgoingRef.current = previous;
      setOutgoingIndex(previous);
      activeRef.current = index;
      setActiveIndex(index);
      transitionTimerRef.current = window.setTimeout(() => {
        if (request !== requestRef.current) return;
        videosRef.current[previous]?.pause();
        outgoingRef.current = null;
        setOutgoingIndex(null);
        transitionTimerRef.current = null;
      }, 750);
    }).catch(() => {
      if (request !== requestRef.current) return;
      pendingRef.current = false;
      pausedRef.current = true;
      setPlaying(false);
    });
  };

  const togglePlayback = () => {
    const next = !playing;
    pausedRef.current = !next;
    setPlaying(next);
    if (!next) {
      requestRef.current += 1;
      pendingRef.current = false;
      if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
      outgoingRef.current = null;
      setOutgoingIndex(null);
    }
    if (next && visibleRef.current) void videosRef.current[activeRef.current]?.play().catch(() => setPlaying(false));
    if (!next) videosRef.current.forEach(video => video?.pause());
  };

  const warmNextFilm = (index: number, video: HTMLVideoElement) => {
    if (index !== activeRef.current || !Number.isFinite(video.duration) || video.duration - video.currentTime > 4) return;
    const next = videosRef.current[(index + 1) % filmSources.length];
    if (next?.preload === 'none') next.preload = 'auto';
  };

  return <>
    <div className="hero-media" ref={containerRef}>
      {filmSources.map((source, index) => (
        <video
          key={source.desktop}
          ref={node => { videosRef.current[index] = node; }}
          className={`hero-film${activeIndex === index ? ' is-active' : ''}${outgoingIndex === index ? ' is-outgoing' : ''}`}
          muted
          playsInline
          preload={index === 0 ? 'auto' : 'none'}
          poster={index === 0 ? '/assets/campaign/film-01-poster.webp' : undefined}
          onTimeUpdate={event => warmNextFilm(index, event.currentTarget)}
          onEnded={() => { if (index === activeRef.current) activate((index + 1) % filmSources.length); }}
          aria-hidden="true"
        >
          <source media="(max-width: 650px)" src={source.mobile} type="video/mp4" />
          <source src={source.desktop} type="video/mp4" />
        </video>
      ))}
    </div>
    <div className="hero-film-controls" role="group" aria-label="Campaign films">
      <div className="hero-rail-copy">{railTitle}</div>
      <div className="hero-film-switcher">
        <span>Select a film</span>
        {filmSources.map((_, index) => (
          <button
            type="button"
            key={index}
            className={activeIndex === index ? 'is-active' : ''}
            onClick={() => activate(index, true)}
            aria-label={`Play film ${index + 1}`}
            aria-current={activeIndex === index ? 'true' : undefined}
          >{String(index + 1).padStart(2, '0')}</button>
        ))}
        <button type="button" className="hero-film-toggle" onClick={togglePlayback} aria-label={playing ? 'Pause films' : 'Play films'}>
          {playing ? <Pause size={17} /> : <Play size={17} />}
        </button>
      </div>
      <div className="hero-rail-action">{railAction}</div>
    </div>
  </>;
}
