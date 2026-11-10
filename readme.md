# The I'M 50! Show

Website for The I'M 50! Show with Paul Burfitt (formerly F*CK! I'M 50 / Fi50).

Canonical public site: https://im50show.com

im50show.com is the main address for The I'M 50! Show. These domains stay attached to the same
Worker and 301-redirect to https://im50show.com, keeping the path: www.im50show.com,
theim50show.com, fi50.show and fuckim50.show (and their www. versions). See `src/worker.js`.

## Production deploy

One Cloudflare Worker: `fuckim50`.

Deploy only from GitHub `main`, using the production Wrangler file:

```bash
npx wrangler deploy --config wrangler.production.jsonc
```

`wrangler.jsonc` matches that production Worker so a plain `wrangler deploy` cannot recreate the deleted `fuckim50-preview` Worker. Prefer the `--config wrangler.production.jsonc` command so the custom domains (`im50show.com`, `www.im50show.com`, `theim50show.com`, `fi50.show`, `fuckim50.show`) stay attached.

Do not create preview Workers. Do not rename `fuckim50`.
