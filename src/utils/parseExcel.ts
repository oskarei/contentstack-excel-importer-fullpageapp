import * as XLSX from 'xlsx';

export interface ParsedRow {
  title: string;
  text: string;
  description: string;
}

const REQUIRED_FIELDS = ['title', 'text', 'description'] as const;

function normalizeHeader(cell: unknown): string {
  return String(cell ?? '')
    .trim()
    .toLowerCase();
}

/**
 * Reads the first worksheet. Row 1 must contain headers title, text, description (case-insensitive).
 */
export function parseExcelBuffer(buffer: ArrayBuffer): ParsedRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('The workbook has no sheets.');
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | null | undefined)[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  if (matrix.length < 2) {
    throw new Error('The sheet needs a header row and at least one data row.');
  }

  const headerRow = (matrix[0] ?? []).map(normalizeHeader);
  const colIndex: Record<(typeof REQUIRED_FIELDS)[number], number> = {
    title: -1,
    text: -1,
    description: -1,
  };

  for (const field of REQUIRED_FIELDS) {
    const idx = headerRow.indexOf(field);
    if (idx === -1) {
      throw new Error(
        `Missing required column "${field}". First row must include: title, text, description.`,
      );
    }
    colIndex[field] = idx;
  }

  const rows: ParsedRow[] = [];
  for (let r = 1; r < matrix.length; r++) {
    const line = matrix[r] ?? [];
    const title = String(line[colIndex.title] ?? '').trim();
    const text = String(line[colIndex.text] ?? '').trim();
    const description = String(line[colIndex.description] ?? '').trim();
    if (!title && !text && !description) {
      continue;
    }
    rows.push({ title, text, description });
  }

  if (rows.length === 0) {
    throw new Error('No data rows found after the header.');
  }

  return rows;
}
