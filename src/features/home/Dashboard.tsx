import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState, useDispatch } from '../../state/store';
import {
  occurrencesForDay,
  protocolWeek,
  isOccurrenceLogged,
  type DoseOccurrence,
} from '../../lib/schedule';
import { id } from '../../lib/ids';
import { roundUnits } from '../../lib/reconstitution';
import { ProgressRing } from '../../components/ProgressRing';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import type { Vial } from '../../state/types';

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function startOfWeek(d: Date): Date {
  // Monday-first week strip: shift so Monday is index 0.
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day; // back to Monday
  date.setDate(date.getDate() + diff);
  return date;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(timeOfDay: string): string {
  const [h, m] = timeOfDay.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function matchingVial(vials: Vial[], peptideId: string, doseMg: number): Vial | undefined {
  return vials.find((v) => v.peptideId === peptideId && v.doseMg === doseMg);
}

export function Dashboard() {
  const state = useAppState();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const now = useMemo(() => new Date(), []);
  const [selectedDay, setSelectedDay] = useState<Date>(
    () => new Date(now.getFullYear(), now.getMonth(), now.getDate()),
  );

  const userProtocol = state.userProtocols.find((u) => u.active) ?? null;
  const protocol = userProtocol
    ? (state.protocols.find((p) => p.id === userProtocol.protocolId) ?? null)
    : null;

  const peptideName = (peptideId: string) =>
    state.peptides.find((p) => p.id === peptideId)?.name ?? peptideId;

  if (!userProtocol || !protocol) {
    return (
      <main style={{ padding: 'var(--s-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            aria-label="Settings"
            onClick={() => navigate('/settings')}
            style={{
              fontSize: 22,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-1)',
              cursor: 'pointer',
              padding: 'var(--s-2)',
            }}
          >
            ⚙️
          </button>
        </div>
        <EmptyState
          title="No active protocol"
          body="Start a protocol to see your daily doses here."
          actionLabel="Start a protocol"
          onAction={() => navigate('/goals')}
        />
      </main>
    );
  }

  const { week, totalWeeks } = protocolWeek(userProtocol, now);
  const weekStart = startOfWeek(now);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const todays = occurrencesForDay(userProtocol, protocol, selectedDay);
  const tomorrow = new Date(selectedDay);
  tomorrow.setDate(selectedDay.getDate() + 1);
  const upcoming = occurrencesForDay(userProtocol, protocol, tomorrow);

  const toggleDose = (occ: DoseOccurrence) => {
    const existing = state.doseLogs.find(
      (l) => l.peptideId === occ.peptideId && l.scheduledFor === occ.scheduledFor,
    );
    if (existing) {
      dispatch({ type: 'UNDO_DOSE', payload: { id: existing.id } });
    } else {
      dispatch({
        type: 'LOG_DOSE',
        payload: {
          id: id(),
          userProtocolId: occ.userProtocolId,
          peptideId: occ.peptideId,
          scheduledFor: occ.scheduledFor,
          status: 'taken',
          loggedAt: new Date().toISOString(),
        },
      });
    }
  };

  const drawUnitsLabel = (occ: DoseOccurrence): string => {
    const vial = matchingVial(state.vials, occ.peptideId, occ.doseMg);
    return vial ? `${roundUnits(vial.drawUnits)} units` : '—';
  };

  return (
    <main
      style={{
        padding: 'var(--s-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--s-5)',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-4)' }}>
        <ProgressRing value={week} max={totalWeeks} label={`Week ${week}/${totalWeeks}`} />
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 'var(--t-h1)', color: 'var(--text-0)' }}>
            {protocol.name}
          </h1>
          <p style={{ margin: 0, color: 'var(--text-2)' }}>{protocol.summary}</p>
        </div>
        <button
          type="button"
          aria-label="Settings"
          onClick={() => navigate('/settings')}
          style={{
            fontSize: 22,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-1)',
            cursor: 'pointer',
            padding: 'var(--s-2)',
          }}
        >
          ⚙️
        </button>
      </header>

      <nav
        aria-label="Week"
        style={{ display: 'flex', gap: 'var(--s-2)', justifyContent: 'space-between' }}
      >
        {weekDays.map((d) => {
          const isToday = sameDay(d, now);
          const isSelected = sameDay(d, selectedDay);
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => setSelectedDay(d)}
              aria-pressed={isSelected}
              aria-current={isToday ? 'date' : undefined}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--s-1)',
                padding: 'var(--s-2) 0',
                borderRadius: 'var(--r-md)',
                border: isToday ? '1px solid var(--amber)' : '1px solid var(--border)',
                background: isSelected ? 'var(--indigo)' : 'var(--bg-1)',
                color: 'var(--text-0)',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 'var(--t-xs)', color: 'var(--text-2)' }}>
                {DAY_LABELS[d.getDay()]}
              </span>
              <span style={{ fontSize: 'var(--t-body)', fontWeight: 600 }}>{d.getDate()}</span>
            </button>
          );
        })}
      </nav>

      <section
        aria-label="Today's doses"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}
      >
        <h2 style={{ margin: 0, fontSize: 'var(--t-h2)', color: 'var(--text-0)' }}>
          Today&apos;s doses
        </h2>
        {todays.length === 0 ? (
          <p style={{ color: 'var(--text-2)', margin: 0 }}>No doses scheduled for this day.</p>
        ) : (
          todays.map((occ) => {
            const status = isOccurrenceLogged(occ, state.doseLogs);
            const taken = status === 'taken';
            return (
              <Card key={`${occ.peptideId}-${occ.scheduledFor}`}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--s-3)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={taken}
                    onChange={() => toggleDose(occ)}
                    aria-label={`Mark ${peptideName(occ.peptideId)} as taken`}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text-0)', fontWeight: 600 }}>
                      {peptideName(occ.peptideId)}
                    </div>
                    <div style={{ color: 'var(--text-2)', fontSize: 'var(--t-sm)' }}>
                      {occ.doseMg} mg · {drawUnitsLabel(occ)} · {formatTime(occ.timeOfDay)}
                    </div>
                  </div>
                  <span
                    style={{
                      color: taken ? 'var(--ok)' : 'var(--text-2)',
                      fontSize: 'var(--t-sm)',
                    }}
                  >
                    {taken ? 'Taken' : 'Pending'}
                  </span>
                </label>
              </Card>
            );
          })
        )}
      </section>

      <section
        aria-label="Upcoming doses"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}
      >
        <h2 style={{ margin: 0, fontSize: 'var(--t-h2)', color: 'var(--text-0)' }}>
          Upcoming doses
        </h2>
        {upcoming.length === 0 ? (
          <p style={{ color: 'var(--text-2)', margin: 0 }}>Nothing scheduled for tomorrow.</p>
        ) : (
          upcoming.map((occ) => (
            <Card key={`up-${occ.peptideId}-${occ.scheduledFor}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-0)' }}>{peptideName(occ.peptideId)}</span>
                <span style={{ color: 'var(--text-2)', fontSize: 'var(--t-sm)' }}>
                  {occ.doseMg} mg · {formatTime(occ.timeOfDay)}
                </span>
              </div>
            </Card>
          ))
        )}
      </section>

      <section
        aria-label="My Peptides"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}
      >
        <h2 style={{ margin: 0, fontSize: 'var(--t-h2)', color: 'var(--text-0)' }}>My Peptides</h2>
        {protocol.items.map((item) => (
          <Card key={`pep-${item.peptideId}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-0)' }}>{peptideName(item.peptideId)}</span>
              <span style={{ color: 'var(--text-2)', fontSize: 'var(--t-sm)' }}>
                {item.doseMg} mg · {formatTime(item.timeOfDay)}
              </span>
            </div>
          </Card>
        ))}
      </section>
    </main>
  );
}
