// src/lib/polling/sequentialPoller.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createSequentialPoller } from "./sequentialPoller";

describe("createSequentialPoller", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("nunca solapa una petición colgada con la siguiente programada", async () => {
    let concurrentCalls = 0;
    let maxConcurrentCalls = 0;
    let callCount = 0;
    // Cada fetch queda "colgado" hasta que resolvemos manualmente su promesa.
    // A propósito IGNORA `signal` (simula un fetch que no coopera con
    // AbortController): así probamos que la garantía de "nunca se solapa"
    // depende solo de encadenar la próxima corrida en el .then/.catch, no de
    // que el timeout interno logre liberar la petición.
    const pendingResolvers: Array<() => void> = [];

    const fetcher = vi.fn((): Promise<number> => {
      callCount += 1;
      concurrentCalls += 1;
      maxConcurrentCalls = Math.max(maxConcurrentCalls, concurrentCalls);

      return new Promise<number>((resolve) => {
        pendingResolvers.push(() => {
          concurrentCalls -= 1;
          resolve(callCount);
        });
      });
    });

    const onSuccess = vi.fn();

    const poller = createSequentialPoller<number>({
      fetcher,
      onSuccess,
      successDelayMs: 15000,
      errorDelaysMs: [15000, 30000, 60000],
      timeoutMs: 10000,
      jitterRatio: 0, // determinístico para el test
      isOnline: () => true,
      isVisible: () => true,
    });

    poller.start({ immediate: true });

    // Primer fetch en vuelo.
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(poller.isInFlight()).toBe(true);

    // Avanzamos el reloj mucho más allá del intervalo "normal" (15s) mientras
    // el primer fetch sigue colgado: NO debe dispararse una segunda llamada,
    // porque la siguiente ejecución solo se programa cuando la anterior termina.
    await vi.advanceTimersByTimeAsync(60000);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(maxConcurrentCalls).toBe(1);

    // Resolvemos el primer fetch (colgado) recién ahora.
    pendingResolvers.shift()!();
    await vi.advanceTimersByTimeAsync(0);

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(poller.isInFlight()).toBe(false);

    // Recién después del successDelayMs se programa el segundo intento.
    await vi.advanceTimersByTimeAsync(14999);
    expect(fetcher).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(maxConcurrentCalls).toBe(1);

    poller.stop();
  });

  it("aborta el fetch al superar el timeout y aplica backoff creciente en errores sucesivos", async () => {
    let abortCount = 0;
    const fetcher = vi.fn((signal: AbortSignal) => {
      return new Promise<unknown>((_resolve, reject) => {
        signal.addEventListener("abort", () => {
          abortCount += 1;
          reject(new Error("timeout"));
        });
      });
    });

    const onError = vi.fn();

    const poller = createSequentialPoller<unknown>({
      fetcher,
      onSuccess: () => {},
      onError,
      successDelayMs: 15000,
      errorDelaysMs: [15000, 30000, 60000],
      timeoutMs: 10000,
      jitterRatio: 0,
      isOnline: () => true,
      isVisible: () => true,
    });

    poller.start({ immediate: true });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(abortCount).toBe(0);

    // Se aborta a los 10s (timeoutMs).
    await vi.advanceTimersByTimeAsync(10000);
    expect(abortCount).toBe(1);
    expect(onError).toHaveBeenCalledTimes(1);

    // 1er error -> espera 15s antes del siguiente intento.
    await vi.advanceTimersByTimeAsync(14999);
    expect(fetcher).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetcher).toHaveBeenCalledTimes(2);

    // 2do error (también timeoutea) -> backoff sube a 30s.
    await vi.advanceTimersByTimeAsync(10000); // timeout del 2do intento
    expect(onError).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(29999);
    expect(fetcher).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetcher).toHaveBeenCalledTimes(3);

    poller.stop();
  });

  it("se pausa cuando no hay conexión/visibilidad y no vuelve a llamar hasta triggerImmediate", async () => {
    let online = false;
    const fetcher = vi.fn(async () => 42);
    const onSuccess = vi.fn();

    const poller = createSequentialPoller<number>({
      fetcher,
      onSuccess,
      successDelayMs: 15000,
      jitterRatio: 0,
      isOnline: () => online,
      isVisible: () => true,
    });

    poller.start({ immediate: true });
    // Offline: el ciclo inicial no debe llamar al fetcher.
    expect(fetcher).toHaveBeenCalledTimes(0);

    await vi.advanceTimersByTimeAsync(120000);
    expect(fetcher).toHaveBeenCalledTimes(0);

    // Se recupera la conexión: el listener externo llamaría a triggerImmediate().
    online = true;
    poller.triggerImmediate();
    await vi.advanceTimersByTimeAsync(0);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);

    poller.stop();
  });

  it("triggerImmediate no hace nada si ya hay una petición en vuelo", async () => {
    let resolveFetch: (() => void) | null = null;
    const fetcher = vi.fn(
      () =>
        new Promise<number>((resolve) => {
          resolveFetch = () => resolve(1);
        })
    );

    const poller = createSequentialPoller<number>({
      fetcher,
      onSuccess: () => {},
      jitterRatio: 0,
      isOnline: () => true,
      isVisible: () => true,
    });

    poller.start({ immediate: true });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(poller.isInFlight()).toBe(true);

    // Mientras está en vuelo, triggerImmediate no debe disparar una segunda llamada.
    poller.triggerImmediate();
    poller.triggerImmediate();
    expect(fetcher).toHaveBeenCalledTimes(1);

    resolveFetch!();
    await vi.advanceTimersByTimeAsync(0);

    poller.stop();
  });
});
