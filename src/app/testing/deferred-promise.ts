export interface DeferredPromise<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T | PromiseLike<T>) => void;
  readonly reject: (reason?: unknown) => void;
}

export function deferred<T>(): DeferredPromise<T> {
  const controls: {
    resolve: DeferredPromise<T>['resolve'];
    reject: DeferredPromise<T>['reject'];
  } = {
    resolve: () => {
      throw new Error('Deferred promise was resolved before initialization.');
    },
    reject: () => {
      throw new Error('Deferred promise was rejected before initialization.');
    },
  };
  const promise = new Promise<T>((resolve, reject) => {
    controls.resolve = resolve;
    controls.reject = reject;
  });

  return { promise, resolve: controls.resolve, reject: controls.reject };
}
