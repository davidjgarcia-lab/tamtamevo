import { Skia, type SkCanvas } from "@shopify/react-native-skia";
import { emptyRoom, FLOOR_FINISHES, FURNITURE, newGame, WALL_FINISHES } from "@tamtam/core";
import { buildRoomPicture, drawFloor, drawFurniture, drawLandscape, drawWall, roomGeom } from "./roomArt";

/**
 * Renders every environment asset of the web prototype to PNG for the Unity project
 * (tools/export-unity-assets.mjs saves them into Assets/TamTam/Art/Environments/NestHouse).
 * Same drawing code as the game, so Unity gets exactly the current nest-house look.
 */
export interface ExportedAsset { path: string; png: string; meta?: Record<string, unknown> }
const LANDSCAPES = ["forest", "stars", "sea", "mountains", "aurora", "waterfall", "desert", "volcano"];

function render(w: number, h: number, draw: (c: SkCanvas) => void): string {
  const surf = Skia.Surface.Make(Math.ceil(w), Math.ceil(h))!;
  const c = surf.getCanvas();
  c.clear(Skia.Color("transparent"));
  draw(c);
  surf.flush();
  return surf.makeImageSnapshot().encodeToBase64();
}

export function exportEnvironmentAssets(): ExportedAsset[] {
  const out: ExportedAsset[] = [];
  // Wall and floor finishes (tileable horizontally at this width).
  for (const it of WALL_FINISHES) out.push({ path: `Walls/${it.id}.png`, png: render(1024, 640, (c) => drawWall(c, it.id, 1024, 0, 640)), meta: { name: it.name.es, level: it.level } });
  for (const it of FLOOR_FINISHES) out.push({ path: `Floors/${it.id}.png`, png: render(1024, 420, (c) => drawFloor(c, it.id, 1024, 0, 420)), meta: { name: it.name.es, level: it.level } });
  for (const k of LANDSCAPES) out.push({ path: `Landscapes/${k}.png`, png: render(512, 512, (c) => drawLandscape(c, k, 0, 0, 512, 512)) });

  // Whole room backdrops (empty: architecture, window, frame) — phone portrait proportions of the stage.
  const W = 1080, H = 1350;
  const room = emptyRoom();
  room.finishes = { ...room.finishes, wallpaper: "wall_woven", flooring: "floor_planks" };
  const g = roomGeom(W, H, room);
  for (const night of [false, true]) {
    const pic = buildRoomPicture(room, g, { night, lightsOn: true });
    out.push({ path: `Rooms/nest_room_${night ? "night" : "day"}.png`, png: render(W, H, (c) => c.drawPicture(pic)), meta: { geom: g, floor: room.floor, wall: room.wall, window: room.windowCells } });
  }

  // Furniture and paintings: drawn at a fixed cell size, pivot = middle of the footprint's front edge (floor) or top-left (wall).
  // Same cell sizes as the room backdrop above, so Unity can place them pixel-exact on it.
  const cellW = g.floorCellW, cellH = g.floorCellH, wallCell = g.wallCell;
  for (const it of FURNITURE) {
    const f = it.furniture!;
    const wall = f.layer === "wall";
    const rw = f.w * (wall ? wallCell : cellW), rh = f.h * (wall ? wallCell : cellH);
    const padX = Math.round(cellW), padTop = Math.round(wall ? 16 : cellH * 2.2), padBottom = 16;
    const W2 = rw + padX * 2, H2 = rh + padTop + padBottom;
    const r = { x: padX, y: padTop, w: rw, h: rh };
    out.push({
      path: `${wall ? "Paintings" : "Furniture"}/${it.id}.png`,
      png: render(W2, H2, (c) => drawFurniture(c, it.id, r, false, undefined, cellH)),
      meta: { name: it.name.es, layer: f.layer, footprint: { w: f.w, h: f.h }, rectPx: { x: padX, y: padTop, w: rw, h: rh }, size: { w: Math.ceil(W2), h: Math.ceil(H2) }, cell: wall ? { w: wallCell, h: wallCell } : { w: cellW, h: cellH }, comfort: f.comfort ?? 0, price: it.price.amount, level: it.level },
    });
  }
  // Starter layout of the living room (for the Unity scene).
  const s = newGame(0, { tamtamId: "export" });
  out.push({ path: "nest_layout.json", png: "", meta: { placements: s.room.placements, finishes: s.room.finishes, floor: s.room.floor, wall: s.room.wall, window: s.room.windowCells, geom: g, backdrop: { w: W, h: H } } });
  return out;
}
