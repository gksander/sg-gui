export function startViewTransition(fn: () => void) {
  if (document.startViewTransition) {
    document.startViewTransition(fn);
  } else {
    fn();
  }
}
