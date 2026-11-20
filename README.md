# A Little Blue Garden

A five-scene interactive gift, built mobile-first for 390 × 844, plus a heart QR card generator.

1. **The Secret Garden**: fireflies, the blue garden fades in, a butterfly arrives, then the greeting.
2. **The Journey Back to You**: the camera drifts through the garden and the message plays line by line. Tap to move ahead. A light trail leads to a glowing butterfly.
3. **The Blue Rose**: touch the rose and the bud opens into the full bloom, with a light ring and glowing petals.
4. **Three Little Butterflies**: tap each one to read its message. Each butterfly then lands on a flower.
5. **The Final Letter**: tap the seal, the envelope opens and the letter comes out. "Make the Garden Bloom" lights every rose, sends petals up, flies butterflies through and draws a heart of light.

## Change the words

All the text, colours and asset names live in `src/config/content.ts`. No other file needs editing.

## Run it locally

```bash
npm install
npm run dev        # opens on your phone too, via the Network URL
```

`?scene=3` on the URL jumps straight to a scene while you're checking things.

## Deploy to GitHub Pages

1. Create a new repo on GitHub, e.g. `my-butterfly`.
2. Push this folder to its `main` branch:
   ```bash
   git init && git add . && git commit -m "A little blue garden"
   git branch -M main
   git remote add origin https://github.com/<you>/my-butterfly.git
   git push -u origin main
   ```
3. On GitHub, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
4. The workflow in `.github/workflows/deploy.yml` builds and publishes the site. It takes 1–2 minutes. The link is `https://<you>.github.io/my-butterfly/`.

Paths are relative (`base: './'`), so any repo name works.

## Make the heart QR card

Open `https://<you>.github.io/my-butterfly/qr.html`. It fills in the site's own link. Press **Create card**, then **Download PNG** (1200 × 1600).

The QR is standard: error correction H, a 4-module quiet zone, and dark modules on white. The heart is only a frame around it, so no modules are bent into a heart shape. Scan the PNG from a second phone before you hand it over.

## Assets

`reference/` holds the original photos. `tools/process_images.py` cuts them out, recolours them blue and splits each butterfly down its body line so the wings can flap. The results go to `public/images/`. To rerun it: `pip install pillow numpy scipy`, then `python3 tools/process_images.py` from the repo root.

## Notes

- The bloom is a crossfade between two real photos: the half-open stemmed rose opens into the full rose through a radial unfurl and a slight counter-rotation. It is not a petal-by-petal simulation, because the source photos are still images.
- Ambient sound is synthesised in the browser and only starts when the speaker button is tapped.
- Reduced-motion settings are respected: fewer particles, no parallax and shorter transitions.
- Fonts load from Google Fonts. If they fail, the site falls back to Georgia and the system sans.
- No accounts, no tracking, no backend.
