'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { filmSources } from '@/config/editorial-looks';

export function SequentialFilm() {
  const sectionRef = useRef<HTMLElement>(null);
  const videosRef = useRef<(HTMLVideoElement | null)[]>([]);
  const activeRef = useRef(0);
  const visibleRef = useRef(false);
  const pausedRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyPreference = () => {
      setReducedMotion(preference.matches);
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
      const active = videosRef.current[activeRef.current];
      if (entry.isIntersecting && !pausedRef.current) void active?.play().catch(() => setPlaying(false));
      if (!entry.isIntersecting) videosRef.current.forEach(video => video?.pause());
    }, { threshold: 0.12 });
    observer.observe(section);
    return () => { observer.disconnect(); preference.removeEventListener('change', applyPreference); };
  }, []);

  const nextFilm = (index: number) => {
    if (index !== activeRef.current || pausedRef.current || !visibleRef.current) return;
    const next = (index + 1) % filmSources.length;
    const incoming = videosRef.current[next];
    if (!incoming) return;
    incoming.currentTime = 0;
    void incoming.play().then(() => {
      activeRef.current = next;
      setActiveIndex(next);
      window.setTimeout(() => videosRef.current[index]?.pause(), 850);
    }).catch(() => setPlaying(false));
  };

  const togglePlayback = () => {
    const next = !playing;
    pausedRef.current = !next;
    setPlaying(next);
    if (next && visibleRef.current) void videosRef.current[activeRef.current]?.play().catch(() => setPlaying(false));
    if (!next) videosRef.current.forEach(video => video?.pause());
  };

  return (
    <section className={`film-feature${playing ? ' is-playing' : ''}`} ref={sectionRef} aria-labelledby="film-feature-title">
      <div className="film-feature-background" aria-hidden="true">
        {filmSources.map((source, index) => (
          <video
            key={source}
            ref={node => { videosRef.current[index] = node; }}
            className={activeIndex === index ? 'is-active' : ''}
            src={source}
            muted
            playsInline
            preload={index === 0 ? 'auto' : 'metadata'}
            onEnded={() => nextFilm(index)}
          />
        ))}
        <div className="film-feature-scrim" />
      </div>
      <div className="film-feature-content">
        <div className="film-feature-copy">
          <p className="eyebrow">Easy Eyes / In motion</p>
          <h2 id="film-feature-title">The frame<br /><em>in focus.</em></h2>
          <p>A closer look at the shape that changes the view.</p>
        </div>
        <div className="film-feature-object">
          <Image src="/assets/campaign/eyewear-foreground.png" alt="Slim silver optical glasses shown from the front" fill sizes="(max-width: 700px) 92vw, 64vw" />
          <span>Frame study / 01</span>
        </div>
        <div className="film-feature-footer">
          <span>Film {String(activeIndex + 1).padStart(2, '0')} / 03</span>
          {!reducedMotion && <button type="button" onClick={togglePlayback} aria-label={playing ? 'Pause background films' : 'Play background films'}>{playing ? <Pause size={16} /> : <Play size={16} />} {playing ? 'Pause films' : 'Play films'}</button>}
          <span>Watch the sequence</span>
        </div>
      </div>
    </section>
  );
}
