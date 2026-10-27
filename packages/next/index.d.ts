// Generic on purpose: importing `next` types here can resolve to a different
// copy of Next than the app's, which breaks the app's type check.
type ConfigFunction<T> = (phase: string, context: any) => T | Promise<T>;

export declare function withFrameweave<T extends object>(
  config?: T | ConfigFunction<T>,
): (phase: string, context: any) => Promise<T>;
