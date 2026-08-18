// src/lib/polling/sequentialPoller.ts
//
// Scheduler de polling SECUENCIAL (mitigación temporal, ver nota al final del archivo).
//
// Reglas que implementa (hotfix a la tormenta de solicitudes de getProjectData):
//  1. Solo puede existir una llamada del fetcher en vuelo a la vez.
//  2. La siguiente ejecución se programa únicamente después de que la anterior termina
//     (éxito, error o timeout) — nunca con setInterval de reloj fijo.
//  3. Cada intento se aborta solo (AbortController) si supera `timeoutMs`.
//  4. En éxito, espera `successDelayMs` antes de la siguiente consulta.
//  5. En error, aplica backoff según `errorDelaysMs` (se mantiene en el último valor
//     si hay más errores que entradas en el array), con jitter aleatorio.
//  6. Se pausa cuando `isVisible()` es false o `isOnline()` es false — no programa
//     ningún timer mientras está pausado, para no acumular trabajo en segundo plano.
//  7. Al recuperar visibilidad/conexión, dispara una ejecución inmediata SI Y SOLO SI
//     no hay ninguna petición en vuelo.

export interface SequentialPollerOptions<T> {
  /** Ejecuta un intento de fetch. Debe respetar `signal` para poder ser abortado. */
  fetcher: (signal: AbortSignal) => Promise<T>;
  onSuccess: (data: T) => void;
  onError?: (error: unknown) => void;
  /** Espera tras un éxito antes del siguiente intento. Default 15000ms. */
  successDelayMs?: number;
  /** Backoff tras error, en ms. Default [15000, 30000, 60000]. Se clampa al último valor. */
  errorDelaysMs?: number[];
  /** Timeout por intento antes de abortar. Default 10000ms. */
  timeoutMs?: number;
  /** Proporción de jitter aleatorio aplicado a cada delay (±). Default 0.2 (±20%). */
  jitterRatio?: number;
  isOnline?: () => boolean;
  isVisible?: () => boolean;
  setTimeoutFn?: typeof setTimeout;
  clearTimeoutFn?: typeof clearTimeout;
}

export interface SequentialPoller {
  /** Arranca el scheduler. `immediate: true` corre el primer intento ya mismo. */
  start: (opts?: { immediate?: boolean }) => void;
  /** Detiene el scheduler, aborta cualquier request en vuelo y limpia timers. */
  stop: () => void;
  /** Fuerza un intento inmediato si no hay ninguno en vuelo (usado en resume). */
  triggerImmediate: () => void;
  isInFlight: () => boolean;
  isStopped: () => boolean;
}

const DEFAULT_SUCCESS_DELAY_MS = 15000;
const DEFAULT_ERROR_DELAYS_MS = [15000, 30000, 60000];
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_JITTER_RATIO = 0.2;

const defaultIsOnline = () =>
  typeof navigator === "undefined" ? true : navigator.onLine;

const defaultIsVisible = () =>
  typeof document === "undefined" ? true : document.visibilityState === "visible";

function applyJitter(baseMs: number, jitterRatio: number): number {
  if (jitterRatio <= 0) return baseMs;
  // Jitter simétrico: [baseMs * (1 - jitterRatio), baseMs * (1 + jitterRatio)]
  const spread = baseMs * jitterRatio;
  const offset = (Math.random() * 2 - 1) * spread;
  return Math.max(0, Math.round(baseMs + offset));
}

export function createSequentialPoller<T>(
  options: SequentialPollerOptions<T>
): SequentialPoller {
  const {
    fetcher,
    onSuccess,
    onError,
    successDelayMs = DEFAULT_SUCCESS_DELAY_MS,
    errorDelaysMs = DEFAULT_ERROR_DELAYS_MS,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    jitterRatio = DEFAULT_JITTER_RATIO,
    isOnline = defaultIsOnline,
    isVisible = defaultIsVisible,
    setTimeoutFn = setTimeout,
    clearTimeoutFn = clearTimeout,
  } = options;

  let stopped = true;
  let inFlight = false;
  let errorAttempt = 0;
  let pendingTimer: ReturnType<typeof setTimeout> | null = null;
  let currentController: AbortController | null = null;

  const clearPendingTimer = () => {
    if (pendingTimer !== null) {
      clearTimeoutFn(pendingTimer);
      pendingTimer = null;
    }
  };

  const nextErrorDelay = (): number => {
    const idx = Math.min(errorAttempt, errorDelaysMs.length - 1);
    const base = errorDelaysMs[idx] ?? DEFAULT_ERROR_DELAYS_MS[DEFAULT_ERROR_DELAYS_MS.length - 1];
    errorAttempt += 1;
    return applyJitter(base, jitterRatio);
  };

  const scheduleNext = (delayMs: number) => {
    clearPendingTimer();
    if (stopped) return;
    pendingTimer = setTimeoutFn(() => {
      pendingTimer = null;
      runCycle();
    }, delayMs);
  };

  const runCycle = () => {
    if (stopped || inFlight) return;

    if (!isOnline() || !isVisible()) {
      // Pausado: no programamos timer. Se retoma vía triggerImmediate()
      // cuando vuelva la visibilidad/conexión.
      return;
    }

    inFlight = true;
    const controller = new AbortController();
    currentController = controller;
    const abortTimer = setTimeoutFn(() => controller.abort(), timeoutMs);

    fetcher(controller.signal)
      .then((data) => {
        clearTimeoutFn(abortTimer);
        inFlight = false;
        currentController = null;
        errorAttempt = 0;
        onSuccess(data);
        scheduleNext(applyJitter(successDelayMs, jitterRatio));
      })
      .catch((error) => {
        clearTimeoutFn(abortTimer);
        inFlight = false;
        currentController = null;
        onError?.(error);
        scheduleNext(nextErrorDelay());
      });
  };

  const start: SequentialPoller["start"] = (opts) => {
    stopped = false;
    if (opts?.immediate) {
      runCycle();
    } else {
      scheduleNext(applyJitter(successDelayMs, jitterRatio));
    }
  };

  const stop = () => {
    stopped = true;
    clearPendingTimer();
    currentController?.abort();
    currentController = null;
  };

  const triggerImmediate = () => {
    if (stopped || inFlight) return;
    clearPendingTimer();
    runCycle();
  };

  return {
    start,
    stop,
    triggerImmediate,
    isInFlight: () => inFlight,
    isStopped: () => stopped,
  };
}

// ---------------------------------------------------------------------------
// NOTA: esta es una mitigación TEMPORAL de la tormenta de solicitudes.
// La solución definitiva es reemplazar el polling de GET_PROJECT_DATA (pesado,
// 4 niveles de profundidad) por una consulta de "revisión" liviana
// (ej. `projects(filters:{...}){ updatedAt } floors(...){ updatedAt }`) y solo
// disparar GET_PROJECT_DATA completa cuando esa revisión cambie respecto a la
// guardada en el store. Ver auditoría de src/services/project.service.ts.
// ---------------------------------------------------------------------------
