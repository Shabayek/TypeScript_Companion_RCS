import { useRef, useState } from 'react';
import { canShareFile, copyText, requestDownload, shareFile } from '../../platform/capabilities';
import { useJourney, type ImportPreview, type ProgressSummary } from '../../storage/store';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';
import { Callout, Card } from '../../ui/primitives';
import styles from './progress.module.css';
import { useT } from '../../i18n/t';
import { formatDate, formatNumber } from '../../i18n/messages';
import { msg, renderText, type Text } from '../../i18n/text';

type Status = { tone: 'ok' | 'bad'; text: Text } | null;
type Preview = Extract<ImportPreview, { ok: true }> & { json: string };

function shortDate(ms: number | null, language: string): string {
  if (ms === null) return '—';
  return formatDate(ms, language, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** The date in the file name makes older and newer exports easy to tell apart. */
function exportFileName(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `typescript-companion-progress-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

function SummaryTable({ incoming, current, exportedAt }: { incoming: ProgressSummary; current: ProgressSummary; exportedAt: number | null }) {
  const { t, language } = useT();
  const number = (value: number) => formatNumber(value, language);
  const rows: [string, string, string][] = [
    [t('data.finishedLessons'), number(incoming.lessonsCompleted), number(current.lessonsCompleted)],
    [t('data.stepsSolved'), number(incoming.stepsSolved), number(current.stepsSolved)],
    [t('data.badges'), number(incoming.badges), number(current.badges)],
    [t('data.lastFinished'), shortDate(incoming.lastFinishedAt, language), shortDate(current.lastFinishedAt, language)],
  ];
  return (
    <table className={styles.compareTable}>
      <caption className="sr-only">{t('data.compareCaption')}</caption>
      <thead>
        <tr>
          <td />
          <th scope="col">
            {exportedAt !== null ? t('data.inFileSaved', { date: shortDate(exportedAt, language) }) : t('data.inFile')}
          </th>
          <th scope="col">{t('data.onDevice')}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, fromFile, here]) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            <td>{fromFile}</td>
            <td>{here}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Export and import of progress. Export is the learner's only backup, so it
 * never claims more than it knows: a download is only *requested* (some
 * Android WebViews silently ignore it), and copy and share are always there as
 * other ways out. Import shows what the file holds before replacing anything,
 * and the replaced progress can be put back.
 */
export function ProgressData() {
  const { t } = useT();
  const exportJson = useJourney((store) => store.exportJson);
  const previewImport = useJourney((store) => store.previewImport);
  const replaceState = useJourney((store) => store.replaceState);
  const undoImport = useJourney((store) => store.undoImport);
  const canUndo = useJourney((store) => store.importBackup !== null);

  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>(null);
  const [paste, setPaste] = useState('');
  const [manualCopy, setManualCopy] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [shareable] = useState(() => canShareFile('progress.json', '{}'));

  const onSaveFile = () => {
    const name = exportFileName();
    const started = requestDownload(name, exportJson());
    setStatus(
      started
        ? { tone: 'ok', text: msg(shareable ? 'data.saveAskedShare' : 'data.saveAsked', { name }) }
        : { tone: 'bad', text: msg(shareable ? 'data.saveRefusedShare' : 'data.saveRefused') },
    );
  };

  const onCopy = async () => {
    const text = exportJson();
    if (await copyText(text)) {
      setManualCopy(null);
      setStatus({ tone: 'ok', text: msg('data.copied') });
    } else {
      // Copying is blocked: show the text so it can be copied by hand.
      setManualCopy(text);
      setStatus({ tone: 'bad', text: msg('data.copyBlocked') });
    }
  };

  const onShare = async () => {
    const outcome = await shareFile(exportFileName(), exportJson());
    if (outcome === 'shared') setStatus({ tone: 'ok', text: msg('data.shared') });
    else if (outcome === 'failed') setStatus({ tone: 'bad', text: msg('data.shareFailed') });
  };

  const openPreview = (json: string) => {
    const result = previewImport(json);
    if (!result.ok) {
      setStatus({ tone: 'bad', text: result.message });
      return;
    }
    setStatus(null);
    setPreview({ ...result, json });
  };

  const onFile = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    // Clear the picker, so choosing the same file again still works.
    input.value = '';
    if (!file) return;
    try {
      openPreview(await file.text());
    } catch {
      setStatus({ tone: 'bad', text: msg('data.unreadable') });
    }
  };

  const confirmImport = () => {
    if (!preview) return;
    const result = replaceState(preview.json);
    setPreview(null);
    if (result.ok) setPaste('');
    setStatus({
      tone: result.ok ? 'ok' : 'bad',
      text: result.ok ? msg('data.restored') : result.message,
    });
  };

  const onUndo = () => {
    const result = undoImport();
    setStatus({ tone: result.ok ? 'ok' : 'bad', text: result.message });
  };

  return (
    <Card className={styles.dataCard}>
      <p>{t('data.lede')}</p>
      <div className="row">
        <Button onClick={onSaveFile}>{t('data.saveFile')}</Button>
        <Button variant="ghost" onClick={() => void onCopy()}>
          {t('data.copy')}
        </Button>
        {shareable ? (
          <Button variant="ghost" onClick={() => void onShare()}>
            {t('data.share')}
          </Button>
        ) : null}
      </div>

      {manualCopy !== null ? (
        <label className="field">
          <span>{t('data.asText')}</span>
          <textarea className="textarea" readOnly value={manualCopy} onFocus={(event) => event.target.select()} rows={6} />
        </label>
      ) : null}

      <hr className="divider" />

      <div className="row">
        <Button variant="ghost" onClick={() => fileInput.current?.click()}>
          {t('data.importFile')}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label={t('data.importLabel')}
          onChange={(event) => void onFile(event.target)}
        />
        {canUndo ? (
          <Button variant="ghost" onClick={onUndo}>
            {t('data.undo')}
          </Button>
        ) : null}
      </div>
      <details className={styles.pasteBox}>
        <summary>{t('data.paste')}</summary>
        <label className="sr-only" htmlFor="import-json">
          {t('data.pasteLabel')}
        </label>
        <textarea
          id="import-json"
          className="textarea"
          value={paste}
          onChange={(event) => setPaste(event.target.value)}
          placeholder='{"app":"typescript-companion", ...}'
        />
        <Button size="sm" onClick={() => openPreview(paste)} disabled={paste.trim() === ''}>
          {t('data.restore')}
        </Button>
      </details>

      {status ? (
        <p className={styles.status} data-tone={status.tone} role="status">
          {renderText(status.text, t)}
        </p>
      ) : null}

      <Dialog
        open={preview !== null}
        onClose={() => setPreview(null)}
        title={t('data.replaceTitle')}
        footer={
          <div className="row">
            <Button variant="ghost" onClick={() => setPreview(null)}>
              {t('data.keep')}
            </Button>
            <Button variant="primary" onClick={confirmImport}>
              {t('data.replace')}
            </Button>
          </div>
        }
      >
        {preview ? (
          <div className="stack">
            <SummaryTable incoming={preview.incoming} current={preview.current} exportedAt={preview.exportedAt} />
            {preview.warning ? (
              <Callout tone="warn" title={t('data.checkFirst')}>
                <p>{renderText(preview.warning, t)}</p>
              </Callout>
            ) : null}
            <p className="muted">{t('data.replaceNote')}</p>
          </div>
        ) : null}
      </Dialog>
    </Card>
  );
}
