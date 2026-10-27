# *Conditions Apply

Website for the *Conditions Apply podcast with Paul Burfitt (formerly F*CK! I'M 50 / Fi50).

## Site structure

- `public/site.css` — all styles (palette and type tokens at the top).
- `public/site.js` — mobile menu and the hero slider.
- Hero slider: up to three artworks on the home and guest pages. Each slide is an `<li class="hero-slide">`
  with wide art (2046 × 768) in `public/assets/hero/`, plus an optional square phone version
  (add class `has-square` and a `<source media="(max-width: 699px)">`).
- Episode covers are generated in CSS (`.ep-tile`); share images live in `public/assets/og/`.

Canonical public site: https://conditionsapply.show

The old addresses (fi50.show, fuckim50.show) and www.conditionsapply.show stay attached to the same Worker
and 301-redirect to https://conditionsapply.show, keeping the path. See `src/worker.js`.

## Production deploy

One Cloudflare Worker: `fuckim50`.

Deploy only from GitHub `main`, using the production Wrangler file:

```bash
npx wrangler deploy --config wrangler.production.jsonc
```

`wrangler.jsonc` matches that production Worker so a plain `wrangler deploy` cannot recreate the deleted `fuckim50-preview` Worker. Prefer the `--config wrangler.production.jsonc` command so the custom domains (`conditionsapply.show`, `www.conditionsapply.show`, `fi50.show`, `fuckim50.show`) stay attached.

Do not create preview Workers. Do not rename `fuckim50`.
