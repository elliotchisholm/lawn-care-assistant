/**
 * The current SQL HTTP endpoint puts transaction errors in a result envelope
 * and sends already-decoded boolean cells. Neon expects HTTP errors and PG text
 * boolean cells. Normalize only these batch wire-format differences.
 */
export async function fetchNeonBatch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init);
  if (!response.ok) return response;
  const body = await response.clone().json().catch(() => null);
  if (!Array.isArray(body?.results)) return response;
  const failure = body.results.find((result: any) =>
    ["ERROR", "FATAL", "PANIC"].includes(result?.severity)
    && typeof result.message === "string");
  if (failure) {
    return Response.json(failure, { status: 400 });
  }
  let changed = false;
  for (const result of body.results) {
    if (!Array.isArray(result.fields) || !Array.isArray(result.rows)) continue;
    for (const row of result.rows) {
      if (!Array.isArray(row)) continue;
      result.fields.forEach((field: any, index: number) => {
        if (field.dataTypeID === 16 && typeof row[index] === "boolean") {
          row[index] = row[index] ? "t" : "f";
          changed = true;
        }
      });
    }
  }
  return changed ? Response.json(body) : response;
}
