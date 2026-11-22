import type { Route } from "next";

/**
 * Narrows an internal path built at runtime, such as `/projects/${id}`, to Next's typed Route.
 * Use it only for paths built from this app's own route patterns and IDs. Never pass user input through it.
 */
export function routeTo(path: string): Route {
  return path as Route;
}
