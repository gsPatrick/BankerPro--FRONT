'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/atoms/Button/Button';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import { api } from '@/lib/api';
import { pickField } from '@/lib/normalize';
import styles from './conectar-whatsapp.module.css';

function formatarNumero(numero) {
  if (!numero) return '';
  const d = String(numero).replace(/\D/g, '');
  // 55 11 99999 8888 -> +55 (11) 99999-8888
  const m = d.match(/^(\d{2})(\d{2})(\d{4,5})(\d{4})$/);
  if (!m) return numero;
  return `+${m[1]} (${m[2]}) ${m[3]}-${m[4]}`;
}

function WhatsappLogo() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm-4.53 6.07c.21 0 .39 0 .6.01.19.01.4-.06.66.5.25.59.84 2.04.91 2.19.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.18-.31.4-.45.53-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.36 1.46.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.3.4-.25.66-.15.27.1 1.71.81 2.01.96.3.15.5.22.57.35.07.12.07.72-.18 1.42-.25.7-1.49 1.42-2.06 1.47-.57.05-1.1.25-3.7-.77-3.13-1.23-5.16-4.37-5.32-4.58-.16-.21-1.29-1.71-1.29-3.26s.81-2.32 1.1-2.63c.29-.32.63-.4.84-.4z" />
    </svg>
  );
}

function WhatsappLogoSmall() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm-4.53 6.07c.21 0 .39 0 .6.01.19.01.4-.06.66.5.25.59.84 2.04.91 2.19.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.18-.31.4-.45.53-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.36 1.46.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.3.4-.25.66-.15.27.1 1.71.81 2.01.96.3.15.5.22.57.35.07.12.07.72-.18 1.42-.25.7-1.49 1.42-2.06 1.47-.57.05-1.1.25-3.7-.77-3.13-1.23-5.16-4.37-5.32-4.58-.16-.21-1.29-1.71-1.29-3.26s.81-2.32 1.1-2.63c.29-.32.63-.4.84-.4z" />
    </svg>
  );
}

export default function ConectarWhatsappPage() {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null);
  const [step, setStep] = useState(1);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((c) => ({ ...c, visible: false })), 5000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/whatsapp/link-info');
      const data = res?.data || res || {};
      setInfo({
        copilotNumber: pickField(data, 'copilotNumber', 'copilot_number'),
        linkedWhatsapp: pickField(data, 'linkedWhatsapp', 'linked_whatsapp'),
        hasCopilot: Boolean(pickField(data, 'hasCopilot', 'has_copilot')),
        hasAudio: Boolean(pickField(data, 'hasAudio', 'has_audio')),
      });
    } catch (err) {
      showToast(err.message || 'Erro ao carregar as informações de conexão.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const verificar = async () => {
    const limpo = code.replace(/\D/g, '');
    if (limpo.length !== 6) {
      showToast('Digite o código de 6 dígitos que você recebeu no WhatsApp.', 'error');
      return;
    }
    setVerifying(true);
    try {
      await api.post('/whatsapp/verify-code', { code: limpo });
      showToast('WhatsApp conectado com sucesso!');
      setCode('');
      await load();
    } catch (err) {
      showToast(err.message || 'Não foi possível verificar o código.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner />
      </div>
    );
  }

  const conectado = Boolean(info?.linkedWhatsapp);
  const numero = info?.copilotNumber;
  const numeroLimpo = numero ? String(numero).replace(/\D/g, '') : '';
  const waLink = numeroLimpo
    ? `https://wa.me/${numeroLimpo}?text=${encodeURIComponent('Quero conectar meu WhatsApp ao Closer.IA')}`
    : null;

  return (
    <div className={styles.page}>
      <div className={styles.banner}>
        <p className={styles.eyebrow}>WhatsApp</p>
        <h1 className={styles.title}>Conectar seu WhatsApp</h1>
        <p className={styles.subtitle}>
          Vincule o seu número para usar o Copiloto e a Análise de Áudio direto do
          celular. O número é capturado automaticamente do WhatsApp — você não
          precisa digitá-lo.
        </p>
      </div>

      {conectado ? (
        <div className={styles.card}>
          <div className={styles.centerLogo}>
            <WhatsappLogo />
          </div>
          <div className={styles.statusOk}>
            <span className={styles.dot} /> Conectado
          </div>
          <p className={styles.connectedNumber}>{formatarNumero(info.linkedWhatsapp)}</p>
          <ul className={styles.features}>
            <li className={info.hasCopilot ? styles.on : styles.off}>
              {info.hasCopilot ? '✓' : '✕'} Copiloto no WhatsApp
              {!info.hasCopilot ? <span className={styles.hintInline}> — não incluído no seu plano</span> : null}
            </li>
            <li className={info.hasAudio ? styles.on : styles.off}>
              {info.hasAudio ? '✓' : '✕'} Análise de Áudio
              {!info.hasAudio ? <span className={styles.hintInline}> — não incluída no seu plano</span> : null}
            </li>
          </ul>
          <Button type="button" variant="secondary" onClick={load}>
            Atualizar
          </Button>
        </div>
      ) : !numero ? (
        <div className={styles.card}>
          <p className={styles.warn}>
            O número do Copiloto ainda não foi configurado pelo administrador. Peça
            para configurá-lo em Configurações → Integrações.
          </p>
        </div>
      ) : (
        <div className={styles.card}>
          {/* Indicador dos dois passos */}
          <div className={styles.stepper}>
            <span className={`${styles.stepDot} ${step >= 1 ? styles.stepActive : ''}`}>1</span>
            <span className={styles.stepLine} />
            <span className={`${styles.stepDot} ${step >= 2 ? styles.stepActive : ''}`}>2</span>
          </div>

          {step === 1 ? (
            <div className={styles.stepBody}>
              <div className={styles.centerLogo}>
                <WhatsappLogo />
              </div>
              <h2 className={styles.stepTitle}>Passo 1 — Mande uma mensagem</h2>
              <p className={styles.stepText}>
                Para vincular seu número, mande qualquer mensagem no WhatsApp para o
                número do Closer.IA abaixo. Você vai receber um código na hora.
              </p>
              <div className={styles.numberBox}>{formatarNumero(numero)}</div>

              <div className={styles.stepActions}>
                <a href={waLink} target="_blank" rel="noopener noreferrer" className={styles.waButton}>
                  <WhatsappLogoSmall /> Abrir o WhatsApp
                </a>
                <Button type="button" variant="primary" onClick={() => setStep(2)}>
                  Já enviei, avançar →
                </Button>
              </div>
            </div>
          ) : (
            <div className={styles.stepBody}>
              <h2 className={styles.stepTitle}>Passo 2 — Digite o código</h2>
              <p className={styles.stepText}>
                Digite abaixo o <strong>código de 6 dígitos</strong> que você recebeu
                no WhatsApp.
              </p>

              <input
                className={styles.codeInput}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                maxLength={6}
                autoFocus
              />

              <div className={styles.stepActions}>
                <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                  ← Voltar
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={verificar}
                  loading={verifying}
                  disabled={code.length !== 6}
                >
                  Conectar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Toast
        type={toast.type}
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast((c) => ({ ...c, visible: false }))}
      />
    </div>
  );
}
