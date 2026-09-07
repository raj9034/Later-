import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ClipboardCapture } from './ClipboardCapture';

export const InstantCaptureOrb: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [yPosition, setYPosition] = useState<number>(240); // default px from top
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const orbRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartYRef = useRef<number>(0);
  const orbStartYRef = useRef<number>(0);
  const dragMovedDistanceRef = useRef<number>(0);

  // Clean close handler that always ensures drag state is cleared
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsDragging(false);
    isDraggingRef.current = false;
    dragMovedDistanceRef.current = 0;
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setIsDragging(false);
    isDraggingRef.current = false;
    dragMovedDistanceRef.current = 0;
  }, []);

  // Handle outside clicks to close the card cleanly
  useEffect(() => {
    if (!isOpen) return;

    const handleDocumentClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;

      // If click was inside the capture card or the orb itself, do not close
      if (cardRef.current && cardRef.current.contains(target)) {
        return;
      }
      if (orbRef.current && orbRef.current.contains(target)) {
        return;
      }

      handleClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleDocumentClick, true);
    document.addEventListener('touchstart', handleDocumentClick, true);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick, true);
      document.removeEventListener('touchstart', handleDocumentClick, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  // Global window listeners for drag to avoid pointer capture unmount glitches
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;

      const deltaY = e.clientY - dragStartYRef.current;
      dragMovedDistanceRef.current = Math.abs(deltaY);

      const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
      const newY = Math.max(50, Math.min(windowHeight - 100, orbStartYRef.current + deltaY));
      setYPosition(newY);
    };

    const handleGlobalPointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag with primary mouse button / single touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartYRef.current = e.clientY;
    orbStartYRef.current = yPosition;
    dragMovedDistanceRef.current = 0;
  };

  const handleOrbClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If user was dragging vertically (more than 6px), do not trigger toggle
    if (dragMovedDistanceRef.current > 6) {
      dragMovedDistanceRef.current = 0;
      return;
    }

    dragMovedDistanceRef.current = 0;
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  return (
    <div
      id="instant-capture-orb-root"
      ref={orbRef}
      className="fixed right-0 z-50 select-none"
      style={{ top: `${yPosition}px` }}
    >
      {/* Floating Expandable Card */}
      {isOpen && (
        <div
          id="instant-capture-card"
          ref={cardRef}
          className="mr-3 w-[330px] sm:w-[360px] rounded-2xl glass-modal elevation-4 animate-in fade-in zoom-in-95 duration-150 relative z-50 text-[var(--text-primary)]"
        >
          <ClipboardCapture onClose={handleClose} />
        </div>
      )}

      {/* Floating Orb Trigger (Hidden when card is expanded, visible when collapsed) */}
      {!isOpen && (
        <div className="relative group flex items-center pr-3">
          {/* Subtle Hover Tooltip */}
          <div className="absolute right-14 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-[11px] font-mono px-2.5 py-1 rounded-md elevation-2">
            Instant Capture
          </div>

          <button
            id="instant-capture-orb-btn"
            type="button"
            onClick={handleOrbClick}
            onPointerDown={handlePointerDown}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] theme-fab-btn opacity-90 hover:opacity-100 press-interactive ${
              isDragging ? 'scale-105' : 'active:scale-[0.97]'
            }`}
            title="Later Instant Capture - Tap to capture clipboard"
            aria-label="Instant Capture"
          >
            {/* Minimal Later Brand Glyph: Tactile Concentric Precision Ring */}
            <div className="relative flex items-center justify-center pointer-events-none">
              <div className="w-5 h-5 rounded-full border border-white/60 flex items-center justify-center group-hover:border-white/90 transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-white/90 group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
