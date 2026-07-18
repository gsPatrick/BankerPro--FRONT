'use client';

import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/atoms/Button/Button';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import { api } from '@/lib/api';
import { pickField } from '@/lib/normalize';
import styles from './configuracoes.module.css';

const TABS = [
  { id: 'integracoes', label: 'Integrações', desc: 'Chaves de API' },
  { id: 'whatsapp', label: 'WhatsApp', desc: 'Conexão do Copilot' },
  { id: 'privacidade', label: 'Privacidade', desc: 'Termos e LGPD' },
];

const INTEGRATION_KEYS = [
  { key: 'ANTHROPIC_API_KEY', label: 'Anthropic API Key' },
  { key: 'OPENAI_API_KEY', label: 'OpenAI API Key (transcrição de áudio)' },
  { key: 'MP_ACCESS_TOKEN', label: 'Mercado Pago Access Token' },
  { key: 'MP_PUBLIC_KEY', label: 'Mercado Pago Public Key' },
  { key: 'EVOLUTION_API_URL', label: 'Evolution API URL' },
  { key: 'EVOLUTION_API_KEY', label: 'Evolution API Key' },
  { key: 'WHATSAPP_COPILOT_NUMBER', label: 'Número do Copiloto WhatsApp (para os usuários mandarem mensagem)' },
];

export default function AdminConfigPage() {
  const [tab, setTab] = useState('integracoes');
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState('');
  const [form, setForm] = useState({});
  const [wa, setWa] = useState(null);
  const [waBusy, setWaBusy] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((c) => ({ ...c, visible: false })), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/settings');
      const list = res?.data || res || [];
      const next = {};
      (Array.isArray(list) ? list : []).forEach((item) => {
        const key = pickField(item, 'key');
        if (key) next[key] = pickField(item, 'value') || '';
      });
      setForm(next);
    } catch (err) {
      showToast(err.message || 'Erro ao carregar configurações.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadWa = async () => {
    try {
      const res = await api.get('/whatsapp/status');
      setWa(res?.data || res || null);
    } catch {
      setWa(null);
    }
  };

  useEffect(() => {
    load();
    loadWa();
  }, []);

  const saveKey = async (key) => {
    setSavingKey(key);
    try {
      await api.post('/admin/settings', { key, value: form[key] || '' });
      showToast('Configuração salva.');
    } catch (err) {
      showToast(err.message || 'Erro ao salvar.', 'error');
    } finally {
      setSavingKey('');
    }
  };

  const connectWa = async () => {
    setWaBusy(true);
    try {
      await api.post('/whatsapp/connect');
      showToast('Conexão iniciada. Atualizando status…');
      await loadWa();
    } catch (err) {
      showToast(err.message || 'Erro ao conectar WhatsApp.', 'error');
    } finally {
      setWaBusy(false);
    }
  };

  const disconnectWa = async () => {
    setWaBusy(true);
    try {
      await api.post('/whatsapp/disconnect');
      showToast('WhatsApp desconectado.');
      await loadWa();
    } catch (err) {
      showToast(err.message || 'Erro ao desconectar.', 'error');
    } finally {
      setWaBusy(false);
    }
  };

  const activeTab = useMemo(
    () => TABS.find((item) => item.id === tab) || TABS[0],
    [tab]
  );

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }

  const qr =
    wa?.qrcode?.base64 ||
    wa?.qrcode?.base64Image ||
    (typeof wa?.qrcode === 'string' ? wa.qrcode : null);

  const renderField = (item) => (
    <article key={item.key} className={styles.fieldBlock}>
      <div className={styles.fieldHead}>
        <div>
          <h4>{item.label}</h4>
          <p className={styles.hint}>{item.key}</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="primary"
          disabled={savingKey === item.key}
          onClick={() => saveKey(item.key)}
        >
          {savingKey === item.key ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
      {item.multiline ? (
        <textarea
          className={styles.textarea}
          value={form[item.key] || ''}
          onChange={(e) =>
            setForm((current) => ({
              ...current,
              [item.key]: e.target.value,
            }))
          }
        />
      ) : (
        <input
          className={styles.input}
          value={form[item.key] || ''}
          onChange={(e) =>
            setForm((current) => ({
              ...current,
              [item.key]: e.target.value,
            }))
          }
        />
      )}
    </article>
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Administração</p>
          <h2 className={styles.title}>Configurações</h2>
          <p className={styles.subtitle}>
            Chaves de API, termos e conexão do WhatsApp Copilot.
          </p>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="Seções de configuração">
          {TABS.map((item) => {
            const active = item.id === tab;
            return (
              <button
                key={item.id}
                type="button"
                className={[styles.tab, active ? styles.tabActive : ''].filter(Boolean).join(' ')}
                onClick={() => setTab(item.id)}
              >
                <strong>{item.label}</strong>
                <span>{item.desc}</span>
              </button>
            );
          })}
        </aside>

        <section className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <h3>{activeTab.label}</h3>
              <p>{activeTab.desc}</p>
            </div>
          </header>

          {tab === 'integracoes' && (
            <div className={styles.stack}>
              <p className={styles.helper}>
                Credenciais usadas pelas integrações do sistema. Salve cada chave individualmente.
              </p>
              {INTEGRATION_KEYS.map(renderField)}
            </div>
          )}

          {tab === 'whatsapp' && (
            <div className={styles.stack}>
              <article className={styles.fieldBlock}>
                <div className={styles.statusRow}>
                  <div className={styles.statusMeta}>
                    <strong>WhatsApp Copilot</strong>
                    <span>
                      Status:{' '}
                      {wa?.status === 'CONNECTED'
                        ? '🟢 Conectado'
                        : wa?.exists
                          ? `🔴 Desconectado${wa?.status && wa.status !== 'DISCONNECTED' ? ` (${wa.status})` : ''}`
                          : 'NÃO CONFIGURADO'}
                    </span>
                  </div>
                  <div className={styles.actions}>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={loadWa}
                      disabled={waBusy}
                    >
                      Atualizar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={connectWa}
                      disabled={waBusy}
                    >
                      Conectar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={disconnectWa}
                      disabled={waBusy}
                    >
                      Desconectar
                    </Button>
                  </div>
                </div>
                {qr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className={styles.qr}
                    src={qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`}
                    alt="QR Code WhatsApp"
                  />
                ) : null}
              </article>
            </div>
          )}

          {tab === 'privacidade' && (
            <div className={styles.stack}>
              <p className={styles.helper}>
                Texto exibido ao usuário nas Configurações da conta e no aceite de cadastro.
              </p>
              {renderField({
                key: 'TERMS_OF_USE_TEXT',
                label: 'Termos de Uso / LGPD',
                multiline: true,
              })}
            </div>
          )}
        </section>
      </div>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((c) => ({ ...c, visible: false }))}
      />
    </div>
  );
}
