import { handleRegisterOptions, handleRegisterVerify } from "./routes/register";
import {
  handleAuthOptions,
  handleAuthVerify,
} from "./routes/authenticate";
import {
  handleAuthorizeKeyOptions,
  handleAuthorizeKeyVerify,
} from "./routes/authorize-key";

function addEmbedHeaders(response: Response, requestOrigin: string | null): Response {
  const headers = new Headers(response.headers);
  headers.set("Content-Security-Policy", "frame-ancestors *");
  headers.delete("X-Frame-Options");

  if (requestOrigin) {
    headers.set("Access-Control-Allow-Origin", requestOrigin);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": origin ?? "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (request.method === "POST") {
      let response: Response;
      switch (url.pathname) {
        case "/api/register/options":
          response = await handleRegisterOptions(request, env);
          return addEmbedHeaders(response, origin);
        case "/api/register/verify":
          response = await handleRegisterVerify(request, env);
          return addEmbedHeaders(response, origin);
        case "/api/auth/options":
          response = await handleAuthOptions(request, env);
          return addEmbedHeaders(response, origin);
        case "/api/auth/verify":
          response = await handleAuthVerify(request, env);
          return addEmbedHeaders(response, origin);
        case "/api/authorize-key/options":
          response = await handleAuthorizeKeyOptions(request, env);
          return addEmbedHeaders(response, origin);
        case "/api/authorize-key/verify":
          response = await handleAuthorizeKeyVerify(request, env);
          return addEmbedHeaders(response, origin);
      }
    }

    const response = await env.ASSETS.fetch(request);
    return addEmbedHeaders(response, origin);
  },
} satisfies ExportedHandler<Env>;
