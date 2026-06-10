const BASE = "https://images.unsplash.com";

const PHOTOS: Record<string, string[]> = {
  landscaping: [
    `${BASE}/photo-1416879595882-3373a0480b5b?w=1200&q=80`,
    `${BASE}/photo-1585320806297-9794b3e4eeae?w=1200&q=80`,
    `${BASE}/photo-1558618666-fcd25c85cd64?w=1200&q=80`,
    `${BASE}/photo-1523348837708-15d4a09cfac2?w=1200&q=80`,
    `${BASE}/photo-1592150621744-aca64f48394a?w=1200&q=80`,
    `${BASE}/photo-1500651230702-0e2d8a49d4e3?w=1200&q=80`,
  ],
  hardscape: [
    `${BASE}/photo-1604076913837-52ab5629fde9?w=1200&q=80`,
    `${BASE}/photo-1565193566173-7a0ee3dbe261?w=1200&q=80`,
    `${BASE}/photo-1503387762-592deb58ef4e?w=1200&q=80`,
    `${BASE}/photo-1504307651254-35680f356dfd?w=1200&q=80`,
    `${BASE}/photo-1570129477492-45c003dc0b3a?w=1200&q=80`,
    `${BASE}/photo-1558618047-3c8c76ca7d96?w=1200&q=80`,
  ],
  "pressure washing": [
    `${BASE}/photo-1558618047-3c8c76ca7d96?w=1200&q=80`,
    `${BASE}/photo-1570129477492-45c003dc0b3a?w=1200&q=80`,
    `${BASE}/photo-1504307651254-35680f356dfd?w=1200&q=80`,
    `${BASE}/photo-1525785967371-87ba44b3e6cf?w=1200&q=80`,
    `${BASE}/photo-1581578731548-c64695cc6952?w=1200&q=80`,
    `${BASE}/photo-1600585154340-be6161a56a0c?w=1200&q=80`,
  ],
  painting: [
    `${BASE}/photo-1562259929-b4e1fd3aef09?w=1200&q=80`,
    `${BASE}/photo-1589939705384-5185137a7f0f?w=1200&q=80`,
    `${BASE}/photo-1600210492493-0946911123ea?w=1200&q=80`,
    `${BASE}/photo-1558618666-fcd25c85cd64?w=1200&q=80`,
    `${BASE}/photo-1565538810643-b5bdb714032a?w=1200&q=80`,
    `${BASE}/photo-1570129477492-45c003dc0b3a?w=1200&q=80`,
  ],
  plumbing: [
    `${BASE}/photo-1581092795442-6d9d6c4c1a55?w=1200&q=80`,
    `${BASE}/photo-1504307651254-35680f356dfd?w=1200&q=80`,
    `${BASE}/photo-1503387762-592deb58ef4e?w=1200&q=80`,
    `${BASE}/photo-1558618666-fcd25c85cd64?w=1200&q=80`,
    `${BASE}/photo-1570129477492-45c003dc0b3a?w=1200&q=80`,
    `${BASE}/photo-1581578731548-c64695cc6952?w=1200&q=80`,
  ],
  electrician: [
    `${BASE}/photo-1621905251189-08b45d6a269e?w=1200&q=80`,
    `${BASE}/photo-1504307651254-35680f356dfd?w=1200&q=80`,
    `${BASE}/photo-1558618666-fcd25c85cd64?w=1200&q=80`,
    `${BASE}/photo-1503387762-592deb58ef4e?w=1200&q=80`,
    `${BASE}/photo-1581578731548-c64695cc6952?w=1200&q=80`,
    `${BASE}/photo-1570129477492-45c003dc0b3a?w=1200&q=80`,
  ],
  roofing: [
    `${BASE}/photo-1600585154340-be6161a56a0c?w=1200&q=80`,
    `${BASE}/photo-1570129477492-45c003dc0b3a?w=1200&q=80`,
    `${BASE}/photo-1503387762-592deb58ef4e?w=1200&q=80`,
    `${BASE}/photo-1558618047-3c8c76ca7d96?w=1200&q=80`,
    `${BASE}/photo-1504307651254-35680f356dfd?w=1200&q=80`,
    `${BASE}/photo-1581578731548-c64695cc6952?w=1200&q=80`,
  ],
  "tree service": [
    `${BASE}/photo-1448375240586-882707db888b?w=1200&q=80`,
    `${BASE}/photo-1416879595882-3373a0480b5b?w=1200&q=80`,
    `${BASE}/photo-1585320806297-9794b3e4eeae?w=1200&q=80`,
    `${BASE}/photo-1558618666-fcd25c85cd64?w=1200&q=80`,
    `${BASE}/photo-1523348837708-15d4a09cfac2?w=1200&q=80`,
    `${BASE}/photo-1500651230702-0e2d8a49d4e3?w=1200&q=80`,
  ],
  barber: [
    `${BASE}/photo-1503951914875-452162b0f3f1?w=1200&q=80`,
    `${BASE}/photo-1521590832167-7bcbfaa6381f?w=1200&q=80`,
    `${BASE}/photo-1599351431202-1e0f0137899a?w=1200&q=80`,
    `${BASE}/photo-1622286342621-4bd786c2447c?w=1200&q=80`,
    `${BASE}/photo-1560066984-138dadb4c035?w=1200&q=80`,
    `${BASE}/photo-1582095133179-bfd08e2585d3?w=1200&q=80`,
  ],
  "personal trainer": [
    `${BASE}/photo-1534438327276-14e5300c3a48?w=1200&q=80`,
    `${BASE}/photo-1571019614242-c5c5dee9f50b?w=1200&q=80`,
    `${BASE}/photo-1540497077202-7c8a3999166f?w=1200&q=80`,
    `${BASE}/photo-1517836357463-d25dfeac3438?w=1200&q=80`,
    `${BASE}/photo-1583454110551-21f2fa2afe61?w=1200&q=80`,
    `${BASE}/photo-1526506118085-60ce8714f8c5?w=1200&q=80`,
  ],
  default: [
    `${BASE}/photo-1570129477492-45c003dc0b3a?w=1200&q=80`,
    `${BASE}/photo-1558618047-3c8c76ca7d96?w=1200&q=80`,
    `${BASE}/photo-1504307651254-35680f356dfd?w=1200&q=80`,
    `${BASE}/photo-1503387762-592deb58ef4e?w=1200&q=80`,
    `${BASE}/photo-1581578731548-c64695cc6952?w=1200&q=80`,
    `${BASE}/photo-1600585154340-be6161a56a0c?w=1200&q=80`,
  ],
};

export function getStockPhotos(niche: string, count = 6): string[] {
  const key = niche.toLowerCase();
  const matched = Object.keys(PHOTOS).find((k) => key.includes(k)) ?? "default";
  const pool = PHOTOS[matched];
  // cycle through pool if more are needed than available
  const result: string[] = [];
  for (let i = 0; i < count; i++) result.push(pool[i % pool.length]);
  return result;
}

export function fillPhotos(existing: string[], niche: string, needed = 6): string[] {
  if (existing.length >= needed) return existing;
  const stock = getStockPhotos(niche, needed);
  const filled = [...existing];
  for (let i = existing.length; i < needed; i++) filled.push(stock[i]);
  return filled;
}
