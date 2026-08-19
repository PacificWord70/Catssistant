# Avatar art layers

Drop hand-drawn PNGs here to replace the code-drawn placeholder avatar.
**Everything in this folder except this README is gitignored** — art stays
local and never lands in a commit.

Nothing here is required. With no files present, `CatAvatar` draws its
placeholder and the app works normally.

## Expected filenames

Body, picked by the cat's coat length:

| File | Used for |
| --- | --- |
| `base-short.png` | Short coats |
| `base-medium.png` | Medium coats, and any cat with no coat length recorded |
| `base-long.png` | Long coats |
| `base-hairless.png` | Hairless cats |

Markings, layered over the body and matched to the cat's pattern. All optional
— a missing pattern file just renders a plain coloured cat:

| File | Used for |
| --- | --- |
| `pattern-tabby.png` | Tabby |
| `pattern-calico.png` | Calico |
| `pattern-tortoiseshell.png` | Tortoiseshell |
| `pattern-tuxedo.png` | Tuxedo |
| `pattern-colorpoint.png` | Colorpoint |

`Solid` needs no file — it means no markings layer.

## How to draw them

**Draw in greyscale.** Each layer is tinted at runtime to the cat's coat
colour, so one body serves all six colours. Drawing in colour would fight the
tint. Mid-grey works best: near-black leaves no room to lighten, near-white
loses shading.

**Keep shading, avoid flat fills.** Tinting uses `multiply`, which preserves
the values in the artwork. Flat greys come out flat.

**Square canvas, transparent background.** The layers are composited into a
square and scaled to whatever size the avatar is rendered at. 512×512 is
comfortable. Anything outside the drawing must be fully transparent — the
alpha channel is what stops the tint spilling into a coloured block.

**Register the layers.** Body and markings are drawn at identical coordinates,
so stripes only land in the right place if both files use the same framing.
Easiest approach is one master file with a layer per PNG, all exported at the
same size.

The tinting is in `lib/avatar/artLayers.ts` and the fallback drawing is in
`lib/avatar/placeholder.ts`.
