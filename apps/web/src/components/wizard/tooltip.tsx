'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  disabled?: boolean;
  children: ReactNode;
}

export function Tooltip({ content, disabled, children }: TooltipProps) {
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLSpanElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const [isClient, setIsClient] = useState(false);

  const getClampedPosition = (anchorRect: DOMRect, tooltipRect?: DOMRect) => {
    const margin = 8;
    const gap = 8;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const tooltipW = tooltipRect?.width ?? 0;
    const tooltipH = tooltipRect?.height ?? 0;

    const centerX = anchorRect.left + anchorRect.width / 2;

    const preferBelowTop = anchorRect.bottom + gap;
    const preferAboveTop = anchorRect.top - gap - tooltipH;

    const canFitBelow = preferBelowTop + tooltipH + margin <= viewportH;
    const top = canFitBelow ? preferBelowTop : Math.max(margin, preferAboveTop);

    let left = centerX - tooltipW / 2;
    left = Math.max(margin, Math.min(left, viewportW - tooltipW - margin));

    return { left, top };
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  const updatePosition = () => {
    const el = anchorRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    setPos(getClampedPosition(rect, tooltipRect));
  };

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();
    const raf = window.requestAnimationFrame(updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  return (
    <span
      ref={anchorRef}
      className="inline-flex"
      onMouseEnter={() => {
        if (disabled) return;
        setIsOpen(true);
      }}
      onMouseLeave={() => setIsOpen(false)}
    >
      {children}
      {isClient &&
        isOpen &&
        !disabled &&
        createPortal(
          <span
            role="tooltip"
            ref={tooltipRef}
            className="pointer-events-none fixed z-[9999] w-max max-w-[260px] rounded-md px-3 py-2 text-sm shadow-lg"
            style={{
              left: pos.left,
              top: pos.top,
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              color: 'white',
            }}
          >
            {content}
          </span>,
          document.body
        )}
    </span>
  );
}
