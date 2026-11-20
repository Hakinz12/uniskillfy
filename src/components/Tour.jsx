import { useEffect, useRef, useState } from 'react';

const STEPS = [
  {
    title: 'Welcome',
    body: 'Campus Skill Swap helps students trade what they know for what they want to learn.',
    target: '#top h1'
  },
  {
    title: 'Tell us your trade',
    body: 'Add the skills you can teach and the skills you want to learn in the Find my swap form.',
    target: '#match form'
  },
  {
    title: 'Get matched',
    body: 'See students whose skills line up with yours. Use “Fill with example data” in the form to try the matcher.',
    target: '#match .results'
  },
  {
    title: 'Browse the community',
    body: 'Search students and use the category filters to find skills across the campus community.',
    target: ['#browse .search', '#browse .cats']
  },
  {
    title: 'Track your swaps',
    body: 'Follow your points, level, and badges as you complete swaps.',
    target: '#swaps .level'
  }
];

const targetsFor = step => {
  const selectors = Array.isArray(step.target) ? step.target : [step.target];
  return selectors.map(selector => document.querySelector(selector)).filter(Boolean);
};

function firstAvailable(start, direction) {
  for (let index = start; index >= 0 && index < STEPS.length; index += direction) {
    if (targetsFor(STEPS[index]).length) return index;
  }
  return -1;
}

function targetBounds(elements) {
  const rects = elements.map(element => element.getBoundingClientRect());
  return {
    left: Math.min(...rects.map(rect => rect.left)),
    top: Math.min(...rects.map(rect => rect.top)),
    right: Math.max(...rects.map(rect => rect.right)),
    bottom: Math.max(...rects.map(rect => rect.bottom))
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

export default function Tour({ open, step, onStepChange, onClose }) {
  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  const previousFocus = useRef(null);
  const wasOpen = useRef(false);
  const [spotlight, setSpotlight] = useState(null);
  const [popover, setPopover] = useState(null);
  const stepInfo = STEPS[step];

  useEffect(() => {
    if (!open) return;
    if (!stepInfo || !targetsFor(stepInfo).length) {
      const next = firstAvailable(step + 1, 1);
      if (next < 0) onClose();
      else onStepChange(next);
      return;
    }

    const targets = targetsFor(stepInfo);
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    targets[0].scrollIntoView?.({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center', inline: 'nearest' });

    const updatePosition = () => {
      const bounds = targetBounds(targets);
      const padding = 10;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const left = clamp(bounds.left - padding, 0, viewportWidth);
      const top = clamp(bounds.top - padding, 0, viewportHeight);
      const right = clamp(bounds.right + padding, left, viewportWidth);
      const bottom = clamp(bounds.bottom + padding, top, viewportHeight);
      setSpotlight({ left, top, right, bottom });

      const cardWidth = Math.min(380, viewportWidth - 24);
      const cardHeight = dialogRef.current?.getBoundingClientRect().height || 280;
      const gap = 16;
      const roomRight = viewportWidth - bounds.right - gap - 12;
      const roomLeft = bounds.left - gap - 12;
      let cardLeft;
      let cardTop;
      if (roomRight >= cardWidth) {
        cardLeft = bounds.right + gap;
        cardTop = clamp(bounds.top + (bounds.bottom - bounds.top - cardHeight) / 2, 12, viewportHeight - cardHeight - 12);
      } else if (roomLeft >= cardWidth) {
        cardLeft = bounds.left - cardWidth - gap;
        cardTop = clamp(bounds.top + (bounds.bottom - bounds.top - cardHeight) / 2, 12, viewportHeight - cardHeight - 12);
      } else {
        cardLeft = (viewportWidth - cardWidth) / 2;
        cardTop = Math.max(12, viewportHeight - cardHeight - 12);
      }
      setPopover({ left: cardLeft, top: cardTop, width: cardWidth });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    const frame = window.requestAnimationFrame?.(updatePosition);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      if (frame) window.cancelAnimationFrame?.(frame);
    };
  }, [open, step, stepInfo, onClose, onStepChange]);

  useEffect(() => {
    if (open) {
      if (!wasOpen.current) {
        previousFocus.current = document.activeElement;
        wasOpen.current = true;
      }
      titleRef.current?.focus();
    } else if (wasOpen.current) {
      wasOpen.current = false;
      if (previousFocus.current?.isConnected) previousFocus.current.focus();
    }
  }, [open, step]);

  if (!open || !stepInfo) return null;

  function move(direction) {
    const next = firstAvailable(step + direction, direction);
    if (next < 0) {
      if (direction > 0) onClose();
      return;
    }
    onStepChange(next);
  }

  function trapFocus(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const buttons = [...dialogRef.current.querySelectorAll('button:not(:disabled)')];
    if (!buttons.length) return;
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    const activeIndex = buttons.indexOf(document.activeElement);
    if (event.shiftKey && activeIndex <= 0) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (activeIndex < 0 || activeIndex === buttons.length - 1)) {
      event.preventDefault();
      first.focus();
    }
  }

  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const x = spotlight?.left ?? 0;
  const y = spotlight?.top ?? 0;
  const r = spotlight?.right ?? 0;
  const b = spotlight?.bottom ?? 0;
  const shadeStyle = { position: 'fixed', background: 'rgba(15, 13, 28, .68)' };

  return (
    <div className="tour-layer">
      {spotlight && (
        <>
          <div className="tour-shade" style={{ ...shadeStyle, left: 0, top: 0, width: '100%', height: y }} aria-hidden="true" />
          <div className="tour-shade" style={{ ...shadeStyle, left: 0, top: b, width: '100%', height: viewportHeight - b }} aria-hidden="true" />
          <div className="tour-shade" style={{ ...shadeStyle, left: 0, top: y, width: x, height: b - y }} aria-hidden="true" />
          <div className="tour-shade" style={{ ...shadeStyle, left: r, top: y, width: viewportWidth - r, height: b - y }} aria-hidden="true" />
          <div className="tour-spotlight" style={{ left: x, top: y, width: r - x, height: b - y }} aria-hidden="true" />
        </>
      )}
      <section
        className="tour-popover"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tourTitle"
        aria-describedby="tourDescription"
        onKeyDown={trapFocus}
        style={popover || { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      >
        <p className="tour-count">Step {step + 1} of {STEPS.length}</p>
        <h2 id="tourTitle" ref={titleRef} tabIndex="-1">{stepInfo.title}</h2>
        <p id="tourDescription">{stepInfo.body}</p>
        <div className="tour-actions">
          <button className="btn ghost small" type="button" disabled={firstAvailable(step - 1, -1) < 0} onClick={() => move(-1)}>Back</button>
          <button className="btn ghost small" type="button" onClick={onClose}>Skip</button>
          <button className="btn primary small" type="button" onClick={() => move(1)}>Next</button>
        </div>
      </section>
    </div>
  );
}
