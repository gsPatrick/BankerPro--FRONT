'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '@/components/atoms/Button/Button';
import Badge from '@/components/atoms/Badge/Badge';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import { api } from '@/lib/api';
import styles from './configuracoes.module.css';

const TABS = [
  { id: 'dispositivos', label: 'Dispositivos', desc: 'Acessos recentes' },
  { id: 'privacidade', label: 'Privacidade', desc: 'Termos e LGPD' },
];

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DeviceIcon({ os, browser }) {
  const key = `${os || ''} ${browser || ''}`.toLowerCase();

  if (/macos|mac os|macintosh|ios|iphone|ipad/.test(key)) {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor">
        <path d="M16.2 2.1c.1 1.2-.3 2.3-1 3.2-.8 1-2 1.7-3.2 1.6-.1-1.1.4-2.3 1.1-3.1.8-1 2.2-1.7 3.1-1.7zM19.6 17.3c-.5 1.1-.8 1.6-1.4 2.6-.9 1.3-2.1 3-3.7 3-.9 0-1.5-.7-2.9-.7-1.3 0-2 .7-2.9.7-1.5 0-2.7-1.5-3.6-2.8-1.8-2.7-3.2-7.6-1.3-10.9.9-1.7 2.5-2.7 4.2-2.7 1.2 0 2.3.8 2.9.8.7 0 1.9-.9 3.3-.8.6 0 2.1.2 3.1 1.7-.1.1-1.9 1.1-1.8 3.4.1 2.7 2.4 3.6 2.4 3.6l-.3.1z" />
      </svg>
    );
  }

  if (/windows/.test(key)) {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor">
        <path d="M3 5.2 11 4v7.5H3V5.2zm0 13.6L11 20v-7.3H3v6.1zM12.2 3.9 21 2.7v8.8h-8.8V3.9zm0 17.2L21 22.3v-9.1h-8.8v8z" />
      </svg>
    );
  }

  if (/android/.test(key)) {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor">
        <path d="M17.6 9.5 19.3 6.4a.6.6 0 0 0-.2-.8.6.6 0 0 0-.8.2l-1.7 3c-1.4-.6-3-.9-4.6-.9s-3.2.3-4.6.9L5.7 5.8a.6.6 0 0 0-.8-.2.6.6 0 0 0-.2.8l1.7 3.1C4.2 10.9 3 12.8 3 15v.5h18V15c0-2.2-1.2-4.1-3.4-5.5zM8.3 13a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8zm7.4 0a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8zM5 16.5h14v2.2c0 .8-.6 1.4-1.4 1.4h-.8V22H14v-1.9H10V22H7.2v-1.9h-.8c-.8 0-1.4-.6-1.4-1.4v-2.2z" />
      </svg>
    );
  }

  if (/linux/.test(key)) {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor">
        <path d="M12.5 2.2c1.2 0 2.1 1.4 1.7 2.9-.2.7-.7 1.3-1.3 1.5.9.3 1.7 1.1 2.1 2.2.5 1.4.2 3-.8 4.1l.8 1.4c.8 1.4 1.1 3 .8 4.5-.3 1.5-1.3 2.8-2.7 3.5.4.5.6 1.1.6 1.8 0 1.1-.7 2.1-1.8 2.4-.3.1-.6.1-.9.1-.8 0-1.5-.4-1.9-1-.4.6-1.1 1-1.9 1-.3 0-.6 0-.9-.1-1.1-.3-1.8-1.3-1.8-2.4 0-.7.2-1.3.6-1.8-1.4-.7-2.4-2-2.7-3.5-.3-1.5 0-3.1.8-4.5l.8-1.4c-1-1.1-1.3-2.7-.8-4.1.4-1.1 1.2-1.9 2.1-2.2-.6-.2-1.1-.8-1.3-1.5C5.4 3.6 6.3 2.2 7.5 2.2c.8 0 1.5.5 1.9 1.3.4-.8 1.1-1.3 1.9-1.3.4 0 .8.1 1.2.3.4-.2.8-.3 1.2-.3z" />
      </svg>
    );
  }

  if (/chrome/.test(key)) {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor">
        <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2zm0 4.5a5.5 5.5 0 0 1 4.7 2.7H12A2.8 2.8 0 0 0 9.2 12c0 .4.1.8.2 1.1L7 7.9A5.5 5.5 0 0 1 12 6.5zm-5.7 9.2L8.5 12A2.8 2.8 0 0 0 12 14.8c.7 0 1.3-.2 1.8-.6l2.3 4A5.5 5.5 0 0 1 6.3 15.7zm11.4-.2-2.2-3.9c.3-.5.5-1 .5-1.6 0-.4-.1-.8-.2-1.1h4.3a5.5 5.5 0 0 1-2.4 6.6z" />
      </svg>
    );
  }

  if (/firefox/.test(key)) {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor">
        <path d="M12 2c1.8 0 3.4.9 4.7 2.1.2-.6.2-1.4 0-2.2C19 3.4 21 6.1 21.4 9c.5 3.2-.7 6.4-3.1 8.5A9.9 9.9 0 0 1 12 22 10 10 0 0 1 2.2 9.7C3.1 5.5 6.8 2.4 11 2.1c.1 1 .5 1.8 1.1 2.4-.1-.6 0-1.3.3-1.9.3-.4.4-.5.6-.6z" />
      </svg>
    );
  }

  if (/safari/.test(key)) {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor">
        <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2zm4.7 5.3-1.8 5.5-5.5 1.8 1.8-5.5 5.5-1.8zM12 10.4a1.6 1.6 0 1 0 .001 3.201A1.6 1.6 0 0 0 12 10.4z" />
      </svg>
    );
  }

  if (/edge/.test(key)) {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor">
        <path d="M3.2 12.4C4 7.9 7.6 4.4 12.2 4.1c4.2-.3 8 2.4 9.2 6.3-1.5-1.9-3.8-3.1-6.4-3.1-1.5 0-2.9.4-4.1 1.1 2.5-.2 5.1.7 6.9 2.6 1.7 1.8 2.4 4.3 2 6.7-1.7 3.4-5.4 5.4-9.2 4.9C6.2 22 3 18.2 3 13.8c0-.5.1-.9.2-1.4z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState('dispositivos');
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [termsLoading, setTermsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [termsText, setTermsText] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((current) => ({ ...current, visible: false })), 3500);
  };

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      await api.post('/settings/sessions/ping', {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      }).catch(() => null);

      const response = await api.get('/settings/sessions');
      setSessions(response?.data || response || []);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const loadTerms = useCallback(async () => {
    setTermsLoading(true);
    try {
      const response = await api.get('/auth/terms');
      const data = response?.data || response || {};
      setTermsText(data.terms || data.text || '');
    } catch {
      setTermsText('Não foi possível carregar os termos de uso no momento.');
    } finally {
      setTermsLoading(false);
    }
  }, []);

  useEffect(() => {
    const boot = async () => {
      try {
        const meRes = await api.get('/auth/me').catch(() => null);
        const me = meRes?.data || meRes;
        if (me) setUser(me);
        await Promise.all([loadSessions(), loadTerms()]);
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, [loadSessions, loadTerms]);

  const handleRevoke = async (sessionId) => {
    try {
      await api.delete(`/settings/sessions/${sessionId}`);
      showToast('Sessão encerrada.');
      await loadSessions();
    } catch (err) {
      showToast(err.message || 'Não foi possível encerrar a sessão.', 'error');
    }
  };

  const activeTab = useMemo(
    () => TABS.find((item) => item.id === tab) || TABS[0],
    [tab]
  );

  const acceptedAt = user?.acceptedTermsAt
    ? formatDateTime(user.acceptedTermsAt)
    : null;

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Conta</p>
          <h2 className={styles.title}>Configurações</h2>
          <p className={styles.subtitle}>
            Dispositivos com acesso e documentos de privacidade.
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

          {tab === 'dispositivos' && (
            <div className={styles.stack}>
              <div className={styles.devicesHead}>
                <p className={styles.helper}>
                  Últimos acessos detectados nesta conta. O dispositivo atual aparece marcado.
                </p>
                <Button variant="ghost" size="sm" onClick={loadSessions} disabled={sessionsLoading}>
                  Atualizar
                </Button>
              </div>

              {sessionsLoading ? (
                <div className={styles.inlineLoading}><Spinner /></div>
              ) : sessions.length === 0 ? (
                <div className={styles.empty}>
                  Nenhum dispositivo registrado ainda. Faça login novamente para começar o histórico.
                </div>
              ) : (
                <ul className={styles.deviceList}>
                  {sessions.map((session) => (
                    <li key={session.id} className={styles.deviceItem}>
                      <div className={styles.deviceIcon}>
                        <DeviceIcon os={session.os} browser={session.browser} />
                      </div>
                      <div className={styles.deviceMeta}>
                        <div className={styles.deviceTitleRow}>
                          <strong>{session.deviceLabel || `${session.browser} · ${session.os}`}</strong>
                          {session.isCurrent && <Badge variant="success" size="sm">Atual</Badge>}
                        </div>
                        <span>
                          {session.browser} · {session.os} · {session.deviceType || 'desktop'}
                        </span>
                        <span>
                          Último acesso: {formatDateTime(session.lastSeenAt || session.last_seen_at)}
                          {session.ipAddress ? ` · IP ${session.ipAddress}` : ''}
                        </span>
                      </div>
                      {!session.isCurrent && (
                        <Button variant="ghost" size="sm" onClick={() => handleRevoke(session.id)}>
                          Encerrar
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === 'privacidade' && (
            <div className={styles.stack}>
              <div className={styles.cardBlock}>
                <div className={styles.deviceTitleRow}>
                  <h4>Aceite dos termos</h4>
                  <Badge variant="success" size="sm">Aceito</Badge>
                </div>
                <p>
                  {acceptedAt
                    ? `Você aceitou os Termos de Uso e a Política de Privacidade (LGPD) em ${acceptedAt}.`
                    : 'Os Termos de Uso e a Política de Privacidade (LGPD) foram aceitos no momento do cadastro da conta.'}
                </p>
              </div>

              <div className={styles.termsBox}>
                <h4>Termos de Uso e Política de Privacidade (LGPD)</h4>
                {termsLoading ? (
                  <div className={styles.inlineLoading}><Spinner /></div>
                ) : (
                  <div className={styles.termsBody}>
                    {String(termsText || '')
                      .split('\n')
                      .filter((line) => line.trim().length > 0)
                      .map((line, index) => (
                        <p key={`${index}-${line.slice(0, 12)}`}>{line}</p>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {toast.visible && (
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((current) => ({ ...current, visible: false }))}
        />
      )}
    </div>
  );
}
