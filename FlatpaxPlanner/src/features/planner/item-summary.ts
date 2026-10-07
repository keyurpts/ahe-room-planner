export interface ItemSummaryRow {
  id: string;
  description: string;
  itemCode: string;
  quantity: number;
  unitPrice: number | null;
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
