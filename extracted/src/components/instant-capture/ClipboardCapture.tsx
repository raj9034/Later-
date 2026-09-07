import React, { useState, useEffect, useRef } from 'react';
import { useLater } from '../../context/LaterContext';
import { CapturePreview } from './CapturePreview';
import { Clipboard, X, ArrowUpRight, Check, CreditCard as Edit2, RefreshCw } from 'lucide-react';

interface ClipboardCaptureProps {
  onClose: () => void;
}

const SAMPLE_PRESETS = [
  {
    label: 'YouTube link',
    text: 'https://youtube.com/watch?v=dQw4w9WgXcQ - Japanese Woodworking Masterclass',
  },
  {
    label: 'Article URL',
    text: 'https://news.ycombinator.com/item?id=40000000 Deep Dive into Local AI Models',
  },
  {
    label: 'Meeting note',
    text: 'Review Q3 financial roadmap with Sarah tomorrow at 10am',
  },
];

export const ClipboardCapture: React.FC<ClipboardCaptureProps> = ({ onClose }) => {
  const { saveItem } = useLater();
  const [clipboardContent, setClipboardContent] = useState<string>('');
  const [isReadingClipboard, setIsReadingClipboard] = useState<boolean>(true);
  const [clipboardDenied, setClipboardDenied] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const readSystemClipboard = async () => {
    setIsReadingClipboard(true);
    setClipboardDenied(false);

    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        setClipboardDenied(true);
        setIsReadingClipboard(false);
        return;
      }

      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setClipboardContent(text.trim());
        setClipboardDenied(false);
      } else {
        setClipboardContent('');
        setClipboardDenied(true);
      }
    } catch (err) {
      console.warn('Clipboard read failed or permission denied:', err);
      setClipboardDenied(true);
    } finally {
      setIsReadingClipboard(false);
    }
  };

  useEffect(() => {
    readSystemClipboard();
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleSaveToLater = () => {
    const textToSave = clipboardContent.trim();
    if (!textToSave) return;

    // Send through the real AI categorization pipeline
    saveItem(textToSave);
    setIsSaved(true);

    // Auto collapse after confirmation
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      onClose();
    }, 1100);
  };

  const handleUsePreset = (presetText: string) => {
    setClipboardContent(presetText);
    setClipboardDenied(false);
    setIsEditing(false);
  };

  if (isSaved) {
    return (
      <div id="instant-capture-success-card" className="p-5 flex flex-col items-center justify-center text-center py-7 text-[var(--text-primary)]">
        <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--success)] mb-2.5 elevation-2 animate-in zoom-in-95 duration-200">
          <Check className="w-5 h-5 stroke-[2.5]" />
        </div>
        <h4 className="text-sm font-medium text-[var(--text-primary)] mb-0.5">Saved for Later</h4>
        <p className="text-[11px] text-[var(--text-secondary)] font-mono">Analyzed and scheduled for Later</p>
      </div>
    );
  }

  return (
    <div id="instant-capture-card-inner" className="p-4 flex flex-col gap-3.5 text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--divider)] pb-2.5">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--text-secondary)]">
            <Clipboard className="w-3 h-3 text-[var(--text-secondary)]" />
          </div>
          <span className="type-label text-[var(--text-primary)]">
            Save from clipboard
          </span>
        </div>
        <button
          id="instant-capture-close-btn"
          type="button"
          onClick={onClose}
          className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Detected Content Preview or Fallback Paste Input */}
      {clipboardContent && !isEditing ? (
        <div className="flex flex-col gap-2">
          <CapturePreview content={clipboardContent} />
          <div className="flex items-center justify-between type-caption">
            <button
              id="instant-capture-edit-btn"
              type="button"
              onClick={() => {
                setIsEditing(true);
                setTimeout(() => textareaRef.current?.focus(), 50);
              }}
              className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit text</span>
            </button>

            <button
              id="instant-capture-reload-btn"
              type="button"
              onClick={readSystemClipboard}
              className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Re-read clipboard</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="type-caption text-[var(--text-secondary)] flex items-center justify-between">
            <span>Paste or enter copied link/text</span>
            <button
              type="button"
              onClick={readSystemClipboard}
              className="text-[var(--accent)] hover:underline cursor-pointer font-medium"
            >
              Paste from clipboard
            </button>
          </div>
          <textarea
            id="instant-capture-custom-textarea"
            ref={textareaRef}
            value={clipboardContent}
            onChange={(e) => setClipboardContent(e.target.value)}
            placeholder="Paste URL, YouTube video, notes, or article..."
            rows={3}
            className="w-full rounded-2xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--accent)] px-3.5 py-2.5 type-body-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] resize-none outline-none font-body leading-relaxed"
          />

          {/* Quick Simulation Presets for Testing */}
          <div className="flex flex-col gap-1 pt-1">
            <span className="type-label text-[var(--text-tertiary)]">
              Quick Test Simulation
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleUsePreset(preset.text)}
                  className="px-2.5 py-1 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] type-caption text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer text-left"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--divider)]">
        <button
          id="instant-capture-cancel-btn"
          type="button"
          onClick={onClose}
          className="px-3.5 py-1.5 rounded-xl type-body-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          id="instant-capture-save-btn"
          type="button"
          onClick={handleSaveToLater}
          disabled={!clipboardContent.trim()}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl type-button transition-all ${
            clipboardContent.trim()
              ? 'bg-[var(--accent)] text-[var(--bg)] font-semibold hover:opacity-90 cursor-pointer shadow-xs active:scale-[0.98]'
              : 'bg-[var(--surface)] text-[var(--text-tertiary)] cursor-not-allowed border border-[var(--border)]'
          }`}
        >
          <span>Save to Later</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
