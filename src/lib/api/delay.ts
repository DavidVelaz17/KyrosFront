/**
 * Simulates network latency so components already handle async/loading states.
 * Swap the functions in lib/api for real `fetch` calls to the Spring Boot backend later
 * without touching any calling component.
 */
export function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
