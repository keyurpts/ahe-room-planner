export interface ItemSummaryRow {
  id: string;
  description: string;
  itemCode: string;
  quantity: number;
  unitPrice: number | null;
}

export interface RawModelSummaryItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export const sampleItemSummary: readonly ItemSummaryRow[] = Array.from(
  { length: 6 },
  (_, index) => ({
    id: `sample-${String(index)}`,
    description: '900mm Floor Cupboard',
    itemCode: '0000000',
    quantity: 11,
    unitPrice: 0,
  }),
);

export function formatModelsSummary(
  rawModels: readonly RawModelSummaryItem[],
  itemCodeLookup: Record<string, string> = {},
): ItemSummaryRow[] {
  const map = new Map<string, ItemSummaryRow>();

  for (const item of rawModels) {
    const baseId = item.id.replace(/_node\d+$/iu, '');
    const cleanDescription = item.name.replace(/_node\d+$/iu, '').trim();
    const itemCode = itemCodeLookup[baseId] ?? '—';
    const key = `${baseId}:${cleanDescription}:${String(item.unitPrice)}`;

    const existing = map.get(key);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      map.set(key, {
        id: baseId,
        description: cleanDescription,
        itemCode,
        quantity: item.quantity,
        unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : null,
      });
    }
  }

  return Array.from(map.values());
}

export function itemSummaryCsv(rows: readonly ItemSummaryRow[]) {
  const escape = (value: string) => {
    const safe = /^[=+@\-\t\r]/u.test(value) ? `'${value}` : value;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  return [
    ['Item description', 'Item code', 'Quantity', 'Unit price', 'Total price'],
    ...rows.map((row) => [
      row.description,
      row.itemCode,
      String(row.quantity),
      row.unitPrice === null ? '' : String(row.unitPrice),
      row.unitPrice === null ? '' : String(row.unitPrice * row.quantity),
    ]),
  ]
    .map((row) => row.map(escape).join(','))
    .join('\r\n');
}
