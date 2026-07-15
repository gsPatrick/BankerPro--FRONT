'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import BrandMark from '@/components/BrandMark/BrandMark';
import {
  PRODUCT_TOUR_STEPS,
  markProductTourCompleted,
} from '@/lib/productTour';
import styles from './ProductTour.module.css';

function isVisible(el) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  // Sidebar may be display:none on mobile via media query
  if (rect.width < 2 || rect.height < 2) return false;
  return true;
}

function findTarget(targets = []) {
  for (const key of targets) {
    const nodes = document.querySelectorAll(`[data-tour="${key}"]`);
    for (const node of nodes) {
      if (isVisible(node)) return node;
    }
  }
  return null;
}

function padRect(rect, pad = 8) {
  return {
    top: Math.max(8, rect.top - pad),
    left: Math.max(8, rect.left - pad),
    width: Math.min(window.innerWidth - 16, rect.width + pad * 2),
    height: Math.min(window.innerHeight - 16, rect.height + pad * 2),
  };
}

/**
 * Tour guiado pós-onboarding: blur + spotlight + card de indicação.
 */
export default function ProductTour({ open, onClose }) {
  const [index, setIndex] = useState(0);
  const [spot, setSpot] = useState(null);
  const [cardPos, setCardPos] = useState({ top: 24, left: 24 });
  const [resolvedSteps, setResolvedSteps] = useState(PRODUCT_TOUR_STEPS);

  const finish = useCallback(() => {
    markProductTourCompleted();
    onClose?.();
  }, [onClose]);

  // Filtra passos sem alvo visível (ex.: desktop sem bottom nav)
  useEffect(() => {
    if (!open) return undefined;

    const available = PRODUCT_TOUR_STEPS.filter((step) => findTarget(step.targets));
    setResolvedSteps(available.length ? available : PRODUCT_TOUR_STEPS.slice(0, 1));
    setIndex(0);
    return undefined;
  }, [open]);

  const step = resolvedSteps[index] || resolvedSteps[0];
  const total = resolvedSteps.length;
  const isLast = index >= total - 1;

  const measure = useCallback(() => {
    if (!open || !step) return;
    const el = findTarget(step.targets);
    if (!el) {
      setSpot(null);
      return;
    }

    el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    const rect = padRect(el.getBoundingClientRect(), 10);
    setSpot(rect);

    const cardW = Math.min(340, window.innerWidth - 32);
    const cardH = 200;
    const gap = 14;
    const placement = step.placement || 'bottom';

    let top = rect.top + rect.height + gap;
    let left = rect.left;

    if (placement === 'right' && rect.left + rect.width + gap + cardW < window.innerWidth - 12) {
      top = Math.max(12, rect.top);
      left = rect.left + rect.width + gap;
    } else if (placement === 'left' && rect.left - gap - cardW > 12) {
      top = Math.max(12, rect.top);
      left = rect.left - gap - cardW;
    } else if (placement === 'top' || top + cardH > window.innerHeight - 12) {
      top = Math.max(12, rect.top - gap - cardH);
      left = rect.left;
    }

    left = Math.min(Math.max(16, left), window.innerWidth - cardW - 16);
    top = Math.min(Math.max(12, top), window.innerHeight - cardH - 16);
    setCardPos({ top, left });
  }, [open, step]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const t = window.setTimeout(measure, 80);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, measure, index]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !step) return null;

  return (
    <div className={styles.root} role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <div className={styles.scrim} onClick={finish} aria-hidden="true" />

      {spot ? (
        <div
          className={styles.spotlight}
          style={{
            top: spot.top,
            left: spot.left,
            width: spot.width,
            height: spot.height,
          }}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={styles.card}
        style={{ top: cardPos.top, left: cardPos.left }}
      >
        <div className={styles.cardHead}>
          <BrandMark className={styles.mark} />
          <span className={styles.progress}>
            {index + 1} / {total}
          </span>
        </div>

        <h2 id="tour-title" className={styles.title}>
          {step.title}
        </h2>
        <p className={styles.body}>{step.body}</p>

        <div className={styles.actions}>
          <button type="button" className={styles.skip} onClick={finish}>
            Pular
          </button>
          <button
            type="button"
            className={styles.next}
            onClick={() => {
              if (isLast) finish();
              else setIndex((value) => value + 1);
            }}
          >
            {isLast ? 'Começar a usar' : 'Próximo'}
          </button>
        </div>
      </aside>
    </div>
  );
}
