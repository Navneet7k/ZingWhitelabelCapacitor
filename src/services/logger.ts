// ── Set to false to silence all app logs in production ──
export const LOGGING_ENABLED = true;

export const log   = (...args: unknown[]) => { if (LOGGING_ENABLED) console.log(...args); };
export const warn  = (...args: unknown[]) => { if (LOGGING_ENABLED) console.warn(...args); };
export const error = (...args: unknown[]) => { if (LOGGING_ENABLED) console.error(...args); };
