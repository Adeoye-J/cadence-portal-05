"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * A fact that exists only in the browser, such as whether passkeys are supported. It is false on the server and while
 * the page hydrates, so the server's HTML and the first client render agree. After that it is the real value.
 */
export function useBrowserFeature(check: () => boolean): boolean {
  return useSyncExternalStore(subscribe, check, () => false);
}
