import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './onboarding.css';

const SLIDES = [
  {
    icon: '🎯',
    title: 'Match a goal',
    body: 'Pick what you want and get a vetted starting protocol.',
  },
  {
    icon: '🧪',
    title: 'Mix with confidence',
    body: 'Exact units to draw — no math, no guessing.',
  },
  {
    icon: '🔔',
    title: 'Stay on schedule',
    body: 'See today’s doses and check them off in one tap.',
  },
];

export function Carousel() {
  const nav = useNavigate();
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;

  function next() {
    if (last) nav('/onboarding/medical');
    else setI((n) => n + 1);
  }

  const slide = SLIDES[i];
  return (
    <main className="ob-screen">
      <div className="ob-spacer" />
      <span aria-hidden="true" style={{ fontSize: 64 }}>
        {slide.icon}
      </span>
      <h1 className="ob-title">{slide.title}</h1>
      <p className="ob-sub">{slide.body}</p>
      <div className="ob-dots" role="tablist" aria-label="Slide">
        {SLIDES.map((s, idx) => (
          <button
            key={s.title}
            className="ob-dot"
            role="tab"
            aria-current={idx === i}
            aria-label={`Slide ${idx + 1} of ${SLIDES.length}`}
            onClick={() => setI(idx)}
          />
        ))}
      </div>
      <div className="ob-spacer" />
      <button className="ob-cta" onClick={next}>
        {last ? 'Continue' : 'Next'}
      </button>
    </main>
  );
}
