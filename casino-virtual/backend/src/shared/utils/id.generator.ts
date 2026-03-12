import { randomUUID } from 'crypto';

/**
 * Genera un UUID v4 usando el módulo crypto nativo de Node.js
 * Esto evita problemas con Jest y uuid package
 */
export function generateId(): string {
  return randomUUID();
}
