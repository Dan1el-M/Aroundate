export async function api<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
): Promise<T> {
  const bootstrap = await fetch("/api/bootstrap", { cache: "no-store" });
  if (!bootstrap.ok)
    throw new Error("No se pudo iniciar la sesión de privacidad.");
  const context = (await bootstrap.json()) as { csrf: string };
  const response = await fetch(
    path.startsWith("/auth/") ? path : `/api/${path}`,
    {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": context.csrf,
        ...options.headers,
      },
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
      cache: "no-store",
    },
  );
  if (!response.ok) {
    const problem = (await response
      .json()
      .catch(() => ({ detail: "request_failed" }))) as {
      detail?: string;
      errors?: { field: string; message: string }[];
    };
    throw new Error(
      problem.errors
        ?.map((error) => `${error.field}: ${error.message}`)
        .join("; ") ??
        problem.detail ??
        "request_failed",
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
