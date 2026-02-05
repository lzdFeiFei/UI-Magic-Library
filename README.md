# UI Magic Library

Interactive UI demo gallery built with Next.js. Each demo can define its own configurable controls, making it easy to
explore visual variants and share presets.

## Local dev

```bash
npm install
npm run dev
```

Open `http://localhost:3000` to view the gallery.

## Adding a demo

1. Put the demo assets in `public/demos/<demo-name>`.
2. Register the demo in `lib/demo-registry.ts` with metadata and controls.
3. Optional: wire the demo HTML to read query parameters for live control.

## Deploy

Deploy directly on Vercel. The project is a standard Next.js app.
