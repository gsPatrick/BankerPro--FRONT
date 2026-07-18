'use client';

import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/atoms/Button/Button';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import Pagination from '@/components/molecules/Pagination/Pagination';
import Modal from '@/components/organisms/Modal/Modal';
import { api } from '@/lib/api';
import { pickField } from '@/lib/normalize';
import styles from './carteira.module.css';

const STATUSES = [
  'Todos',
  'Novo',
  'Em negociação',
  'Simulação enviada',
  'Aguardando retorno',
  'Fechado',
  'Perdido',
];

const EMPTY_FORM = {
  name: '',
  phone: '',
  objective: '',
  approximateIncome: '',
  offeredProduct: '',
  status: 'Novo',
  lastContact: '',
  nextReturn: '',
  notes: '',
};

function toDateInput(value) {
  if (!value) return '';
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return '';
  const iso = toDateInput(value);
  if (!iso) return value;
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('pt-BR');
}

function normalizeClient(raw = {}) {
  return {
    id: pickField(raw, 'id'),
    name: pickField(raw, 'name') || '',
    // Telefone e WhatsApp viraram um contato só: clientes antigos podem ter
    // preenchido apenas um dos dois, então o que existir vira o contato.
    phone: pickField(raw, 'phone') || pickField(raw, 'whatsapp') || '',
    objective: pickField(raw, 'objective') || '',
    approximateIncome:
      pickField(raw, 'approximateIncome', 'approximate_income') || '',
    offeredProduct: pickField(raw, 'offeredProduct', 'offered_product') || '',
    status: pickField(raw, 'status') || 'Novo',
    lastContact: toDateInput(pickField(raw, 'lastContact', 'last_contact')),
    nextReturn: toDateInput(pickField(raw, 'nextReturn', 'next_return')),
    notes: pickField(raw, 'notes') || '',
  };
}

