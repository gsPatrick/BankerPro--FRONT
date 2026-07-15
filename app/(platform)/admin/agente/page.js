'use client';

import { useState } from 'react';
import Button from '@/components/atoms/Button/Button';
import Toast from '@/components/molecules/Toast/Toast';
import { api } from '@/lib/api';
import styles from '../admin.module.css';

export default function AdminAgentePage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Olá! Sou o Auto-Gestor IA. Posso criar/editar cenários, gerenciar assinaturas e executar ações administrativas. O que você precisa?',
    },
  ]);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

  const showToast = (message) => {
    setToast({ visible: true, message, type: 'error' });
    setTimeout(() => setToast((c) => ({ ...c, visible: false })), 3500);
  };

  const send = async (event) => {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || loading) return;

    setInput('');
    setMessages((current) => [...current, { role: 'user', content: prompt }]);
    setLoading(true);

    try {
      const res = await api.post('/admin/ai-agent/run', { prompt });
      const data = res?.data || res || {};
      const reply =
        data.response ||
        data.message ||
        (typeof data === 'string' ? data : 'Comando processado.');
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: reply },
      ]);
    } catch (err) {
      showToast(err.message || 'Falha ao falar com o Auto-Gestor.');
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: 'Não consegui processar esse comando agora.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Administração</p>
          <h1 className={styles.title}>Auto-Gestor IA</h1>
          <p className={styles.subtitle}>
            Comandos administrativos assistidos por IA (cenários, planos, base).
          </p>
        </div>
      </header>

      <section className={`${styles.panel} ${styles.chat}`}>
        <div className={styles.messages}>
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`${styles.bubble} ${
                message.role === 'user' ? styles.bubbleUser : styles.bubbleBot
              }`}
            >
              {message.content}
            </div>
          ))}
        </div>

        <form className={styles.composer} onSubmit={send}>
          <input
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: crie um cenário de consignado para aposentado…"
            disabled={loading}
          />
          <Button type="submit" variant="primary" disabled={loading || !input.trim()}>
            {loading ? '…' : 'Enviar'}
          </Button>
        </form>
      </section>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((c) => ({ ...c, visible: false }))}
      />
    </div>
  );
}
