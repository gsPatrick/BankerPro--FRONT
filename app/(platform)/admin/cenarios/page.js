'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/atoms/Button/Button';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import Modal from '@/components/organisms/Modal/Modal';
import { api } from '@/lib/api';
import { normalizeScenario } from '@/lib/normalize';
import styles from '../admin.module.css';

const CATEGORIES = [
  'Caixa e Balcão',
  'Mesa Comercial',
  'Conta e Relacionamento',
  'Crédito Disponível',
  'Sem Crédito Disponível',
  'Produto Já Contratado',
  'Aposentado/Consignado',
  'Cartão',
  'MEI/Pequeno Negócio',
];

const DIFFICULTIES = ['Iniciante', 'Intermediário', 'Avançado'];

const EMPTY = {
  title: '',
  description: '',
  category: CATEGORIES[0],
  difficulty: 'Intermediário',
  clientName: '',
  clientAge: '',
  clientPersona: '',
  clientProfile: '',
  openingMessage: '',
  userObjective: '',
  commercialClues: '',
  mainProduct: '',
  supportProducts: '',
};

function buildTesterPrompt(scenario) {
  return [
    scenario.clientPersona || 'Você é um cliente de banco em atendimento presencial ou remoto.',
    '',
    `Nome do cliente: ${scenario.clientName || 'Cliente'}`,
    scenario.clientAge ? `Idade: ${scenario.clientAge}` : null,
    scenario.category ? `Categoria do atendimento: ${scenario.category}` : null,
    scenario.difficulty ? `Dificuldade: ${scenario.difficulty}` : null,
    scenario.clientProfile ? `Perfil: ${scenario.clientProfile}` : null,
    scenario.description ? `Contexto: ${scenario.description}` : null,
    scenario.commercialClues ? `Pistas comerciais (não revele de uma vez): ${scenario.commercialClues}` : null,
    scenario.mainProduct ? `Produto principal envolvido: ${scenario.mainProduct}` : null,
    '',
    'Responda SEMPRE como o cliente, em português do Brasil, de forma natural e coerente com a persona.',
    'Não quebre personagem. Seja breve e realista.',
  ]
    .filter(Boolean)
    .join('\n');
}

function openingFor(scenario) {
  if (scenario.openingMessage) return scenario.openingMessage;
  return `Olá, meu nome é ${scenario.clientName || 'Cliente'}. Vim falar sobre uma necessidade minha.`;
}

function toApiMessages(messages) {
  return messages
    .filter((item) => item.role === 'user' || item.role === 'client' || item.role === 'assistant')
    .map((item) => ({
      role: item.role === 'client' ? 'assistant' : item.role,
      content: item.content,
    }));
}

