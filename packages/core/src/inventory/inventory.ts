/** Player inventory (ECONOMY_SYSTEM §2.3). */

export interface InventoryState {
  items: Record<string, { qty: number; firstAcquiredAt: number }>;
}

export class InsufficientItems extends Error {
  constructor(
    public readonly itemId: string,
    public readonly needed: number,
    public readonly available: number,
  ) {
    super(`Not enough "${itemId}": need ${needed}, have ${available}`);
  }
}

export function emptyInventory(): InventoryState {
  return { items: {} };
}

const checkQty = (qty: number) => {
  if (!Number.isInteger(qty) || qty <= 0) throw new RangeError(`Quantity must be a positive integer, got ${qty}`);
};

export function quantity(inv: Readonly<InventoryState>, itemId: string): number {
  return inv.items[itemId]?.qty ?? 0;
}

export function addItem(inv: InventoryState, itemId: string, qty: number, at: number): void {
  checkQty(qty);
  const cur = inv.items[itemId];
  if (cur) cur.qty += qty;
  else inv.items[itemId] = { qty, firstAcquiredAt: at };
}

export function removeItem(inv: InventoryState, itemId: string, qty: number): void {
  checkQty(qty);
  const have = quantity(inv, itemId);
  if (have < qty) throw new InsufficientItems(itemId, qty, have);
  const cur = inv.items[itemId]!;
  cur.qty -= qty;
  if (cur.qty === 0) delete inv.items[itemId];
}

/** Removes several items all-or-nothing (crafting recipes, upgrade materials). */
export function consumeItems(inv: InventoryState, needs: Record<string, number>): void {
  for (const [id, n] of Object.entries(needs)) {
    const have = quantity(inv, id);
    if (have < n) throw new InsufficientItems(id, n, have);
  }
  for (const [id, n] of Object.entries(needs)) removeItem(inv, id, n);
}