function statusClass(status) {
  const key = String(status || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
  const map = {
    novo: styles.statusNovo,
    emnegociacao: styles.statusEmnegociacao,
    simulacaoenviada: styles.statusSimulacaoenviada,
    aguardandoretorno: styles.statusAguardandoretorno,
    fechado: styles.statusFechado,
    perdido: styles.statusPerdido,
  };
  return map[key] || styles.statusNovo;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function CarteiraPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Todos');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
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
      showToast(err.message || 'Não foi possível carregar a carteira.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, status, pageSize]);

  const counts = useMemo(() => {
    const byStatus = Object.fromEntries(STATUSES.slice(1).map((item) => [item, 0]));
    clients.forEach((client) => {
      if (byStatus[client.status] !== undefined) byStatus[client.status] += 1;
    });
    return {
      total: clients.length,
      open: clients.filter((c) => !['Fechado', 'Perdido'].includes(c.status)).length,
      closed: clients.filter((c) => c.status === 'Fechado').length,
      byStatus,
    };
  }, [clients]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return clients.filter((client) => {
      const matchStatus = status === 'Todos' || client.status === status;
      if (!matchStatus) return false;
      if (!term) return true;
      const haystack = [
        client.name,
        client.objective,
        client.offeredProduct,
        client.phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [clients, search, status]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (client) => {
    setEditingId(client.id);
    setForm({ ...EMPTY_FORM, ...client });
    setModalOpen(true);
  };

  const saveClient = async () => {
    if (!form.name.trim()) {
      showToast('Informe o nome do cliente.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        // O contato é único, mas as duas colunas seguem espelhadas para não quebrar
        // quem já lê o whatsapp do cliente.
        phone: form.phone || null,
        whatsapp: form.phone || null,
        objective: form.objective || null,
        approximateIncome: form.approximateIncome || null,
        offeredProduct: form.offeredProduct || null,
        status: form.status || 'Novo',
        lastContact: form.lastContact || null,
        nextReturn: form.nextReturn || null,
        notes: form.notes || null,
      };

      if (editingId) {
        await api.put(`/clients/${editingId}`, payload);
        showToast('Cliente atualizado.');
      } else {
        await api.post('/clients', payload);
        showToast('Cliente adicionado à carteira.');
      }
      setModalOpen(false);
      await loadClients();
    } catch (err) {
      showToast(err.message || 'Não foi possível salvar o cliente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteClient = async (client, event) => {
    event?.stopPropagation?.();
    if (!window.confirm(`Excluir ${client.name} da carteira?`)) return;
    try {
      await api.delete(`/clients/${client.id}`);
      showToast('Cliente removido.');
      setClients((current) => current.filter((item) => item.id !== client.id));
    } catch (err) {
      showToast(err.message || 'Não foi possível excluir.', 'error');
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }

  const hasData = clients.length > 0;

  return (
    <div className={styles.page}>
      <section className={styles.walletShell}>
        <div className={styles.walletLeft}>
          <div className={styles.walletTop}>
            <div className={styles.walletCopy}>
              <p className={styles.eyebrow}>Gestão</p>
              <h1 className={styles.title}>Minha carteira</h1>
              <p className={styles.subtitle}>
                Seus clientes como bilhetes no bolso: status, retorno e produto à mão.
              </p>
            </div>
            <button type="button" className={styles.walletCta} onClick={openNew}>
              <span aria-hidden="true">+</span>
              Novo cliente
            </button>
          </div>
        </div>

        <div className={styles.walletRight}>
          <div className={styles.walletMeta}>
            <p className={styles.cardBrand}>Closer.IA · Wallet</p>
            <div className={styles.billChip} aria-hidden="true" />
          </div>
          <div className={styles.pocketStats}>
            <div className={styles.pocketStat}>
              <strong>{counts.total}</strong>
              <span>Clientes</span>
            </div>
            <div className={styles.pocketStat}>
              <strong>{counts.open}</strong>
              <span>Em aberto</span>
            </div>
            <div className={styles.pocketStat}>
              <strong>{counts.closed}</strong>
              <span>Fechados</span>
            </div>
          </div>
          <p className={styles.cardHint}>Resumo da sua carteira comercial</p>
        </div>
      </section>

      <div className={styles.toolbar}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Buscar</span>
          <div className={styles.searchWrap}>
            <SearchIcon />
            <input
              className={styles.search}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome, objetivo, produto..."
              aria-label="Buscar cliente"
            />
          </div>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Status</span>
          <select
            className={styles.select}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filtrar por status"
          >
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
                {item !== 'Todos' && counts.byStatus[item]
                  ? ` (${counts.byStatus[item]})`
                  : ''}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!hasData ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyChip} aria-hidden="true" />
          <h2 className={styles.emptyTitle}>Carteira vazia</h2>
          <p className={styles.emptyText}>
            Cadastre o primeiro cliente para acompanhar negociação, produto ofertado e
            próximo retorno.
          </p>
          <Button variant="primary" onClick={openNew}>
            Adicionar cliente
          </Button>
        </div>
      ) : paginated.length > 0 ? (
        <>
          <div className={styles.grid}>
            {paginated.map((client) => (
              <article
                key={client.id}
                className={styles.bill}
                onClick={() => openEdit(client)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openEdit(client);
                  }
                }}
              >
                <div className={styles.billTop}>
                  <div className={styles.billChip} aria-hidden="true" />
                  <span className={`${styles.status} ${statusClass(client.status)}`}>
                    {client.status}
                  </span>
                </div>

                <p className={styles.billBrand}>Carteira</p>
                <h3 className={styles.billName}>{client.name}</h3>
                <p className={styles.billMeta}>
                  {client.objective ||
                    client.offeredProduct ||
                    'Sem objetivo registrado.'}
                </p>

                <div className={styles.billFooter}>
                  <div className={styles.billInfo}>
                    {client.offeredProduct ? (
                      <span>Produto · {client.offeredProduct}</span>
                    ) : null}
                    {client.nextReturn ? (
                      <span>Retorno · {formatDate(client.nextReturn)}</span>
                    ) : (
                      <span>{client.phone || 'Sem contato informado'}</span>
                    )}
                  </div>
                  <div className={styles.billActions}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(client);
                      }}
                      aria-label="Editar"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                      onClick={(e) => deleteClient(client, e)}
                      aria-label="Excluir"
                    >
                      ⌫
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={filtered.length}
            pageSizes={[6, 9, 12, 15, 21]}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      ) : (
        <p className={styles.emptyFilter}>
          Nenhum cliente com esse filtro. Ajuste a busca ou o status.
        </p>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          if (!saving) setModalOpen(false);
        }}
        title={editingId ? 'Editar cliente' : 'Novo cliente'}
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button variant="primary" loading={saving} onClick={saveClient}>
              Salvar
            </Button>
          </>
        }
      >
        <div className={styles.formGrid}>
          <div className={`${styles.formField} ${styles.formFull}`}>
            <label>Nome</label>
            <input
              value={form.name}
              onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
              placeholder="Nome do cliente"
            />
          </div>
          <div className={`${styles.formField} ${styles.formFull}`}>
            <label>Telefone / WhatsApp</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className={`${styles.formField} ${styles.formFull}`}>
            <label>Objetivo</label>
            <input
              value={form.objective}
              onChange={(e) => setForm((current) => ({ ...current, objective: e.target.value }))}
              placeholder="Ex.: crédito para reforma"
            />
          </div>
          <div className={styles.formField}>
            <label>Renda aproximada</label>
            <input
              value={form.approximateIncome}
              onChange={(e) =>
                setForm((current) => ({ ...current, approximateIncome: e.target.value }))
              }
              placeholder="R$ 0,00"
            />
          </div>
          <div className={styles.formField}>
            <label>Produto ofertado</label>
            <input
              value={form.offeredProduct}
              onChange={(e) =>
                setForm((current) => ({ ...current, offeredProduct: e.target.value }))
              }
              placeholder="Consórcio, capitalização..."
            />
          </div>
          <div className={styles.formField}>
            <label>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))}
            >
              {STATUSES.filter((item) => item !== 'Todos').map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formField}>
            <label>Último contato</label>
            <input
              type="date"
              value={form.lastContact || ''}
              onChange={(e) =>
                setForm((current) => ({ ...current, lastContact: e.target.value }))
              }
            />
          </div>
          <div className={styles.formField}>
            <label>Próximo retorno</label>
            <input
              type="date"
              value={form.nextReturn || ''}
              onChange={(e) =>
                setForm((current) => ({ ...current, nextReturn: e.target.value }))
              }
            />
          </div>
          <div className={`${styles.formField} ${styles.formFull}`}>
            <label>Observações</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
              placeholder="Anotações do atendimento..."
            />
          </div>
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
