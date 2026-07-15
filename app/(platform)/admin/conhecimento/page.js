'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/atoms/Button/Button';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import Modal from '@/components/organisms/Modal/Modal';
import { api } from '@/lib/api';
import { pickField } from '@/lib/normalize';
import styles from '../admin.module.css';

const CATEGORIES = [
  'Investimentos',
  'Previdência',
  'Seguros',
  'Crédito',
  'Cartões',
  'Consórcio',
  'Capitalização',
];

const EMPTY = {
  topicTitle: '',
  category: 'Consórcio',
  content: '',
};

function normalizeTopic(raw = {}) {
  return {
    id: pickField(raw, 'id'),
    topicTitle: pickField(raw, 'topicTitle', 'topic_title') || '',
    category: pickField(raw, 'category') || '',
    content: pickField(raw, 'content') || '',
  };
}

export default function AdminConhecimentoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((c) => ({ ...c, visible: false })), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/knowledge');
      const list = res?.data || res || [];
      setItems((Array.isArray(list) ? list : []).map(normalizeTopic));
    } catch (err) {
      showToast(err.message || 'Erro ao carregar conhecimento.', 'error');
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
      topicTitle: item.topicTitle,
      category: item.category || 'Consórcio',
      content: item.content,
    });
    setFormOpen(true);
  };

  const save = async () => {
    const payload = {
      topicTitle: form.topicTitle.trim(),
      category: form.category,
      content: form.content.trim(),
    };
    if (!payload.topicTitle || !payload.category) {
      showToast('Informe título e categoria.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/knowledge/${editingId}`, payload);
        showToast('Tópico atualizado.');
      } else {
        await api.post('/admin/knowledge', payload);
        showToast('Tópico criado.');
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
    if (!window.confirm(`Excluir "${item.topicTitle}"?`)) return;
    try {
      await api.delete(`/admin/knowledge/${item.id}`);
      showToast('Tópico removido.');
      load();
    } catch (err) {
      showToast(err.message || 'Erro ao excluir.', 'error');
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
          <h1 className={styles.title}>Base de conhecimento</h1>
          <p className={styles.subtitle}>
            Tópicos de produto usados pelo Copiloto IA nas respostas.
          </p>
        </div>
        <Button type="button" variant="primary" onClick={openCreate}>
          Novo tópico
        </Button>
      </header>

      <section className={styles.panel}>
        {items.length === 0 ? (
          <p className={styles.empty}>Nenhum tópico cadastrado.</p>
        ) : (
          <div className={styles.list}>
            {items.map((item) => (
              <article key={item.id} className={styles.listItem}>
                <div>
                  <h3>{item.topicTitle}</h3>
                  <p>{item.category}</p>
                </div>
                <div className={styles.actions}>
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
        title={editingId ? 'Editar tópico' : 'Novo tópico'}
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
              value={form.topicTitle}
              onChange={(e) =>
                setForm((f) => ({ ...f, topicTitle: e.target.value }))
              }
            />
          </label>
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
            <span className={styles.fieldLabel}>Conteúdo</span>
            <textarea
              className={styles.textarea}
              style={{ minHeight: 180 }}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            />
          </label>
        </div>
      </Modal>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((c) => ({ ...c, visible: false }))}
      />
    </div>
  );
}
