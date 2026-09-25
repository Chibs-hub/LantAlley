# Art needed: Inn shift board (guest portraits)

**Written 2026-09-25.** Status: nothing below has been made yet.

## What the shift board is

A proposed new format for the Inn episodes. The old format asks the episode's
questions one after another. The shift board is played as one evening shift
(18:00-20:00) instead:

- Each question belongs to a guest (or to Kon at the desk).
- Guests appear on a board as room tags with a patience bar.
- The player chooses whom to help and in what order.

The playable mock covers Episode 1 only. It is not in the repo; the owner has
the link (a private claude.ai artifact).

In the mock, guests are emoji placeholders. Building the shift board into the
game starts with Episode 1 and has not been approved yet, but it needs these
portraits.

## Needed: guest portraits (Episode 1) - 12 images

- **Format:** 512x512 transparent WebP, head and shoulders.
- **Style:** the same as the fox art. `assets/fox/*-transparent-v2.webp` is also
  512x512 transparent WebP.
- **Folder:** `assets/inn/guests/`.
- **Three faces per guest:**
  - `normal`: waiting.
  - `worried`: low on time, or after a wrong answer.
  - `happy`: after being helped.

| Files | Who | Notes |
|---|---|---|
| `tanaka-normal.webp`, `tanaka-worried.webp`, `tanaka-happy.webp` | 三番 田中様ご夫妻 | Older couple, both in one image. Here for the fireworks. |
| `sato-normal.webp`, `sato-worried.webp`, `sato-happy.webp` | 五番 佐藤様 | Adult on a work trip, in a yukata after the bath. |
| `yamada-normal.webp`, `yamada-worried.webp`, `yamada-happy.webp` | 二番 山田様ご家族 | Parents and a small child, in one image. |
| `group-normal.webp`, `group-worried.webp`, `group-happy.webp` | 玄関 団体の幹事 | Tour group leader holding a small flag. |

**Optional:** `yamada-child.webp` (512x512), the child alone. It is used for the
ending line 「ざぶとん、そろってる！」.

## Already in the repo (not needed)

- **Scenes:** `assets/inn/scenes/lobby.jpg`, `guest-room.jpg`, `office.jpg`,
  `courtyard.jpg`.
- **Room task:** `assets/inn/room-empty-v4.webp` and
  `assets/inn/room-objects-v2.webp` (towels, cushions).
- **Kon's poses:** `assets/fox/fox-neutral-idle-`, `fox-listening-`,
  `fox-try-again-` and `fox-celebration-transparent-v2.webp`.

## GUI: no images needed

These are all drawn in CSS and already work in the mock:

- room tags;
- the 済 stamp;
- flying coins;
- lanterns;
- fireworks;
- the 松/竹/梅 rank seal;
- the red time-running-out warnings.

Wood or washi-paper textures could be added later for looks, but they are
optional.

## Later

Episodes 2-4 will need their own guests. List them here once each episode's
questions are assigned to characters.
