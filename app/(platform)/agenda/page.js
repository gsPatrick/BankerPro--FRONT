'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/atoms/Button/Button';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import Modal from '@/components/organisms/Modal/Modal';
import { api } from '@/lib/api';
import { pickField } from '@/lib/normalize';
import styles from './agenda.module.css';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const VIEWS = [
  { id: 'month', label: 'Mês' },
  { id: 'week', label: 'Semana' },
  { id: 'agenda', label: 'Agenda' },
];

function toDateKey(value) {
  if (!value) return '';
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayKey() {
  return toDateKey(new Date());
}

function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date) {
  const next = new Date(date);
  next.setHours(12, 0, 0, 0);
  next.setDate(next.getDate() - next.getDay());
  return next;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0);
}

function formatMonthLabel(date) {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function formatLongDate(key) {
  if (!key) return '';
  return parseKey(key).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}

function formatShortDate(key) {
  if (!key) return '';
  return parseKey(key).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

function normalizeClient(raw = {}) {
  return {
    id: pickField(raw, 'id'),
    name: pickField(raw, 'name') || '',
    phone: pickField(raw, 'phone') || '',
    whatsapp: pickField(raw, 'whatsapp') || '',
    objective: pickField(raw, 'objective') || '',
    offeredProduct: pickField(raw, 'offeredProduct', 'offered_product') || '',
    status: pickField(raw, 'status') || 'Novo',
    nextReturn: toDateKey(pickField(raw, 'nextReturn', 'next_return')),
    notes: pickField(raw, 'notes') || '',
  };
}

function isOpenClient(client) {
  return client.status !== 'Fechado' && client.status !== 'Perdido';
}

function buildMonthCells(cursor) {
  const first = startOfMonth(cursor);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    return {
      key: toDateKey(date),
      date,
      day: date.getDate(),
      outside: date.getMonth() !== cursor.getMonth(),
    };
  });
}

function buildWeekDays(cursor) {
  const start = startOfWeek(cursor);
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(start, index);
    return {
      key: toDateKey(date),
      date,
      day: date.getDate(),
      dow: WEEKDAYS[date.getDay()],
    };
  });
}

