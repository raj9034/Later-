import { registerPlugin, PluginListenerHandle, Capacitor } from '@capacitor/core';

export interface SharedContent {
  hasContent: boolean;
  type?: 'text' | 'image';
  value?: string; // Raw text/URL or base64 image data URL
  text?: string;  // Accompanying note or text for image shares
  subject?: string; // Subject / title if provided by the sharing app
}

export interface SendIntentPlugin {
  getSharedContent(): Promise<SharedContent>;
  clearSharedContent(): Promise<void>;
  addListener(
    eventName: 'sharedContentReceived',
    listenerFunc: (data: SharedContent) => void
  ): Promise<PluginListenerHandle>;
  removeAllListeners(): Promise<void>;
}

export const SendIntent = registerPlugin<SendIntentPlugin>('SendIntent');

export interface ParsedSharedPayload {
  text?: string;
  image?: string;
  sourceType: 'text' | 'image' | 'link';
}

/**
 * Normalizes incoming Android share sheet intent data to pre-fill the UniversalCapture UI.
 * Reuses the same link/note detection principles used by saveItem() and analyzeContent().
 */
export function parseSharedContent(data: SharedContent): ParsedSharedPayload | null {
  if (!data || !data.hasContent) return null;

  if (data.type === 'image' && data.value) {
    return {
      image: data.value,
      text: data.text?.trim() || '',
      sourceType: 'image',
    };
  }

  // Text or link sharing
  const rawText = data.value?.trim() || data.subject?.trim() || '';
  if (!rawText) return null;

  // Determine if it is a link or note
  const isUrl =
    /^https?:\/\//i.test(rawText) ||
    /^(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/i.test(rawText);

  return {
    text: rawText,
    sourceType: isUrl ? 'link' : 'text',
  };
}
