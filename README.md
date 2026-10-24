# HAMRA · Rug House

A multi-page website for a rug house, in Arabic, Turkish and English.

- **Home** – a one-screen hero (a looping video of a 3D loom weaving a rug, knot by knot), a weaving studio, collections, a rug whose pile you can brush with the cursor or finger, and the story teaser.
- **Collection** – 360 designs with four simple filters (style, colour, size, shape), search and sorting. No prices.
- **Rug page** – large rug, watch it woven, brush the pile, specifications, sizes, similar rugs, and a room view (living room, bedroom, hallway; day, dusk and night).
- **Atelier** – six living canvases that follow a rug from fleece to floor.
- **About us** – the story of the house in four chapters, each with a living canvas, plus numbers and values.
- **Contact** – request form that carries the rugs picked with the heart.

## Make the contact buttons work

Open `js/config.js` and fill in the channels you use:

```js
export const CONFIG = { WA_NUMBER: '905551112233', EMAIL: 'hello@example.com' };
```

With a WhatsApp number the request opens WhatsApp with the message ready; with only an e-mail it opens the mail app; with neither it shows the message to copy.

## Run locally

It is a static site (ES modules, no build step). Serve the folder with any static server and open `index.html`:

```bash
python -m http.server 8000
```

## Structure

| Path | What it holds |
| --- | --- |
| `js/rugkit.js` | the rug generator: 13 pattern families, 32 palettes, border motifs, painting, the 360-item catalogue |
| `js/loom3d.js` | the three.js loom scene; the hero shows its recorded loop (`assets/hero/`), the live scene runs with `?hero=3d` |
| `js/hero-video.js` | plays the hero loop only while visible and frees it when far away |
| `js/weave.js` | the 2D loom |
| `js/i18n.js` | all text in EN / TR / AR |
| `assets/rooms/` | rendered rooms, light maps and `rooms.json` (floor-plane matrices) used by the room view |

Rugs are drawn procedurally on a knot grid, so every pattern, colour and size can be redrawn on the fly.
