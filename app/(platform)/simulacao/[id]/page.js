'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Badge from '@/components/atoms/Badge/Badge';
import Button from '@/components/atoms/Button/Button';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import { api } from '@/lib/api';
import { normalizeSimulation } from '@/lib/normalize';
import styles from './simulacao.module.css';

function difficultyVariant(difficulty) {
  if (difficulty === 'Iniciante') return 'success';
  if (difficulty === 'Intermediário') return 'warning';
  if (difficulty === 'Avançado') return 'danger';
  return 'default';
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 12h12M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FinishIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8.5 12.2l2.2 2.2 4.8-4.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function mapEvaluation(evaluation = {}) {
  return {
    scoreDiagnostico: Number(evaluation.score_diagnostico ?? evaluation.scoreDiagnostico ?? 0),
    scoreArgumentacao: Number(evaluation.score_argumentacao ?? evaluation.scoreArgumentacao ?? 0),
    scoreObjeccoes: Number(evaluation.score_objeccoes ?? evaluation.scoreObjeccoes ?? 0),
    scoreCrossSell: Number(evaluation.score_cross_sell ?? evaluation.scoreCrossSell ?? 0),
    scoreFechamento: Number(evaluation.score_fechamento ?? evaluation.scoreFechamento ?? 0),
    scoreTotal: Number(evaluation.score_total ?? evaluation.scoreTotal ?? 0),
    pontosFortes: evaluation.pontos_fortes || evaluation.pontosFortes || '',
    oportunidadesMelhoria:
      evaluation.oportunidades_melhoria || evaluation.oportunidadesMelhoria || '',
    argumentosSugeridos: evaluation.argumentos_sugeridos || evaluation.argumentosSugeridos || '',
    feedback: evaluation.feedback || '',
  };
}

export default function SimulacaoChatPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const messagesEndRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const textareaRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [simulation, setSimulation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((current) => ({ ...current, visible: false })), 3500);
  };

  const scenario = simulation?.scenario || null;
  const userMsgCount = messages.filter((m) => m.role === 'user').length;

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await api.get(`/simulations/${id}`);
        const data = normalizeSimulation(res?.data || res);
        if (!data?.id) throw new Error('Simulação não encontrada.');
        if (data.status === 'completed') {
          router.replace(`/simulacao/${id}/resultado`);
          return;
        }
        setSimulation(data);
        setMessages(Array.isArray(data.messages) ? data.messages : []);
        startTimeRef.current = Date.now();
      } catch (err) {
        setError(err.message || 'Não foi possível carregar a simulação.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const completeWithEvaluation = async (currentMessages) => {
    setFinishing(true);
    try {
      const durationMinutes = Math.max(
        1,
        Math.round((Date.now() - startTimeRef.current) / 60000)
      );
      const evalRes = await api.post('/ai/simulation/evaluate', {
        simulationId: id,
        durationMinutes,
      });
      const evaluation = mapEvaluation(evalRes?.data || evalRes || {});
      const feedback =
        evaluation.feedback ||
        [
          evaluation.pontosFortes ? `**Pontos fortes:**\n${evaluation.pontosFortes}` : '',
          evaluation.oportunidadesMelhoria
            ? `**Oportunidades:**\n${evaluation.oportunidadesMelhoria}`
            : '',
          evaluation.argumentosSugeridos
            ? `**Argumentos sugeridos:**\n${evaluation.argumentosSugeridos}`
            : '',
        ]
          .filter(Boolean)
          .join('\n\n');

      await api.put(`/simulations/${id}`, {
        status: 'completed',
        messages: currentMessages,
        durationMinutes,
        ...evaluation,
        feedback,
      });

      router.push(`/simulacao/${id}/resultado`);
    } catch (err) {
      showToast(err.message || 'Não foi possível finalizar a avaliação.', 'error');
      setFinishing(false);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending || finishing) return;

    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    const optimistic = [...messages, userMsg];
    setMessages(optimistic);
    setInput('');
    setSending(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
    }

    try {
      const res = await api.post('/ai/simulation/chat', {
        simulationId: id,
        userMessage: text,
      });
      const payload = res?.data || res || {};
      const clientText = payload.message || '';
      const nextMessages = [
        ...optimistic,
        {
          role: 'client',
          content: clientText,
          timestamp: new Date().toISOString(),
        },
      ];
      setMessages(nextMessages);

      if (payload.terminated) {
        await completeWithEvaluation(nextMessages);
      }
    } catch (err) {
      setMessages(messages);
      showToast(err.message || 'Falha ao enviar mensagem.', 'error');
    } finally {
      setSending(false);
    }
  };

  const onInputChange = (e) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = '48px';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !simulation) {
    return (
      <div className={styles.errorBox}>
        <h1>Simulação</h1>
        <p>{error || 'Simulação não encontrada.'}</p>
        <Link href="/cenarios">
          <Button variant="secondary">Voltar aos cenários</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className={`${styles.page} ${finishing ? styles.pageDimmed : ''}`}>
        <header className={styles.header}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => router.push('/cenarios')}
            aria-label="Voltar aos cenários"
            disabled={finishing}
          >
            <BackIcon />
          </button>

          <div className={styles.headerCopy}>
            <h1>{simulation.scenarioTitle || scenario?.title || 'Atendimento'}</h1>
            <div className={styles.meta}>
              <span>
                {(scenario?.clientName || 'Cliente')}
                {scenario?.clientAge ? `, ${scenario.clientAge} anos` : ''}
              </span>
              <span>·</span>
              <span>{userMsgCount} {userMsgCount === 1 ? 'msg' : 'msgs'}</span>
              {scenario?.difficulty ? (
                <>
                  <span>·</span>
                  <Badge size="sm" variant={difficultyVariant(scenario.difficulty)}>
                    {scenario.difficulty}
                  </Badge>
                </>
              ) : null}
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.finishBtn}
              disabled={finishing || sending || userMsgCount < 2}
              onClick={() => completeWithEvaluation(messages)}
            >
              <FinishIcon />
              Finalizar
            </button>
          </div>
        </header>

        {(scenario?.userObjective || simulation.scenarioCategory) ? (
          <div className={styles.brief}>
            <p className={styles.briefLabel}>
              {scenario?.userObjective ? 'Seu objetivo' : 'Categoria'}
            </p>
            <p className={styles.briefText}>
              {scenario?.userObjective || simulation.scenarioCategory}
            </p>
          </div>
        ) : null}

        <div className={styles.messages}>
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={`${msg.timestamp || index}-${index}`}
                className={`${styles.row} ${isUser ? styles.rowUser : ''}`}
              >
                <div
                  className={`${styles.avatar} ${
                    isUser ? styles.avatarUser : styles.avatarClient
                  }`}
                >
                  {isUser ? 'EU' : 'CL'}
                </div>
                <div
                  className={`${styles.bubble} ${
                    isUser ? styles.bubbleUser : styles.bubbleClient
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}

          {sending ? (
            <div className={styles.row}>
              <div className={`${styles.avatar} ${styles.avatarClient}`}>CL</div>
              <div className={`${styles.bubble} ${styles.bubbleClient}`}>
                <div className={styles.typing} aria-label="Cliente digitando">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          ) : null}

          <div ref={messagesEndRef} />
        </div>

        <div className={styles.composer}>
          <textarea
            ref={textareaRef}
            className={styles.input}
            value={input}
            onChange={onInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Responda como bancário..."
            disabled={sending || finishing}
            rows={1}
          />
          <button
            type="button"
            className={styles.sendBtn}
            onClick={sendMessage}
            disabled={!input.trim() || sending || finishing}
            aria-label="Enviar mensagem"
          >
            <SendIcon />
          </button>
        </div>
      </div>

      {finishing ? (
        <div className={styles.evaluatingOverlay} role="status" aria-live="polite">
          <div className={styles.evaluatingCard}>
            <Spinner size="lg" />
            <strong>Avaliando seu atendimento...</strong>
            <span>O mentor IA está revisando a conversa por rubrica.</span>
          </div>
        </div>
      ) : null}

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((current) => ({ ...current, visible: false }))}
      />
    </>
  );
}
