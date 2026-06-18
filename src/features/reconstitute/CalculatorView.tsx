import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reconstitute, roundUnits, ReconError, type ReconResult } from '../../lib/reconstitution';
import { id } from '../../lib/ids';
import { useAppState, useDispatch } from '../../state/store';
import type { Vial } from '../../state/types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { NumberPad } from '../../components/NumberPad';
import styles from './CalculatorView.module.css';

type Field = 'vial' | 'water' | 'dose';
type Unit = 'units' | 'ml';

const PRESETS: Record<Field, string[]> = {
  vial: ['2', '5', '10'],
  water: ['1', '2', '3'],
  dose: ['0.1', '0.5', '1'],
};

const FIELD_LABEL: Record<Field, string> = {
  vial: 'Vial size (mg)',
  water: 'Bacteriostatic water (mL)',
  dose: 'Dose (mg)',
};

function toNumber(s: string): number {
  if (s.trim() === '') return NaN;
  return Number(s);
}

export function CalculatorView() {
  const { peptideId = '' } = useParams<{ peptideId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { peptides } = useAppState();

  const peptide = peptides.find((p) => p.id === peptideId);

  const [vial, setVial] = useState('2');
  const [water, setWater] = useState('1');
  const [dose, setDose] = useState('1');
  const [active, setActive] = useState<Field>('vial');
  const [unit, setUnit] = useState<Unit>('units');
  const [whyOpen, setWhyOpen] = useState(false);

  const values: Record<Field, string> = { vial, water, dose };
  const setters: Record<Field, (s: string) => void> = {
    vial: setVial,
    water: setWater,
    dose: setDose,
  };

  const result = useMemo<ReconResult | null>(() => {
    try {
      return reconstitute({
        vialMg: toNumber(vial),
        waterMl: toNumber(water),
        doseMg: toNumber(dose),
      });
    } catch (e) {
      if (e instanceof ReconError) return null;
      throw e;
    }
  }, [vial, water, dose]);

  const drawDisplay =
    result === null
      ? '—'
      : unit === 'units'
        ? `${roundUnits(result.drawUnits)} units`
        : `${roundUnits(result.volumeMl * 10) / 10} mL`;

  function handleSave() {
    if (result === null) return;
    const vialRecord: Vial = {
      id: id(),
      peptideId,
      vialMg: toNumber(vial),
      waterMl: toNumber(water),
      doseMg: toNumber(dose),
      concentrationMgPerMl: result.concentrationMgPerMl,
      drawUnits: result.drawUnits,
      reconstitutedAt: new Date().toISOString(),
    };
    dispatch({ type: 'SAVE_VIAL', payload: vialRecord });
    navigate('/reconstitute');
  }

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.back}
          aria-label="Back to kit"
          onClick={() => navigate('/reconstitute')}
        >
          ←
        </button>
        <h1 className={styles.title}>{peptide ? peptide.name : 'Reconstitute'}</h1>
      </header>

      <Card className={styles.outputCard}>
        <div className={styles.outRow}>
          <span className={styles.outLabel}>Concentration</span>
          <span className={styles.outValue}>
            {result ? `${result.concentrationMgPerMl} mg/mL` : '—'}
          </span>
        </div>
        <div className={styles.outRow}>
          <span className={styles.outLabel}>Draw to</span>
          <span className={styles.outValueBig}>{drawDisplay}</span>
        </div>
        <div className={styles.toggle} role="group" aria-label="Display unit">
          <Chip selected={unit === 'units'} onClick={() => setUnit('units')}>
            units
          </Chip>
          <Chip selected={unit === 'ml'} onClick={() => setUnit('ml')}>
            mL
          </Chip>
        </div>

        {result && result.warnings.length > 0 && (
          <p className={styles.warn} role="alert">
            ⚠ {result.warnings.join('; ')}
          </p>
        )}

        <button
          type="button"
          className={styles.whyToggle}
          aria-expanded={whyOpen}
          onClick={() => setWhyOpen((o) => !o)}
        >
          {result ? `Why ${roundUnits(result.volumeMl * 10) / 10} mL?` : 'Why this volume?'}
        </button>
        {whyOpen && result && (
          <p className={styles.why}>
            Concentration is {result.concentrationMgPerMl} mg/mL ({vial} mg ÷ {water} mL). A {dose}{' '}
            mg dose needs {dose} ÷ {result.concentrationMgPerMl} ={' '}
            {roundUnits(result.volumeMl * 10) / 10} mL, which is {roundUnits(result.drawUnits)}{' '}
            units on a U-100 syringe (1 mL = 100 units). This vial yields about{' '}
            {Math.floor(result.dosesPerVial)} doses.
          </p>
        )}
      </Card>

      <div className={styles.fields}>
        {(Object.keys(FIELD_LABEL) as Field[]).map((field) => (
          <div key={field} className={styles.field}>
            <label className={styles.fieldLabel} htmlFor={`field-${field}`}>
              {FIELD_LABEL[field]}
            </label>
            <input
              id={`field-${field}`}
              className={
                active === field
                  ? `${styles.fieldInput} ${styles.fieldInputActive}`
                  : styles.fieldInput
              }
              type="text"
              inputMode="decimal"
              readOnly
              value={values[field]}
              aria-label={FIELD_LABEL[field]}
              onFocus={() => setActive(field)}
              onClick={() => setActive(field)}
            />
            <div className={styles.chips}>
              {PRESETS[field].map((preset) => (
                <Chip
                  key={preset}
                  selected={values[field] === preset}
                  onClick={() => {
                    setActive(field);
                    setters[field](preset);
                  }}
                >
                  {preset}
                </Chip>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Card className={styles.padCard}>
        <p className={styles.padHint}>
          Editing <strong>{FIELD_LABEL[active]}</strong>
        </p>
        <NumberPad value={values[active]} onChange={setters[active]} />
      </Card>

      <Button
        variant="primary"
        className={styles.save}
        disabled={result === null}
        onClick={handleSave}
      >
        Save to kit
      </Button>
    </main>
  );
}
