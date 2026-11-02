import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import type { PlannerDraft } from '@/features/planner/types';
import {
  itemSummaryCsv,
  sampleItemSummary,
  type ItemSummaryRow,
} from '@/features/planner/item-summary';
import { downloadFile } from '@/utils/download';
import '@/styles/item-list.css';

interface ItemListDialogProps {
  open: boolean;
  onClose: () => void;
  draft: PlannerDraft;
  rows: readonly ItemSummaryRow[];
}

function Arrow() {
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" aria-hidden="true">
      <path
        d="M2 10h24m0 0-7-7m7 7-7 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ItemListDialog({ open, onClose, draft, rows }: ItemListDialogProps) {
  const sample = rows.length === 0;
  const displayedRows = sample ? sampleItemSummary : rows;
  const price = (value: number | null) =>
    value === null ? '—' : sample ? '$00000' : `$${value.toFixed(2)}`;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Item list summary"
      layout="item-list"
      footer={
        <>
          <Button
            size="planner"
            onClick={() => {
              downloadFile(
                JSON.stringify(
                  { project: draft, items: displayedRows, sampleData: sample },
                  null,
                  2,
                ),
                'design-information.json',
                'application/json',
              );
            }}
          >
            Download design information
            <Arrow />
          </Button>
          <Button
            size="planner"
            onClick={() => {
              downloadFile(
                itemSummaryCsv(displayedRows),
                'item-list.csv',
                'text/csv;charset=utf-8',
              );
            }}
          >
            Download item list
            <Arrow />
          </Button>
        </>
      }
    >
      <div
        className="item-list-table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Item summary table"
      >
        <table className="item-list-table">
          <caption className="sr-only">
            {sample
              ? 'Sample item list. Prices and item codes are placeholders.'
              : 'Project items. A dash indicates pricing is not yet available.'}
          </caption>
          <colgroup>
            <col style={{ width: '32.2%' }} />
            <col style={{ width: '25.5%' }} />
            <col style={{ width: '8.4%' }} />
            <col style={{ width: '17.1%' }} />
            <col style={{ width: '16.8%' }} />
          </colgroup>
          <thead>
            <tr>
              {['Item description', 'Item code', 'Qty', 'Unit price', 'Total price'].map(
                (label) => (
                  <th key={label} scope="col">
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {displayedRows.map((row) => (
              <tr key={row.id}>
                <td>{row.description}</td>
                <td>{row.itemCode}</td>
                <td>{row.quantity}</td>
                <td>{price(row.unitPrice)}</td>
                <td>{price(row.unitPrice === null ? null : row.unitPrice * row.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Dialog>
  );
}
