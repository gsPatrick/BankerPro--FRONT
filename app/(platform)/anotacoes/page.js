'use client';

import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/atoms/Button/Button';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import Pagination from '@/components/molecules/Pagination/Pagination';
import Modal from '@/components/organisms/Modal/Modal';
import { api } from '@/lib/api';
import { pickField } from '@/lib/normalize';
import styles from './anotacoes.module.css';

function normalizeNote(raw = {}) {
  return {
    id: pickField(raw, 'id'),
    content: pickField(raw, 'content') || '',
    createdAt: pickField(raw, 'createdAt', 'created_at', 'created_date'),
  };
}

function formatNoteDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AnotacoesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [input, setInput] = useState('');
  const [notes, setNotes] = useState([]);
  const [completingId, setCompletingId] = useState(null);
  const [discardingId, setDiscardingId] = useState(null);
  const [sessionDone, setSessionDone] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success',
  });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((current) => ({ ...current, visible: false })), 3200);
  };

  const loadNotes = async () => {
    try {
      const res = await api.get('/notes');
      const list = (res?.data || res || []).map(normalizeNote);
      setNotes(list);
    } catch (err) {
      showToast(err.message || 'Não foi possível carregar as anotações.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(notes.length / pageSize) || 1);
    if (page > totalPages) setPage(totalPages);
  }, [notes.length, page, pageSize]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return notes.slice(start, start + pageSize);
  }, [notes, page, pageSize]);

  const openModal = () => {
    setInput('');
    setModalOpen(true);
  };

  const addNote = async () => {
    const content = input.trim();
    if (!content || saving) return;

    setSaving(true);
    try {
      const res = await api.post('/notes', { content });
      const created = normalizeNote(res?.data || res);
      if (created?.id) {
        setNotes((current) => [created, ...current]);
        setPage(1);
      } else {
        await loadNotes();
      }
      setInput('');
      setModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Não foi possível salvar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const completeNote = async (note) => {
    if (completingId || discardingId) return;
    setCompletingId(note.id);

    window.setTimeout(async () => {
      try {
        await api.delete(`/notes/${note.id}`);
        setNotes((current) => current.filter((item) => item.id !== note.id));
        setSessionDone((count) => count + 1);
      } catch (err) {
        showToast(err.message || 'Não foi possível concluir.', 'error');
      } finally {
        setCompletingId(null);
      }
    }, 480);
  };

  const discardNote = async (note) => {
    if (completingId || discardingId) return;
    setDiscardingId(note.id);

    try {
      await api.delete(`/notes/${note.id}`);
      setNotes((current) => current.filter((item) => item.id !== note.id));
    } catch (err) {
      showToast(err.message || 'Não foi possível excluir.', 'error');
    } finally {
      setDiscardingId(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.banner}>
        <div className={styles.bannerTop}>
          <div className={styles.bannerCopy}>
            <p className={styles.eyebrow}>Gestão</p>
            <h1 className={styles.title}>Anotações rápidas</h1>
            <p className={styles.subtitle}>
              Liste lembretes comerciais, marque como concluído e siga o fluxo.
            </p>
          </div>
          <button type="button" className={styles.bannerCta} onClick={openModal}>
            <span aria-hidden="true">+</span>
            Nova anotação
          </button>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <strong>{notes.length}</strong>
            <span>Em aberto</span>
          </div>
          <div className={styles.stat}>
            <strong>{sessionDone}</strong>
            <span>Concluídas agora</span>
          </div>
        </div>
      </section>

      {notes.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>Nenhuma anotação</h2>
          <p className={styles.emptyText}>
            Adicione um lembrete. Ao concluir, a lista risca o texto e remove o item.
          </p>
          <Button variant="primary" onClick={openModal}>
            Nova anotação
          </Button>
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {paginated.map((note) => {
              const isCompleting = completingId === note.id;
              const isDiscarding = discardingId === note.id;

              return (
                <div
                  key={note.id}
                  className={[
                    styles.row,
                    isCompleting ? styles.completing : '',
                    isDiscarding ? styles.discarding : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <button
                    type="button"
                    className={styles.check}
                    onClick={() => completeNote(note)}
                    disabled={Boolean(completingId || discardingId)}
                    aria-label={`Concluir: ${note.content}`}
                  >
                    <span className={styles.checkMark} aria-hidden="true">
                      ✓
                    </span>
                  </button>

                  <div className={styles.rowMain}>
                    <span className={styles.contentWrap}>
                      <span className={styles.content}>{note.content}</span>
                    </span>
                    <p className={styles.date}>{formatNoteDate(note.createdAt)}</p>
                  </div>

                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => discardNote(note)}
                    disabled={Boolean(completingId || discardingId)}
                    aria-label="Excluir anotação"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={notes.length}
            pageSizes={[5, 10, 15, 20, 25]}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          if (!saving) setModalOpen(false);
        }}
        title="Nova anotação"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              loading={saving}
              onClick={addNote}
              disabled={!input.trim()}
            >
              Salvar
            </Button>
          </>
        }
      >
        <div className={styles.formField}>
          <label htmlFor="note-content">Anotação</label>
          <textarea
            id="note-content"
            className={styles.formTextarea}
            value={input}
            rows={5}
            autoFocus
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                addNote();
              }
            }}
            placeholder='Ex.: "Cliente pediu retorno sexta com simulação de consórcio"...'
          />
          <p className={styles.formHint}>Dica: Ctrl/⌘ + Enter para salvar.</p>
        </div>
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
