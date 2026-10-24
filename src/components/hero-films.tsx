'use client';

import Image from 'next/image';
import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { filmSources } from '@/config/editorial-looks';

export function HeroFilms({ poster }: { poster: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videosRef = useRef<(HTMLVideoElement | null)[]>([]);
  const activeRef = useRef(0);
  const visibleRef = useRef(false);
  const pausedRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
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
        videosRef.current.forEach(video => video?.pause());
      } else if (!pausedRef.current) {
        void videosRef.current[activeRef.current]?.play().catch(() => setPlaying(false));
      }
    }, { threshold: 0.15 });
    observer.observe(container);
    return () => {
      observer.disconnect();
      preference.removeEventListener('change', applyPreference);
      videos.forEach(video => video?.pause());
    };
  }, []);

  const activate = (index: number, manual = false) => {
    if (!manual && (index !== (activeRef.current + 1) % filmSources.length || pausedRef.current || !visibleRef.current)) return;
    if (manual) {
      pausedRef.current = false;
      setPlaying(true);
    }
    const previous = activeRef.current;
    const incoming = videosRef.current[index];
    if (!incoming) return;
    incoming.currentTime = 0;
    activeRef.current = index;
    setActiveIndex(index);
    if (visibleRef.current) void incoming.play().catch(() => setPlaying(false));
    if (previous !== index) window.setTimeout(() => {
      if (activeRef.current !== previous) videosRef.current[previous]?.pause();
    }, 700);
  };

  const togglePlayback = () => {
    const next = !playing;
    pausedRef.current = !next;
    setPlaying(next);
    if (next && visibleRef.current) void videosRef.current[activeRef.current]?.play().catch(() => setPlaying(false));
    if (!next) videosRef.current.forEach(video => video?.pause());
  };

  return (
    <div className="hero-media" ref={containerRef}>
      <Image src={poster} alt="" fill priority sizes="100vw" className="hero-film-poster" />
      {filmSources.map((source, index) => (
        <video
          key={source}
          ref={node => { videosRef.current[index] = node; }}
          className={`hero-film${activeIndex === index ? ' is-active' : ''}`}
          src={source}
          muted
          playsInline
          preload={index === 0 ? 'auto' : 'metadata'}
          onEnded={() => activate((index + 1) % filmSources.length)}
          aria-hidden="true"
        />
      ))}
      <div className="hero-scrim" />
      <div className="hero-film-controls" aria-label="Campaign films">
        <span>Campaign films</span>
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
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </button>
      </div>
    </div>
  );
}
