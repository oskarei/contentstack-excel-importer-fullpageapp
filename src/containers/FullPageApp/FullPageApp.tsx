import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@contentstack/venus-components';
import '@contentstack/venus-components/build/main.css';
import { useAppSdk } from '../../common/hooks/useAppSdk';
import { useManagementClient } from '../../common/hooks/useManagementClient';
import { parseExcelBuffer, ParsedRow } from '../../utils/parseExcel';
import ImportPreviewTable from '../../components/ImportPreviewTable';

/** Target content type UID in the stack. */
const CONTENT_TYPE_UID = 'susanna';

function formatCreateError(err: unknown): string {
  if (err && typeof err === 'object' && 'error_message' in err) {
    return String((err as { error_message: string }).error_message);
  }
  const ax = err as { response?: { data?: unknown }; message?: string };
  if (ax?.response?.data !== undefined) {
    try {
      return typeof ax.response.data === 'string'
        ? ax.response.data
        : JSON.stringify(ax.response.data);
    } catch {
      return String(ax.response.data);
    }
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

const FullPageApp: React.FC = () => {
  const sdk = useAppSdk();
  const managementClient = useManagementClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [parseError, setParseError] = useState<string | null>(null);
  const [masterLocale, setMasterLocale] = useState('en-us');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSucceeded, setImportSucceeded] = useState(false);

  useEffect(() => {
    if (!sdk?.stack) return;
    const stack = sdk.stack as {
      getLocales: () => Promise<Array<{ code: string; fallback_locale?: string | null }>>;
    };
    stack
      .getLocales()
      .then((locales) => {
        const master = locales.find((l) => !l.fallback_locale);
        if (master?.code) setMasterLocale(master.code);
      })
      .catch((e) => console.error('Failed to load locales:', e));
  }, [sdk]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setParseError(null);
    setImportErrors([]);
    setImportSucceeded(false);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseExcelBuffer(buffer);
      setRows(parsed);
      setSelected(new Set(parsed.map((_, i) => i)));
    } catch (err) {
      setRows([]);
      setSelected(new Set());
      setParseError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const toggleRow = useCallback((index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === rows.length) return new Set();
      return new Set(rows.map((_, i) => i));
    });
  }, [rows.length]);

  const selectedIndices = useMemo(
    () => rows.map((_, i) => i).filter((i) => selected.has(i)),
    [rows, selected],
  );

  const handleImport = useCallback(async () => {
    if (!managementClient || !sdk || selectedIndices.length === 0) return;
    const apiKey = (sdk as { ids?: { apiKey?: string } }).ids?.apiKey;
    if (!apiKey) {
      setImportErrors(['Stack API key is not available from the app SDK.']);
      return;
    }

    setImporting(true);
    setImportErrors([]);
    setImportSucceeded(false);
    setImportProgress({ done: 0, total: selectedIndices.length });

    const stack = managementClient.stack({ api_key: apiKey });
    const contentType = stack.contentType(CONTENT_TYPE_UID);
    const errors: string[] = [];
    let done = 0;

    for (const i of selectedIndices) {
      const row = rows[i];
      try {
        await contentType.entry().create(
          { entry: { title: row.title, text: row.text, description: row.description } },
          { locale: masterLocale },
        );
      } catch (err) {
        errors.push(`Row ${i + 2} (spreadsheet): ${formatCreateError(err)}`);
      }
      done += 1;
      setImportProgress({ done, total: selectedIndices.length });
    }

    setImportErrors(errors);
    setImportSucceeded(errors.length === 0);
    setImporting(false);
  }, [managementClient, sdk, selectedIndices, rows, masterLocale]);

  const openFilePicker = () => fileInputRef.current?.click();

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '4px' }}>Excel Importer</h1>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Import rows into content type <strong>{CONTENT_TYPE_UID}</strong> (fields: title, text,
          description). Entries are created in the master locale ({masterLocale}) as drafts.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <Button buttonType="primary" onClick={openFilePicker}>
          Choose Excel file
        </Button>
        <Button
          buttonType="secondary"
          onClick={handleImport}
          disabled={
            importing ||
            !managementClient ||
            selectedIndices.length === 0 ||
            rows.length === 0
          }
          isLoading={importing}
        >
          Import selected as entries
        </Button>
      </div>

      <p style={{ fontSize: '13px', color: '#666', marginTop: '12px' }}>
        First row must be headers: <code>title</code>, <code>text</code>, <code>description</code>{' '}
        (any casing). All data rows are selected after upload; change selection before importing if
        needed.
      </p>

      {!managementClient && sdk && (
        <p style={{ fontSize: '13px', color: '#b45309', marginTop: '12px' }}>
          Management client is not ready. Ensure App Permissions include entries:write and
          content_types:read, then reinstall the app on this stack.
        </p>
      )}

      {parseError && (
        <p style={{ fontSize: '13px', color: '#d32f2f', marginTop: '12px' }}>{parseError}</p>
      )}

      {importing && (
        <p style={{ fontSize: '13px', marginTop: '12px' }}>
          Importing… {importProgress.done} / {importProgress.total}
        </p>
      )}

      {importSucceeded && (
        <p style={{ fontSize: '13px', color: '#2e7d32', marginTop: '12px' }}>
          Successfully created {importProgress.total} entr{importProgress.total === 1 ? 'y' : 'ies'}.
        </p>
      )}

      {importErrors.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <p style={{ fontSize: '13px', color: '#d32f2f', fontWeight: 600 }}>
            Some rows failed ({importErrors.length}):
          </p>
          <ul style={{ fontSize: '12px', color: '#555', marginTop: '8px', paddingLeft: '20px' }}>
            {importErrors.map((msg, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>
                {msg}
              </li>
            ))}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <ImportPreviewTable
          rows={rows}
          selected={selected}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
        />
      )}
    </div>
  );
};

export default FullPageApp;
