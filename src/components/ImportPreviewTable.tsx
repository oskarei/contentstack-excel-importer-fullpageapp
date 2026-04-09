import React from 'react';
import { Checkbox } from '@contentstack/venus-components';
import { ParsedRow } from '../utils/parseExcel';

interface ImportPreviewTableProps {
  rows: ParsedRow[];
  selected: Set<number>;
  onToggleRow: (index: number) => void;
  onToggleAll: () => void;
}

const ImportPreviewTable: React.FC<ImportPreviewTableProps> = ({
  rows,
  selected,
  onToggleRow,
  onToggleAll,
}) => {
  const allSelected = rows.length > 0 && selected.size === rows.length;
  const someSelected = selected.size > 0 && selected.size < rows.length;

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginTop: '16px' }}>
      <thead>
        <tr style={{ borderBottom: '2px solid #e0e0e0', backgroundColor: '#f9f9f9' }}>
          <th style={{ padding: '10px 12px', width: '48px', textAlign: 'left' }}>
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={() => onToggleAll()}
              label=""
            />
          </th>
          <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Title</th>
          <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Text</th>
          <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Description</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr
            key={idx}
            style={{
              borderBottom: '1px solid #e8e8e8',
              backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
            }}
          >
            <td style={{ padding: '8px 12px', verticalAlign: 'top' }}>
              <Checkbox
                checked={selected.has(idx)}
                onChange={() => onToggleRow(idx)}
                label=""
              />
            </td>
            <td style={{ padding: '8px 12px', verticalAlign: 'top', maxWidth: '200px', wordBreak: 'break-word' }}>
              {row.title || '—'}
            </td>
            <td style={{ padding: '8px 12px', verticalAlign: 'top', maxWidth: '280px', wordBreak: 'break-word' }}>
              {row.text || '—'}
            </td>
            <td style={{ padding: '8px 12px', verticalAlign: 'top', maxWidth: '280px', wordBreak: 'break-word' }}>
              {row.description || '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ImportPreviewTable;
