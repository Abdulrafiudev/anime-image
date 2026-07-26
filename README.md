# Anime Studio

A premium, frontend-first web app that turns a photo into an anime-style
character. Upload → pick a style → fine-tune → convert → compare before/after →
download or share. No accounts, no database, nothing stored.

Built with **Next.js (App Router) + TypeScript**, **Tailwind CSS v4**, and
**Framer Motion**. Image generation runs through **OpenAI** (`gpt-image-1`)
behind a swappable provider adapter, called from a thin server proxy so the API
key never reaches the browser.

---

## Getting started

```bash
npm install
cp .env.example .env.local   # then paste your OPENAI_API_KEY
npm run dev
```

Open http://localhost:3000.

> Without an `OPENAI_API_KEY`, the whole UI works (upload, styles, controls,
> states) but the Convert call returns a friendly "provider not configured"
> error. Add a server-side key to generate real images.

### Environment variables

| Var                   | Required | Notes                                                             |
| --------------------- | -------- | ----------------------------------------------------------------- |
| `OPENAI_API_KEY`      | yes      | OpenAI key. **Server-side only** — never `NEXT_PUBLIC_`.          |
| `OPENAI_IMAGE_MODEL`  | no       | Override the model. Default `gpt-image-1`.                        |
| `IMAGE_PROVIDER`      | no       | `openai` (default) or `fal`.                                      |
| `FAL_KEY` / `FAL_MODEL` | no     | Only if `IMAGE_PROVIDER=fal`.                                     |

> **Note on `gpt-image-1`:** OpenAI may require your organization to be
> [verified](https://platform.openai.com/settings/organization/general) before
> this model is available, and high-quality edits can take ~15–40s. On Vercel
> Hobby (60s function cap) prefer the medium/low **Line & detail** setting or
> upgrade the plan; `maxDuration` in the route is set to 120s.

---

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add `OPENAI_API_KEY` under **Project → Settings → Environment Variables**.
3. Deploy. No other configuration is needed.

---

## Project map

```
app/
  layout.tsx              Fonts (Space Grotesk + Plus Jakarta Sans) + metadata
  page.tsx                Single-page orchestrator: session state + flow
  globals.css             Tailwind import + brand design tokens  ← BRAND LIVES HERE
  api/convert/route.ts    Secure proxy → provider adapter (reads OPENAI_API_KEY)
components/               UI: Upload, StyleGallery, Controls, BeforeAfter, …
lib/
  presets.ts              STYLE_PRESETS array  ← ADD STYLES HERE
  controls.ts             Fine controls → provider-agnostic params (+ prompt words)
  image.ts                Client-side validate + downscale
  convertClient.ts        Client calls to the proxy
  providers/
    types.ts              ImageProvider adapter contract
    openai.ts             OpenAI gpt-image-1 adapter (default)  ← SWAP PROVIDER HERE
    fal.ts                fal.ai adapter (alternative)
    index.ts              Provider selection (IMAGE_PROVIDER)
```

---

## How to…

### Add or edit a style preset

Everything lives in [`lib/presets.ts`](lib/presets.ts). Append one object to
`STYLE_PRESETS`:

```ts
{
  id: "my-style",
  label: "My Style",
  description: "One-line description shown on the card.",
  basePrompt: "generic descriptive prompt (no franchises/studios by name)",
  negativePrompt: SHARED_NEGATIVE,        // or a custom string
  recommendedStrength: 0.6,               // 0.30–0.90
  swatch: ["#7C5CFF", "#FF5FA2"],         // first color tints the card thumbnail
}
```

The gallery, requests, and defaults pick it up automatically — no other edits.

### Swap the image provider

Adapters implement the `ImageProvider` contract in
[`lib/providers/types.ts`](lib/providers/types.ts). To move to Replicate,
Stability, or back to fal.ai:

1. Create `lib/providers/<name>.ts` exporting a `create…Provider()` that
   implements `generate()`.
2. Add a case in [`lib/providers/index.ts`](lib/providers/index.ts) and select
   it with `IMAGE_PROVIDER`.

The UI and the `/api/convert` route are provider-agnostic and need no changes.
Note that `gpt-image-1` has no numeric strength/guidance knob — stylization is
carried in the prompt (see below); the `strength`/`guidanceScale` fields exist
for diffusion adapters like fal.

### Change the brand tokens

The brand colors and fonts are defined once in
[`app/globals.css`](app/globals.css) under `@theme`. Change a value there and it
propagates everywhere. Fonts are loaded via `next/font/google` in
[`app/layout.tsx`](app/layout.tsx). The UI is a flat, light theme — no gradients
or drop shadows.

---

## How the fine controls map

Defined in [`lib/controls.ts`](lib/controls.ts). The four 0–100 sliders fold into
provider-agnostic params **and** prompt wording, so they work whether or not the
provider has numeric knobs:

- **Stylization strength** → diffusion `strength` (0.30–0.90) **and** a
  "subtle ↔ fully reimagined" phrase in the prompt (what OpenAI uses).
- **Identity preservation** → caps `strength` and appends likeness-preserving
  prompt terms.
- **Line & detail** → guidance scale, an OpenAI `quality` hint, and detail
  prompt terms.
- **Color vibrancy** → muted ↔ vivid prompt terms.

---

## Admin usage dashboard (optional)

A password-protected dashboard at **`/admin`** shows successful/failed
generation counts, a per-style breakdown, a **world map** of where requests come
from, a top-countries list, and a recent-activity table (time, source IP,
location, device, style, result, latency). It's **metadata only — no images are
stored.** Device (type · OS · browser) is parsed from the request's User-Agent
by a tiny dependency-free parser (`lib/useragent.ts`).

The map uses `react-simple-maps` with the world geography bundled locally from
the `world-atlas` data package (no runtime CDN). Geolocation comes free from
Vercel's `x-vercel-ip-*` request headers — so **the map only populates once
deployed on Vercel** (there's no geo data on `localhost`).

- Storage is **Upstash Redis** over its REST API (`lib/analytics.ts`) — a managed
  serverless datastore reached with plain `fetch`, no server to run and no extra
  dependency. Create a free DB at <https://console.upstash.com>.
- Set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` to start collecting.
  If unset, tracking **no-ops** and conversions are unaffected.
- Set `ADMIN_PASSWORD` to enable the dashboard. If unset, `/admin` is fully
  locked (the API returns 503). The password is checked server-side in
  `app/api/admin/stats/route.ts`.
- Recent events are capped at the last 200 (via `LTRIM`); counters persist.

> **Privacy:** IP addresses are personal data (GDPR/CCPA). If you enable this,
> update the app's "nothing stored" copy, add a privacy notice, keep `/admin`
> access-controlled, and set a retention policy that suits your obligations.

---

## Notes on privacy & security

- In default mode the API key is read server-side in `app/api/convert/route.ts`
  and never sent to the browser.
- Bring-your-own-key is **off by default**, kept only in React state (memory),
  never written to `localStorage`. It is sent with a single conversion request
  and used server-side only for that call (OpenAI can't be called directly from
  the browser due to CORS).
- Uploaded photos are downscaled client-side and processed on demand — they are
  **never stored**.
- If the admin dashboard is enabled, per-generation **metadata** (timestamp,
  style, source IP, latency, success/fail) is stored in Upstash — see above.
