# F*CK! I'M 50

Website for the F*CK! I'M 50 podcast with Paul Burfitt.

Canonical public site: https://fi50.show

fi50.show is the main address for everything, because it gets past email profanity filters. The site itself
uses the full show name. Anything that travels through email (sender name, subject lines, addresses) uses Fi50.

The other addresses (fuckim50.show, conditionsapply.show, www.conditionsapply.show) stay attached to the same
Worker and 301-redirect to https://fi50.show, keeping the path. See `src/worker.js`.

## Production deploy

One Cloudflare Worker: `fuckim50`.

Deploy only from GitHub `main`, using the production Wrangler file:

```bash
npx wrangler deploy --config wrangler.production.jsonc
```

`wrangler.jsonc` matches that production Worker so a plain `wrangler deploy` cannot recreate the deleted `fuckim50-preview` Worker. Prefer the `--config wrangler.production.jsonc` command so the custom domains (`fi50.show`, `fuckim50.show`, `conditionsapply.show`, `www.conditionsapply.show`) stay attached.

Do not create preview Workers. Do not rename `fuckim50`.
