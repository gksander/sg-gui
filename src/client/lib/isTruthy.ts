export function isTruthy<T>(value: T | boolean): value is T {
  return !!value;
}
