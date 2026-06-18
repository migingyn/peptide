import styles from './NumberPad.module.css';

interface NumberPadProps {
  value: string;
  onChange: (next: string) => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'] as const;

export function NumberPad({ value, onChange }: NumberPadProps) {
  function press(key: string) {
    if (key === '⌫') {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === '.') {
      if (value.includes('.')) return; // only one decimal point
      onChange(value === '' ? '0.' : value + '.');
      return;
    }
    // digit
    onChange(value === '0' ? key : value + key);
  }

  return (
    <div className={styles.pad} role="group" aria-label="Number pad">
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          className={styles.key}
          aria-label={key === '⌫' ? 'Backspace' : key}
          onClick={() => press(key)}
        >
          {key}
        </button>
      ))}
    </div>
  );
}
