# Matrix AI UI project specification

## Product

Matrix AI UI is a reusable React and TypeScript system for responsive cinematic digital-human scenes composed from portrait, code-rain, particle, lighting, environment, camera, interface, and typography layers.

It must support an independently importable component library, a visual scene builder, responsive hero/artwork use, social and vertical compositions, Vite and Next.js consumption, and progressive enhancement with a reliable non-WebGL fallback.

## Technical constraints

- React and TypeScript are required.
- Tailwind CSS is the styling system.
- Vite powers the builder/demo.
- Public scene configuration is renderer-independent.
- Browser-only code is isolated from import-safe package surfaces.
- WebGL is optional; Canvas, SVG, or CSS fallback is mandatory.
- Rendering must produce a stable readable initial frame and observe reduced motion.

## Exclusions

No backend, database, auth, payments, account system, cloud storage, analytics, chat, collaboration, NFTs/tokens, or unrelated cyberpunk features.

## Asset representation

Default subject imagery must be non-sexualized and dignified. No proprietary or unlicensed production artwork may be introduced; default visuals cannot require an external image service.
