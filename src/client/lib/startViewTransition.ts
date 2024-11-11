import { flushSync } from "react-dom";

export function startViewTransition(fn: () => void) {
  if (document.startViewTransition) {
    document.startViewTransition(() => {
      flushSync(fn);
    });
  } else {
    fn();
  }
}