export default function AgendaPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState([]);
  const [view, setView] = useState('month');
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rescheduleMap, setRescheduleMap] = useState({});
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((current) => ({ ...current, visible: false })), 3500);
  };

  const loadClients = async () => {
    try {
      const res = await api.get('/clients');
      const list = (res?.data || res || []).map(normalizeClient);
      setClients(list);
    } catch (err) {
      showToast(err.message || 'Não foi possível carregar a agenda.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const openClients = useMemo(() => clients.filter(isOpenClient), [clients]);

  const scheduled = useMemo(
    () => openClients.filter((client) => client.nextReturn),
    [openClients]
  );

  const noReturnCount = useMemo(
    () => openClients.filter((client) => !client.nextReturn).length,
    [openClients]
  );

  const eventsByDay = useMemo(() => {
    const map = {};
    scheduled.forEach((client) => {
      const key = client.nextReturn;
      if (!map[key]) map[key] = [];
      map[key].push(client);
    });
    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    });
    return map;
  }, [scheduled]);

  const today = todayKey();

  const overdueCount = useMemo(
    () => scheduled.filter((client) => client.nextReturn < today).length,
    [scheduled, today]
  );

  const monthCells = useMemo(() => buildMonthCells(cursor), [cursor]);
  const weekDays = useMemo(() => buildWeekDays(cursor), [cursor]);

  const agendaSections = useMemo(() => {
    const tomorrow = toDateKey(addDays(new Date(), 1));
    const max7 = toDateKey(addDays(new Date(), 7));
    return [
      {
        id: 'overdue',
        label: 'Atrasados',
        tone: 'overdue',
        items: scheduled.filter((c) => c.nextReturn < today),
      },
      {
        id: 'today',
        label: 'Hoje',
        tone: 'today',
        items: scheduled.filter((c) => c.nextReturn === today),
      },
      {
        id: 'tomorrow',
        label: 'Amanhã',
        tone: 'default',
        items: scheduled.filter((c) => c.nextReturn === tomorrow),
      },
      {
        id: 'week',
        label: 'Próximos 7 dias',
        tone: 'default',
        items: scheduled.filter(
          (c) => c.nextReturn > tomorrow && c.nextReturn <= max7
        ),
      },
    ];
  }, [scheduled, today]);

  const selectedEvents = selectedDay ? eventsByDay[selectedDay] || [] : [];

  const goToday = () => {
    const now = new Date();
    setCursor(view === 'week' ? startOfWeek(now) : startOfMonth(now));
  };

  const goPrev = () => {
    if (view === 'week') {
      setCursor((current) => addDays(startOfWeek(current), -7));
      return;
    }
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1, 12));
  };

  const goNext = () => {
    if (view === 'week') {
      setCursor((current) => addDays(startOfWeek(current), 7));
      return;
    }
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1, 12));
  };

  const openDay = (key) => {
    setSelectedDay(key);
    const list = eventsByDay[key] || [];
    const map = {};
    list.forEach((client) => {
      map[client.id] = client.nextReturn;
    });
    setRescheduleMap(map);
    setDetailOpen(true);
  };

  const saveReschedule = async (clientId) => {
    const nextReturn = rescheduleMap[clientId];
    if (!nextReturn) {
      showToast('Informe a nova data de retorno.', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/clients/${clientId}`, { nextReturn });
      setClients((current) =>
        current.map((item) =>
          item.id === clientId ? { ...item, nextReturn } : item
        )
      );
      showToast('Retorno reagendado.');
      if (selectedDay && nextReturn !== selectedDay) {
        const remaining = (eventsByDay[selectedDay] || []).filter(
          (item) => item.id !== clientId
        );
        if (remaining.length === 0) {
          setDetailOpen(false);
        }
      }
    } catch (err) {
      showToast(err.message || 'Não foi possível reagendar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }

  const periodLabel =
    view === 'week'
      ? (() => {
          const days = buildWeekDays(cursor);
          const start = days[0].date;
          const end = days[6].date;
          const sameMonth = start.getMonth() === end.getMonth();
          if (sameMonth) {
            return `${start.getDate()}–${end.getDate()} de ${formatMonthLabel(start)}`;
          }
          return `${start.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
          })} – ${end.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}`;
        })()
      : formatMonthLabel(cursor);

  const renderEventChip = (client) => {
    const overdue = client.nextReturn < today;
    const isToday = client.nextReturn === today;
    return (
      <button
        key={client.id}
        type="button"
        className={`${styles.eventChip} ${
          overdue ? styles.eventOverdue : isToday ? styles.eventToday : ''
        }`}
        onClick={(e) => {
          e.stopPropagation();
          openDay(client.nextReturn);
        }}
        title={client.name}
      >
        {client.name}
      </button>
    );
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <p className={styles.eyebrow}>Gestão</p>
          <h1 className={styles.title}>Agenda</h1>
          <p className={styles.subtitle}>Retornos comerciais da carteira</p>
        </div>

        <div className={styles.calendarBar}>
          <div className={styles.calendarNav}>
            <button type="button" className={styles.todayBtn} onClick={goToday}>
              Hoje
            </button>
            <div className={styles.arrowGroup}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={goPrev}
                aria-label="Anterior"
              >
                ‹
              </button>
              <button
                type="button"
                className={styles.navBtn}
                onClick={goNext}
                aria-label="Próximo"
              >
                ›
              </button>
            </div>
            <p className={styles.monthLabel}>{periodLabel}</p>
          </div>

          <div className={styles.viewSwitch}>
            {VIEWS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.viewBtn} ${
                  view === item.id ? styles.viewBtnActive : ''
                }`}
                onClick={() => {
                  setView(item.id);
                  if (item.id === 'week') {
                    setCursor((current) => startOfWeek(current));
                  } else if (item.id === 'month') {
                    setCursor((current) => startOfMonth(current));
                  }
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {overdueCount > 0 ? (
        <div className={`${styles.alert} ${styles.alertDanger}`}>
          <div>
            <strong>{overdueCount} retorno{overdueCount > 1 ? 's' : ''} atrasado{overdueCount > 1 ? 's' : ''}</strong>
            {' — '}
            reagende na visão do dia ou na carteira.
          </div>
        </div>
      ) : null}

      {noReturnCount > 0 ? (
        <div className={styles.alert}>
          <div>
            <strong>{noReturnCount} cliente{noReturnCount > 1 ? 's' : ''} sem retorno</strong>
            {' — '}
            agende um follow-up na{' '}
            <Link href="/carteira" style={{ color: '#f2f4f7', fontWeight: 700 }}>
              carteira
            </Link>
            .
          </div>
        </div>
      ) : null}

      {view === 'month' ? (
        <div className={styles.calendarShell}>
          <div className={styles.weekdays}>
            {WEEKDAYS.map((day) => (
              <div key={day} className={styles.weekday}>
                {day}
              </div>
            ))}
          </div>
          <div className={styles.monthGrid}>
            {monthCells.map((cell) => {
              const events = eventsByDay[cell.key] || [];
              const visible = events.slice(0, 2);
              const extra = events.length - visible.length;
              const isToday = cell.key === today;
              const hasOverdue = events.some((item) => item.nextReturn < today);
              return (
                <div
                  key={cell.key}
                  className={[
                    styles.dayCell,
                    cell.outside ? styles.dayOutside : '',
                    isToday ? styles.dayToday : '',
                    selectedDay === cell.key && detailOpen ? styles.daySelected : '',
                    events.length ? styles.hasEvents : '',
                    hasOverdue ? styles.hasOverdue : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => openDay(cell.key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openDay(cell.key);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <span className={styles.dayNum}>{cell.day}</span>
                  <div className={styles.events}>
                    {visible.map(renderEventChip)}
                    {extra > 0 ? (
                      <span className={styles.moreLink}>+{extra} mais</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {view === 'week' ? (
        <div className={styles.calendarShell}>
          <div className={styles.weekGrid}>
            {weekDays.map((day) => {
              const events = eventsByDay[day.key] || [];
              const isToday = day.key === today;
              return (
                <div
                  key={day.key}
                  className={`${styles.weekCol} ${isToday ? styles.weekColToday : ''}`}
                >
                  <div className={styles.weekColHead}>
                    <p className={styles.weekColDow}>{day.dow}</p>
                    <div className={styles.weekColDate}>{day.day}</div>
                  </div>
                  <div
                    className={styles.weekColBody}
                    onClick={() => openDay(day.key)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openDay(day.key);
                      }
                    }}
                  >
                    {events.length === 0 ? (
                      <p className={styles.weekEmpty}>Livre</p>
                    ) : (
                      events.map(renderEventChip)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {view === 'agenda' ? (
        <div className={styles.agendaList}>
          {agendaSections.every((section) => section.items.length === 0) ? (
            <div className={styles.emptyAgenda}>
              Nenhum retorno nos próximos dias. Cadastre um próximo retorno na carteira
              para preencher a agenda.
            </div>
          ) : (
            agendaSections.map((section) => (
              <section key={section.id} className={styles.agendaSection}>
                <div className={styles.sectionHead}>
                  <span
                    className={[
                      styles.sectionDot,
                      section.tone === 'overdue' ? styles.sectionDotOverdue : '',
                      section.tone === 'today' ? styles.sectionDotToday : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  />
                  <h2 className={styles.sectionTitle}>{section.label}</h2>
                  <span className={styles.sectionCount}>({section.items.length})</span>
                </div>
                {section.items.length === 0 ? (
                  <p className={styles.weekEmpty} style={{ textAlign: 'left', margin: 0 }}>
                    Nenhum retorno
                  </p>
                ) : (
                  section.items.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      className={styles.agendaCard}
                      onClick={() => openDay(client.nextReturn)}
                    >
                      <div className={styles.agendaCardMain}>
                        <p className={styles.agendaName}>{client.name}</p>
                        <p className={styles.agendaMeta}>
                          {client.objective ||
                            client.offeredProduct ||
                            client.status}
                        </p>
                      </div>
                      <span className={styles.agendaDate}>
                        {formatShortDate(client.nextReturn)}
                      </span>
                    </button>
                  ))
                )}
              </section>
            ))
          )}
        </div>
      ) : null}

      <Modal
        isOpen={detailOpen}
        onClose={() => {
          if (!saving) setDetailOpen(false);
        }}
        title={selectedDay ? formatLongDate(selectedDay) : 'Dia'}
        size="md"
        footer={
          <Button
            variant="secondary"
            onClick={() => setDetailOpen(false)}
            disabled={saving}
          >
            Fechar
          </Button>
        }
      >
        {selectedEvents.length === 0 ? (
          <p className={styles.emptyDay}>
            Nenhum retorno neste dia. Defina um próximo retorno na carteira para
            aparecer aqui.
          </p>
        ) : (
          <div className={styles.detailList}>
            {selectedEvents.map((client) => (
              <article key={client.id} className={styles.detailCard}>
                <div className={styles.detailTop}>
                  <h3 className={styles.detailName}>{client.name}</h3>
                  <span className={styles.detailStatus}>{client.status}</span>
                </div>
                {client.objective ? (
                  <p className={styles.detailLine}>{client.objective}</p>
                ) : null}
                {client.offeredProduct ? (
                  <p className={styles.detailLine}>
                    Produto · {client.offeredProduct}
                  </p>
                ) : null}
                {client.whatsapp || client.phone ? (
                  <p className={styles.detailLine}>
                    Contato · {client.whatsapp || client.phone}
                  </p>
                ) : null}
                {client.notes ? (
                  <p className={styles.detailLine}>{client.notes}</p>
                ) : null}

                <div className={styles.rescheduleRow}>
                  <div className={styles.dateField}>
                    <label htmlFor={`return-${client.id}`}>Reagendar</label>
                    <input
                      id={`return-${client.id}`}
                      type="date"
                      value={rescheduleMap[client.id] || client.nextReturn}
                      onChange={(e) =>
                        setRescheduleMap((current) => ({
                          ...current,
                          [client.id]: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={saving}
                    onClick={() => saveReschedule(client.id)}
                  >
                    Salvar
                  </Button>
                </div>

                <div className={styles.detailActions}>
                  <Link href="/carteira">
                    <Button variant="secondary" size="sm">
                      Ver na carteira
                    </Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </Modal>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((current) => ({ ...current, visible: false }))}
      />
    </div>
  );
}
