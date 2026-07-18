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

export default function ConectarWhatsappPage() {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null);
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
      ) : (
        <div className={styles.card}>
          <h2 className={styles.stepsTitle}>Como conectar</h2>

          {numero ? (
            <ol className={styles.steps}>
              <li>
                Mande qualquer mensagem no WhatsApp para o número do BankerPro:
                <div className={styles.numberBox}>{formatarNumero(numero)}</div>
              </li>
              <li>Você vai receber um <strong>código de 6 dígitos</strong> na hora.</li>
              <li>Digite o código aqui embaixo e clique em Conectar.</li>
            </ol>
          ) : (
            <p className={styles.warn}>
              O número do Copiloto ainda não foi configurado pelo administrador.
              Peça para configurá-lo em Configurações → Integrações.
            </p>
          )}

          <div className={styles.codeRow}>
            <input
              className={styles.codeInput}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
              disabled={!numero}
            />
            <Button
              type="button"
              variant="primary"
              onClick={verificar}
              loading={verifying}
              disabled={!numero || code.length !== 6}
            >
              Conectar
            </Button>
          </div>
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
