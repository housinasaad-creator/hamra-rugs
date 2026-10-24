# HAMRA · Rug House

A multi-page website for a rug house, in Arabic, Turkish and English.

- **Home** – a live 3D loom weaving a rug knot by knot, a weaving studio, collections, a rug whose pile you can brush with the cursor or finger, and a design teaser.
- **Collection** – 360 designs with filters (style, colour, size, shape, material, weave, pile, room, collection), search and sorting. No prices.
- **Rug page** – large rug, watch it woven, brush the pile, specifications, sizes, similar rugs, and a room view (living room, bedroom, hallway; day, dusk and night).
- **Atelier** – six living canvases that follow a rug from fleece to floor.
- **Design studio** – choose style, shape, size and palette, fine-tune six colours, shuffle the pattern, watch it woven, and send the description to the designers.
- **Contact** – request form that carries the rugs picked with the heart and the studio design.

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
| `js/loom3d.js` | the three.js loom scene (falls back to the 2D loom without WebGL) |
| `js/weave.js` | the 2D loom |
| `js/i18n.js` | all text in EN / TR / AR |
| `assets/rooms/` | rendered rooms, light maps and `rooms.json` (floor-plane matrices) used by the room view |

Rugs are drawn procedurally on a knot grid, so every pattern, colour and size can be redrawn on the fly.
