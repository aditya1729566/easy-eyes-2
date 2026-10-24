'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { editorialLooks, editorialPriceMinor } from '@/config/editorial-looks';
import { money } from '@/config/site';

const lastIndex = editorialLooks.length - 1;

export function ModelGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const activeRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let current = 0;
    let target = 0;

    const markActive = (index: number) => {
      if (index !== activeRef.current) {
        activeRef.current = index;
        setActiveIndex(index);
      }
    };

    const paint = () => {
      const stride = Math.min(window.innerWidth * (window.innerWidth < 700 ? 0.68 : 0.4), 650);
      cardRefs.current.forEach((card, index) => {
        if (!card) return;
        const distance = index - current;
        const magnitude = Math.abs(distance);
        const scale = Math.max(0.6, 1 - magnitude * 0.17);
        card.style.transform = `translate3d(calc(-50% + ${distance * stride}px), calc(-50% + ${magnitude * 20}px), ${-magnitude * 390}px) rotateY(${-distance * 50}deg) rotateZ(${-distance * 3}deg) scale(${scale})`;
        card.style.opacity = String(Math.max(0, 1 - magnitude * 0.54));
        card.style.visibility = magnitude > 2.1 ? 'hidden' : 'visible';
        card.style.zIndex = String(100 - Math.round(magnitude * 10));
      });
      markActive(Math.min(lastIndex, Math.max(0, Math.round(current))));
    };

    const tick = () => {
      frame = 0;
      current += (target - current) * 0.16;
      if (Math.abs(target - current) < 0.001) current = target;
      paint();
      if (current !== target) frame = requestAnimationFrame(tick);
    };

    const update = () => {
      if (reducedMotion.matches) return;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      target = Math.min(lastIndex, Math.max(0, (-rect.top / travel) * lastIndex));
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const updateReduced = () => {
      if (!reducedMotion.matches) return;
      const width = stage.querySelector<HTMLElement>('.model-gallery-card')?.offsetWidth || 1;
      markActive(Math.min(lastIndex, Math.max(0, Math.round(stage.scrollLeft / (width + 16)))));
    };

    const onMotionChange = () => {
      cardRefs.current.forEach(card => card?.removeAttribute('style'));
      current = 0;
      target = 0;
      if (reducedMotion.matches) updateReduced();
      else update();
    };

    if (!reducedMotion.matches) update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    stage.addEventListener('scroll', updateReduced, { passive: true });
    reducedMotion.addEventListener('change', onMotionChange);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      stage.removeEventListener('scroll', updateReduced);
      reducedMotion.removeEventListener('change', onMotionChange);
    };
  }, []);

  const goTo = (index: number) => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    const next = Math.min(lastIndex, Math.max(0, index));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cardRefs.current[next]?.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
      activeRef.current = next;
      setActiveIndex(next);
      return;
    }
    const rect = section.getBoundingClientRect();
    const travel = Math.max(1, rect.height - window.innerHeight);
    window.scrollTo({ top: window.scrollY + rect.top + (next / lastIndex) * travel, behavior: 'smooth' });
  };

  return (
    <section className="model-gallery" id="the-looks" ref={sectionRef} aria-labelledby="model-gallery-title">
      <div className="model-gallery-stage" ref={stageRef}>
        <div className="model-gallery-heading">
          <p className="eyebrow">Easy Eyes / The looks</p>
          <h2 id="model-gallery-title">A frame changes <em>everything.</em></h2>
          <p>Nine looks. One rule: make them look twice. Move through the frames to find yours.</p>
        </div>
        <div className="model-gallery-cards" role="group" aria-label="Eyewear looks">
          {editorialLooks.map((look, index) => (
            <article
              className={`model-gallery-card${activeIndex === index ? ' is-active' : ''}`}
              key={look.image}
              ref={node => { cardRefs.current[index] = node; }}
              aria-hidden={activeIndex !== index}
            >
              <div className="model-gallery-photo">
                <Image src={look.image} alt={look.alt} fill sizes="(max-width: 700px) 80vw, 42vw" priority={index === 0} />
                {look.frameImage && <div className="model-gallery-frame"><Image src={look.frameImage} alt={`Glasses for look ${index + 1}`} fill sizes="180px" /></div>}
              </div>
              <div className="model-gallery-caption">
                <div><span>Look {String(index + 1).padStart(2, '0')}</span><small>Frame view to follow</small></div>
                <strong>{money(editorialPriceMinor)}</strong>
              </div>
            </article>
          ))}
        </div>
        <div className="model-gallery-footer">
          <p role="status" aria-live="polite">Look {String(activeIndex + 1).padStart(2, '0')} of {String(editorialLooks.length).padStart(2, '0')}</p>
          <div className="model-gallery-progress" aria-hidden="true"><span style={{ width: `${((activeIndex + 1) / editorialLooks.length) * 100}%` }} /></div>
          <div className="model-gallery-nav">
            <button type="button" onClick={() => goTo(activeIndex - 1)} disabled={activeIndex === 0} aria-label="Previous look"><ArrowLeft size={19} /></button>
            <button type="button" onClick={() => goTo(activeIndex + 1)} disabled={activeIndex === lastIndex} aria-label="Next look"><ArrowRight size={19} /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
