# F*CK! I'M 50

Website for the F*CK! I'M 50 podcast.

Canonical public site: https://fi50.show

## Production deploy

One Cloudflare Worker: `fuckim50`.

Deploy only from GitHub `main`, using the production Wrangler file:

```bash
npx wrangler deploy --config wrangler.production.jsonc
```

`wrangler.jsonc` matches that production Worker so a plain `wrangler deploy` cannot recreate the deleted `fuckim50-preview` Worker. Prefer the `--config wrangler.production.jsonc` command so custom domains `fi50.show` and `fuckim50.show` stay attached.

Do not create preview Workers. Do not rename `fuckim50`.
