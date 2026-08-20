// Janela deslizante em memória do isolate. Não é Redis, mas corta rajadas
// de enumeração na mesma instância. Combinado com auth, o atacante precisa
// de muitas contas.

const buckets = new Map();

export function consumeRateLimit(key, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || now - current.start >= windowMs) {
    buckets.set(key, { start: now, count: 1 });
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}
