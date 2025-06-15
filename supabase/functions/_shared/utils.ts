import { corsHeaders } from "./cors.ts";

export function handleCorsOptions() {
  return new Response("ok", { headers: corsHeaders });
}

export function createErrorResponse(message: string, status = 400) {
  return new Response(
    JSON.stringify({
      error: message,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    },
  );
}

export function createSuccessResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}
