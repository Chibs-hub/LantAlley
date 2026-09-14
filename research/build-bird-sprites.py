"""Normalize the approved ImageGen uguisu strips into game sprite sheets."""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


SOURCES = {
    "uguisu-fly-v1.png": "exec-ea82571d-bb95-45b9-b3ee-156019186378.png",
    "uguisu-perch-v1.png": "exec-95f0b518-02e0-4e69-9163-59a6df67d58f.png",
    "uguisu-preen-v1.png": "exec-b38ac911-fd18-40d7-a714-1a006a1aba55.png",
    "uguisu-sing-v1.png": "exec-64e26f85-87e0-4cdc-80d5-63622cd5cecc.png",
    "uguisu-sleep-v1.png": "exec-08f06e06-2fe0-41f3-b5da-7da054e7fd5c.png",
    "uguisu-peck-v1.png": "exec-8c903729-821b-4ae6-803a-281ec146ce35.png",
}

CELL = 256
SCALE = 0.45
REST_BASELINE = 232


def flood_background(candidate: np.ndarray) -> np.ndarray:
    height, width = candidate.shape
    background = np.zeros((height, width), dtype=bool)
    queue: deque[tuple[int, int]] = deque()

    def add(y: int, x: int) -> None:
        if candidate[y, x] and not background[y, x]:
            background[y, x] = True
            queue.append((y, x))

    for x in range(width):
        add(0, x)
        add(height - 1, x)
    for y in range(height):
        add(y, 0)
        add(y, width - 1)

    while queue:
        y, x = queue.popleft()
        if y:
            add(y - 1, x)
        if y + 1 < height:
            add(y + 1, x)
        if x:
            add(y, x - 1)
        if x + 1 < width:
            add(y, x + 1)
    return background


def largest_component(mask: np.ndarray) -> np.ndarray:
    height, width = mask.shape
    seen = np.zeros((height, width), dtype=bool)
    best: list[tuple[int, int]] = []
    for start_y, start_x in zip(*np.nonzero(mask & ~seen)):
        if seen[start_y, start_x]:
            continue
        component: list[tuple[int, int]] = []
        queue = deque([(int(start_y), int(start_x))])
        seen[start_y, start_x] = True
        while queue:
            y, x = queue.popleft()
            component.append((y, x))
            for next_y, next_x in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if (0 <= next_y < height and 0 <= next_x < width
                        and mask[next_y, next_x] and not seen[next_y, next_x]):
                    seen[next_y, next_x] = True
                    queue.append((next_y, next_x))
        if len(component) > len(best):
            best = component
    result = np.zeros((height, width), dtype=np.uint8)
    for y, x in best:
        result[y, x] = 255
    return result


def extract_subject(frame: Image.Image) -> Image.Image:
    if frame.mode == "RGBA":
        rgba = frame.copy()
        alpha = np.array(rgba.getchannel("A"), dtype=np.uint8)
        rgba.putalpha(Image.fromarray(np.where(alpha < 20, 0, alpha).astype(np.uint8), "L"))
    else:
        rgb = np.array(frame.convert("RGB"), dtype=np.uint8)
        values = rgb.astype(np.int16)
        chroma = values.max(axis=2) - values.min(axis=2)
        # ImageGen's baked checker is almost neutral, including its faint
        # compression fringe. A wider neutral band removes those connected
        # squares while the bird's warm outline keeps the subject enclosed.
        neutral = chroma <= 24
        # Closed shapes around the feet can trap checker pixels that a border
        # flood cannot reach. Bright neutral pixels are checker everywhere in
        # these two RGB sources, so clear those enclosed pockets as well.
        background = flood_background(neutral) | (neutral & (values.mean(axis=2) >= 165))
        alpha = largest_component(~background)
        rgba_array = np.dstack((rgb, alpha))
        rgba = Image.fromarray(rgba_array, "RGBA")

    bounds = rgba.getchannel("A").getbbox()
    if not bounds:
        raise ValueError("No subject found in generated frame")
    return rgba.crop(bounds)


def resize_premultiplied(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    array = np.array(image.convert("RGBA"), dtype=np.float32)
    alpha = array[:, :, 3] / 255.0
    premultiplied = array[:, :, :3] * alpha[:, :, None]
    resized_alpha = np.array(
        Image.fromarray(alpha, "F").resize(size, Image.Resampling.LANCZOS),
        dtype=np.float32,
    )
    resized_rgb = np.stack([
        np.array(Image.fromarray(premultiplied[:, :, channel], "F").resize(
            size, Image.Resampling.LANCZOS), dtype=np.float32)
        for channel in range(3)
    ], axis=2)
    safe_alpha = np.maximum(resized_alpha, 1 / 255)
    straight_rgb = np.clip(resized_rgb / safe_alpha[:, :, None], 0, 255)
    output = np.dstack((straight_rgb, np.clip(resized_alpha * 255, 0, 255))).astype(np.uint8)
    output[output[:, :, 3] < 3] = 0
    return Image.fromarray(output, "RGBA")


def build_sheet(source: Path, destination: Path, flying: bool) -> None:
    image = Image.open(source)
    boundaries = [round(index * image.width / 4) for index in range(5)]
    sheet = Image.new("RGBA", (CELL * 4, CELL), (0, 0, 0, 0))
    for index in range(4):
        frame = image.crop((boundaries[index], 0, boundaries[index + 1], image.height))
        subject = extract_subject(frame)
        size = (max(1, round(subject.width * SCALE)), max(1, round(subject.height * SCALE)))
        subject = resize_premultiplied(subject, size)
        left = index * CELL + (CELL - subject.width) // 2
        top = (CELL - subject.height) // 2 if flying else REST_BASELINE - subject.height
        if top < 4 or top + subject.height > CELL - 4:
            raise ValueError(f"{source.name} frame {index + 1} does not fit its cell")
        sheet.alpha_composite(subject, (left, top))
    destination.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(destination, "PNG", optimize=True, compress_level=9)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_dir", type=Path)
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()
    for output_name, source_name in SOURCES.items():
        build_sheet(
            args.source_dir / source_name,
            args.output_dir / output_name,
            flying=output_name == "uguisu-fly-v1.png",
        )
        print(output_name)


if __name__ == "__main__":
    main()
