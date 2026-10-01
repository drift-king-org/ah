import { Container } from "@cloudflare/containers";

export class Pid1 extends Container {
  defaultPort = 8080;
  sleepAfter = "5m";

  onStop({ exitCode, reason }) {
    console.log(JSON.stringify({
      "@type": "http://www.w3.org/ns/sosa/Observation",
      "http://www.w3.org/ns/sosa/madeBySensor": { "@id": "https://drift-king.org/ah/cloudflare-pid-rs/worker" },
      "http://www.w3.org/ns/sosa/hasFeatureOfInterest": { "@id": "https://drift-king.org/ah/cloudflare-pid-rs/image/v2" },
      "http://www.w3.org/ns/sosa/observedProperty": { "@id": "https://drift-king.org/ah/cloudflare-pid-rs/property/exit" },
      "http://www.w3.org/ns/sosa/hasResult": {
        "https://drift-king.org/ah/cloudflare-pid-rs/exitCode": exitCode,
        "https://drift-king.org/ah/cloudflare-pid-rs/reason": reason,
      },
      "http://www.w3.org/ns/sosa/resultTime": new Date().toISOString(),
    }));
  }
}

function page(status) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Drift King</title>
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
</head>
<body style="margin:0;background:#0b0b0b;color:#eee;font-family:sans-serif;text-align:center;padding:2rem;">
<img src="/drift-king.webp" alt="Drift King" style="max-width:100%;height:auto;">
<pre style="text-align:left;display:inline-block;background:#111;padding:1rem;border-radius:8px;">${JSON.stringify(status, null, 2)}</pre>
</body>
</html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const accept = request.headers.get("Accept") || "";
    const wantsPage =
      request.method === "GET" && url.pathname === "/" && accept.includes("text/html");
    if (!wantsPage) {
      return env.PID1.getByName("one").fetch(request);
    }
    const statusResponse = await env.PID1.getByName("one").fetch(request);
    const status = await statusResponse.json();
    return new Response(page(status), {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
};
