'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/atoms/Button/Button';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import Modal from '@/components/organisms/Modal/Modal';
import { api } from '@/lib/api';
import { pickField } from '@/lib/normalize';
import styles from '../admin.module.css';

function normalizePrompt(raw = {}) {
  return {
    id: pickField(raw, 'id'),
    key: pickField(raw, 'key') || '',
    content: pickField(raw, 'content') || '',
  };
}

export default function AdminPromptsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [content, setContent] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((c) => ({ ...c, visible: false })), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/prompts');
      const list = res?.data || res || [];
      setItems((Array.isArray(list) ? list : []).map(normalizePrompt));
    } catch (err) {
      showToast(err.message || 'Erro ao carregar prompts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (item) => {
    setEditing(item);
    setContent(item.content || '');
  };

  const save = async () => {
    if (!editing?.key) return;
    setSaving(true);
    try {
      await api.put(`/admin/prompts/${editing.key}`, { content });
      showToast('Prompt atualizado.');
      setEditing(null);
      load();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar.', 'error');
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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Administração</p>
          <h1 className={styles.title}>Prompts globais</h1>
          <p className={styles.subtitle}>
            Edite as instruções do simulador e do copiloto usadas pela IA.
          </p>
        </div>
      </header>

      <section className={styles.panel}>
        {items.length === 0 ? (
          <p className={styles.empty}>Nenhum prompt encontrado.</p>
        ) : (
          <div className={styles.list}>
            {items.map((item) => (
              <article key={item.key || item.id} className={styles.listItem}>
                <div>
                  <h3>{item.key}</h3>
                  <p>
                    {(item.content || '').slice(0, 140)}
                    {(item.content || '').length > 140 ? '…' : ''}
                  </p>
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
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={`Editar: ${editing?.key || ''}`}
        size="lg"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={save} disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Conteúdo do prompt</span>
          <textarea
            className={styles.textarea}
            style={{ minHeight: 280 }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </label>
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
