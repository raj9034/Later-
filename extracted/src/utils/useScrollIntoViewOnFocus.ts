/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useCallback } from 'react';

/**
 * Focus-scroll safeguard for on-screen keyboards.
 * When an input or textarea receives focus, scrolls the element smoothly into view
 * after a brief delay (~300ms) to allow the virtual keyboard animation to initiate.
 */
export function handleScrollIntoViewOnFocus(
  e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement> | HTMLElement,
  delay: number = 300
) {
  const element = 'currentTarget' in e ? e.currentTarget : e;
  if (!element || typeof element.scrollIntoView !== 'function') return;

  setTimeout(() => {
    // Only scroll if the element is still focused and connected in the DOM
    if (document.activeElement === element && element.isConnected) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, delay);
}

/**
 * Reusable hook returning an onFocus handler for input/textarea elements.
 */
export function useScrollIntoViewOnFocus(delay: number = 300) {
  const onFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      handleScrollIntoViewOnFocus(e, delay);
    },
    [delay]
  );

  return onFocus;
}
