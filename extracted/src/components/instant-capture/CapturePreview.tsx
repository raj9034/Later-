import React from 'react';
import { Route as Youtube, Globe, FileText, CircleCheck as CheckCircle2, Link2, Sparkles } from 'lucide-react';

interface CapturePreviewProps {
  content: string;
}

export const CapturePreview: React.FC<CapturePreviewProps> = ({ content }) => {
  const trimmed = content.trim();

  // Detect Type
  const isYouTube = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)/i.test(trimmed);
  const isUrl = /^https?:\/\/[^\s]+$/i.test(trimmed);
  const isMultiLine = trimmed.includes('\n');

  let domain = '';
  if (isUrl || isYouTube) {
    try {
      const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      domain = parsed.hostname.replace(/^www\./, '');
    } catch {
      domain = 'web link';
    }
  }

  return (
    <div id="instant-capture-preview-box" className="rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] p-3 text-xs text-[var(--text-primary)]">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          {isYouTube ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--destructive)] border border-[var(--border)] text-[10px] font-mono font-medium">
              <Youtube className="w-3 h-3 text-[var(--destructive)]" />
              <span>YouTube Video</span>
            </span>
          ) : isUrl ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--accent)] border border-[var(--border)] text-[10px] font-mono font-medium">
              <Globe className="w-3 h-3 text-[var(--accent)]" />
              <span>{domain || 'Web Link'}</span>
            </span>
          ) : isMultiLine ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] text-[10px] font-mono font-medium">
              <FileText className="w-3 h-3 text-[var(--text-secondary)]" />
              <span>Multi-line Note</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--success)] border border-[var(--border)] text-[10px] font-mono font-medium">
              <Sparkles className="w-3 h-3 text-[var(--success)]" />
              <span>Copied Text</span>
            </span>
          )}
        </div>
        <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
          {trimmed.length} chars
        </span>
      </div>

      <div className="text-[var(--text-primary)] line-clamp-3 font-sans break-words text-[13px] leading-relaxed">
        {trimmed}
      </div>
    </div>
  );
};
