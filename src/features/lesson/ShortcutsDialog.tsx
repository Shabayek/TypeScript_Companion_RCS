import { useT } from '../../i18n/t';
import { Dialog } from '../../ui/Dialog';
import styles from './lesson.module.css';

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useT();
  const rows: readonly (readonly [string, string])[] = [
    ['Ctrl / ⌘ + Enter', t('shortcuts.check')],
    ['J', t('shortcuts.next')],
    ['K', t('shortcuts.back')],
    ['H', t('shortcuts.hint')],
    ['?', t('shortcuts.help')],
  ];
  return (
    <Dialog open={open} onClose={onClose} title={t('shortcuts.title')}>
      <dl className={styles.shortcuts}>
        {rows.map(([keys, what]) => (
          <div key={keys}>
            <dt>
              <kbd>{keys}</kbd>
            </dt>
            <dd>{what}</dd>
          </div>
        ))}
      </dl>
      <p className="muted">{t('shortcuts.note')}</p>
    </Dialog>
  );
}