export default function AdminCenariosPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [tester, setTester] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((c) => ({ ...c, visible: false })), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/scenarios');
      const list = res?.data || res || [];
      setItems((Array.isArray(list) ? list : []).map(normalizeScenario));
    } catch (err) {
      showToast(err.message || 'Erro ao carregar cenários.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      category: item.category || CATEGORIES[0],
      difficulty: item.difficulty || 'Intermediário',
      clientName: item.clientName,
      clientAge: item.clientAge ?? '',
      clientPersona: item.clientPersona,
      clientProfile: item.clientProfile,
      openingMessage: item.openingMessage,
      userObjective: item.userObjective,
      commercialClues: item.commercialClues,
      mainProduct: item.mainProduct,
      supportProducts: item.supportProducts,
    });
    setFormOpen(true);
  };

  const save = async () => {
    const payload = {
      ...form,
      title: form.title.trim(),
      clientName: form.clientName.trim(),
      clientPersona: form.clientPersona.trim(),
      openingMessage: form.openingMessage.trim(),
      clientAge: form.clientAge === '' ? null : Number(form.clientAge),
    };
    if (
      !payload.title ||
      !payload.category ||
      !payload.difficulty ||
      !payload.clientPersona ||
      !payload.clientName ||
      !payload.openingMessage
    ) {
      showToast('Preencha os campos obrigatórios do cenário.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/scenarios/${editingId}`, payload);
        showToast('Cenário atualizado.');
      } else {
        await api.post('/admin/scenarios', payload);
        showToast('Cenário criado.');
      }
      setFormOpen(false);
      load();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Excluir "${item.title}"?`)) return;
    try {
      await api.delete(`/admin/scenarios/${item.id}`);
      showToast('Cenário removido.');
      load();
    } catch (err) {
      showToast(err.message || 'Erro ao excluir.', 'error');
    }
  };

  const openTester = (scenario) => {
    setTester({
      scenario,
      prompt: buildTesterPrompt(scenario),
      messages: [{ role: 'client', content: openingFor(scenario) }],
      inputText: '',
      sending: false,
    });
  };

  const sendTesterMessage = async () => {
    if (!tester || !tester.inputText.trim() || tester.sending) return;

    const userMessage = { role: 'user', content: tester.inputText.trim() };
    const nextMessages = [...tester.messages, userMessage];

    setTester((current) => ({
      ...current,
      messages: nextMessages,
      inputText: '',
      sending: true,
    }));

    try {
      const res = await api.post('/admin/prompts/test', {
        system: tester.prompt,
        messages: toApiMessages(nextMessages),
      });
      const data = res?.data || res || {};
      const reply =
        typeof data === 'string'
          ? data
          : data.response || data.message || data.content || '';

      setTester((current) => ({
        ...current,
        messages: [
          ...nextMessages,
          {
            role: 'client',
            content: reply || 'Sem resposta da IA.',
          },
        ],
        sending: false,
      }));
    } catch (err) {
      showToast(err.message || 'Erro na resposta da IA.', 'error');
      setTester((current) =>
        current ? { ...current, sending: false } : current
      );
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
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Administração</p>
          <h1 className={styles.title}>Cenários</h1>
          <p className={styles.subtitle}>
            Crie e edite cenários de simulação usados no treino comercial.
          </p>
        </div>
        <Button type="button" variant="primary" onClick={openCreate}>
          Novo cenário
        </Button>
      </header>

      <section className={styles.panel}>
        {items.length === 0 ? (
          <p className={styles.empty}>Nenhum cenário cadastrado.</p>
        ) : (
          <div className={styles.list}>
            {items.map((item) => (
              <article key={item.id} className={styles.listItem}>
                <div>
                  <h3>{item.title}</h3>
                  <p>
                    {item.category} · {item.difficulty} · {item.clientName}
                  </p>
                </div>
                <div className={styles.actions}>
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={() => openTester(item)}
                  >
                    Testar IA
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => openEdit(item)}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={() => remove(item)}
                  >
                    Excluir
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Editar cenário' : 'Novo cenário'}
        size="lg"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={save} disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Título</span>
            <input
              className={styles.input}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </label>
          <div className={styles.formRow}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Categoria</span>
              <select
                className={styles.select}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Dificuldade</span>
              <select
                className={styles.select}
                value={form.difficulty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, difficulty: e.target.value }))
                }
              >
                {DIFFICULTIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles.formRow}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Nome do cliente</span>
              <input
                className={styles.input}
                value={form.clientName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, clientName: e.target.value }))
                }
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Idade</span>
              <input
                className={styles.input}
                type="number"
                value={form.clientAge}
                onChange={(e) =>
                  setForm((f) => ({ ...f, clientAge: e.target.value }))
                }
              />
            </label>
          </div>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Persona</span>
            <textarea
              className={styles.textarea}
              value={form.clientPersona}
              onChange={(e) =>
                setForm((f) => ({ ...f, clientPersona: e.target.value }))
              }
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Mensagem de abertura</span>
            <textarea
              className={styles.textarea}
              value={form.openingMessage}
              onChange={(e) =>
                setForm((f) => ({ ...f, openingMessage: e.target.value }))
              }
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Descrição</span>
            <textarea
              className={styles.textarea}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Perfil do cliente</span>
            <textarea
              className={styles.textarea}
              value={form.clientProfile}
              onChange={(e) =>
                setForm((f) => ({ ...f, clientProfile: e.target.value }))
              }
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Objetivo do usuário</span>
            <textarea
              className={styles.textarea}
              value={form.userObjective}
              onChange={(e) =>
                setForm((f) => ({ ...f, userObjective: e.target.value }))
              }
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Pistas comerciais</span>
            <textarea
              className={styles.textarea}
              value={form.commercialClues}
              onChange={(e) =>
                setForm((f) => ({ ...f, commercialClues: e.target.value }))
              }
            />
          </label>
          <div className={styles.formRow}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Produto principal</span>
              <input
                className={styles.input}
                value={form.mainProduct}
                onChange={(e) =>
                  setForm((f) => ({ ...f, mainProduct: e.target.value }))
                }
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Produtos de apoio</span>
              <input
                className={styles.input}
                value={form.supportProducts}
                onChange={(e) =>
                  setForm((f) => ({ ...f, supportProducts: e.target.value }))
                }
              />
            </label>
          </div>
        </div>
      </Modal>

      {tester ? (
        <div className={styles.testerOverlay} role="dialog" aria-modal="true">
          <div className={styles.testerShell}>
            <div className={styles.testerHeader}>
              <div>
                <p className={styles.eyebrow}>Teste em tempo real</p>
                <h3>{tester.scenario.title}</h3>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setTester(null)}
              >
                Fechar
              </Button>
            </div>

            <div className={styles.testerBody}>
              <div className={styles.testerPane}>
                <span className={styles.fieldLabel}>Prompt da persona</span>
                <textarea
                  className={styles.testerPrompt}
                  value={tester.prompt}
                  onChange={(e) =>
                    setTester((current) => ({
                      ...current,
                      prompt: e.target.value,
                    }))
                  }
                />
                <p className={styles.hint}>
                  Alterações neste prompt valem só neste teste. Para salvar de
                  verdade, edite o cenário.
                </p>
              </div>

              <div className={styles.testerPane}>
                <span className={styles.fieldLabel}>Chat de teste</span>
                <div className={styles.testerMessages}>
                  {tester.messages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`${styles.testerBubble} ${
                        message.role === 'user'
                          ? styles.testerBubbleUser
                          : styles.testerBubbleClient
                      }`}
                    >
                      {message.content}
                    </div>
                  ))}
                  {tester.sending ? (
                    <div
                      className={`${styles.testerBubble} ${styles.testerBubbleClient}`}
                    >
                      Cliente pensando…
                    </div>
                  ) : null}
                </div>

                <div className={styles.testerComposer}>
                  <input
                    className={styles.input}
                    value={tester.inputText}
                    placeholder="Digite sua fala como bancário…"
                    disabled={tester.sending}
                    onChange={(e) =>
                      setTester((current) => ({
                        ...current,
                        inputText: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        sendTesterMessage();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="primary"
                    disabled={tester.sending || !tester.inputText.trim()}
                    onClick={sendTesterMessage}
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((c) => ({ ...c, visible: false }))}
      />
    </div>
  );
}
