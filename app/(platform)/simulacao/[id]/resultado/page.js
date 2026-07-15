'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Button from '@/components/atoms/Button/Button';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import { api } from '@/lib/api';
import { normalizeSimulation } from '@/lib/normalize';
import styles from './resultado.module.css';

const SKILLS = [
  { key: 'scoreDiagnostico', label: 'Diagnóstico', short: 'Diagnóstico' },
  { key: 'scoreArgumentacao', label: 'Argumentação', short: 'Argumentação' },
  { key: 'scoreObjeccoes', label: 'Contorno de Objeções', short: 'Objeções' },
  { key: 'scoreCrossSell', label: 'Cross-Selling', short: 'Cross-Sell' },
  { key: 'scoreFechamento', label: 'Fechamento', short: 'Fechamento' },
];

function formatScore(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.0';
  return num.toFixed(1);
}

function scoreLabel(score, max) {
  const pct = Number(score) / max;
  if (pct >= 0.8) return { text: 'Excelente', tone: 'Excellent' };
  if (pct >= 0.6) return { text: 'Bom', tone: 'Good' };
  if (pct >= 0.4) return { text: 'Regular', tone: 'Regular' };
  return { text: 'Precisa Melhorar', tone: 'Bad' };
}

function toneClass(tone) {
  if (tone === 'Excellent') return styles.verdictExcellent;
  if (tone === 'Good') return styles.verdictGood;
  if (tone === 'Regular') return styles.verdictRegular;
  return styles.verdictBad;
}

function buildFeedbackText(sim) {
  if (sim?.feedback && String(sim.feedback).trim()) {
    return String(sim.feedback).trim();
  }

  const parts = [];
  if (sim?.pontosFortes) parts.push(`**Pontos Fortes:**\n${sim.pontosFortes}`);
  if (sim?.oportunidadesMelhoria) {
    parts.push(`**Oportunidades de Melhoria:**\n${sim.oportunidadesMelhoria}`);
  }
  if (sim?.argumentosSugeridos) {
    parts.push(`**Argumentos que poderiam ter sido usados:**\n${sim.argumentosSugeridos}`);
  }

  return parts.join('\n\n') || 'Ainda não há feedback disponível para esta simulação.';
}

function FeedbackText({ text }) {
  const nodes = String(text || '')
    .split(/(\*\*[^*]+\*\*)/g)
    .map((chunk, index) => {
      if (chunk.startsWith('**') && chunk.endsWith('**')) {
        return <strong key={index}>{chunk.slice(2, -2)}</strong>;
      }
      return <span key={index}>{chunk}</span>;
    });

  return <p className={styles.feedbackProse}>{nodes}</p>;
}

function LightbulbIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.8c.5.4.9 1.1 1 1.8h5c.1-.7.5-1.4 1-1.8A6 6 0 0012 3z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.5 12a8.5 8.5 0 1114.5 6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M17 12h4.5V7.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 4.5h11.5L19.5 8v11.5H5V4.5z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M8 4.5v5h7v-5M8 19.5v-6h8v6" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
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

function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 8v4.5l2.5 1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 17.5V7.5A2.5 2.5 0 017.5 5h9A2.5 2.5 0 0119 7.5v6A2.5 2.5 0 0116.5 16H9l-4 3.5z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ScoreRing({ score, max = 50 }) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, Number(score) / max));
  const offset = circumference * (1 - pct);

  return (
    <div className={styles.ringWrap}>
      <svg className={styles.ringSvg} viewBox="0 0 140 140" aria-hidden="true">
        <circle className={styles.ringTrack} cx="70" cy="70" r={radius} />
        <circle
          className={styles.ringValue}
          cx="70"
          cy="70"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <strong className={styles.ringScore}>{formatScore(score)}</strong>
    </div>
  );
}

function CompetencyRadar({ values }) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 104;
  const levels = [0.25, 0.5, 0.75, 1];
  const angleStep = (Math.PI * 2) / values.length;
  const startAngle = -Math.PI / 2;

  const pointAt = (index, ratio) => {
    const angle = startAngle + index * angleStep;
    return {
      x: cx + Math.cos(angle) * maxR * ratio,
      y: cy + Math.sin(angle) * maxR * ratio,
    };
  };

  const polygonPoints = (ratio) =>
    values
      .map((_, index) => {
        const p = pointAt(index, ratio);
        return `${p.x},${p.y}`;
      })
      .join(' ');

  const dataPoints = values
    .map((item, index) => {
      const ratio = Math.max(0, Math.min(1, Number(item.value) / 10));
      const p = pointAt(index, ratio || 0.02);
      return `${p.x},${p.y}`;
    })
    .join(' ');

  return (
    <div className={styles.radarWrap}>
      <svg className={styles.radarSvg} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Radar de competências">
        <defs>
          <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F2F4F7" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#C9CED6" stopOpacity="0.12" />
          </linearGradient>
        </defs>

        {levels.map((level) => (
          <polygon
            key={level}
            points={polygonPoints(level)}
            fill="none"
            stroke="rgba(242,244,247,0.12)"
            strokeWidth="1"
          />
        ))}

        {values.map((_, index) => {
          const edge = pointAt(index, 1);
          return (
            <line
              key={`axis-${index}`}
              x1={cx}
              y1={cy}
              x2={edge.x}
              y2={edge.y}
              stroke="rgba(242,244,247,0.14)"
              strokeWidth="1"
            />
          );
        })}

        <polygon
          points={dataPoints}
          fill="url(#radarFill)"
          stroke="#F2F4F7"
          strokeWidth="2.2"
          style={{ filter: 'drop-shadow(0 0 12px rgba(242,244,247,0.25))' }}
        />

        {values.map((item, index) => {
          const ratio = Math.max(0, Math.min(1, Number(item.value) / 10));
          const p = pointAt(index, ratio || 0.02);
          const label = pointAt(index, 1.22);
          return (
            <g key={item.label}>
              <circle cx={p.x} cy={p.y} r="3.5" fill="#F2F4F7" />
              <text
                x={label.x}
                y={label.y}
                fill="rgba(255,255,255,0.72)"
                fontSize="11"
                fontWeight="600"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function ResultadoSimulacaoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const historyRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [simulation, setSimulation] = useState(null);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [animated, setAnimated] = useState(false);
  const [savingLearning, setSavingLearning] = useState(false);
  const [learningSaved, setLearningSaved] = useState(false);
  const [redoing, setRedoing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((current) => ({ ...current, visible: false })), 3500);
  };

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await api.get(`/simulations/${id}`);
        setSimulation(normalizeSimulation(res?.data || res));
      } catch (err) {
        setError(err.message || 'Não foi possível carregar o resultado.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!simulation) return;
    const timer = setTimeout(() => setAnimated(true), 40);
    return () => clearTimeout(timer);
  }, [simulation]);

  const skills = useMemo(() => {
    if (!simulation) return [];
    return SKILLS.map((item) => ({
      ...item,
      value: Number(simulation[item.key] || 0),
    }));
  }, [simulation]);

  const radarValues = useMemo(
    () =>
      skills.map((item) => ({
        label: item.short,
        value: item.value,
      })),
    [skills]
  );

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
        <p>Carregando resultado...</p>
      </div>
    );
  }

  if (error || !simulation) {
    return (
      <div className={styles.page}>
        <h1 className={styles.feedbackTitle}>Resultado</h1>
        <p className={styles.pointsLabel}>{error || 'Simulação não encontrada.'}</p>
        <Link href="/cenarios">
          <Button variant="secondary">Voltar aos cenários</Button>
        </Link>
      </div>
    );
  }

  const total = Number(simulation.scoreTotal || 0);
  const overall = scoreLabel(total, 50);
  const messages = Array.isArray(simulation.messages) ? simulation.messages : [];
  const userMessages = messages.filter((m) => m.role === 'user').length;
  const feedbackText = buildFeedbackText(simulation);
  const scenarioId = simulation.scenarioId || simulation.scenario?.id;

  const toggleConversation = () => {
    setShowHistory((current) => {
      const next = !current;
      if (next) {
        setTimeout(() => {
          historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 40);
      }
      return next;
    });
  };

  const sendToCopiloto = async () => {
    if (savingLearning || learningSaved) return;
    setSavingLearning(true);
    try {
      await api.post('/ai/simulation/extract-learning', {
        simulationId: id,
        evaluation: {
          scoreTotal: total,
          scoreDiagnostico: simulation.scoreDiagnostico,
          scoreArgumentacao: simulation.scoreArgumentacao,
          scoreObjeccoes: simulation.scoreObjeccoes,
          scoreCrossSell: simulation.scoreCrossSell,
          scoreFechamento: simulation.scoreFechamento,
          pontosFortes: simulation.pontosFortes,
          oportunidadesMelhoria: simulation.oportunidadesMelhoria,
          argumentosSugeridos: simulation.argumentosSugeridos,
        },
      });
      setLearningSaved(true);
      showToast('Aprendizado enviado para o Copiloto.');
    } catch (err) {
      showToast(err.message || 'Não foi possível enviar para o Copiloto.', 'error');
    } finally {
      setSavingLearning(false);
    }
  };

  const redoScenario = async () => {
    if (!scenarioId || redoing) return;
    setRedoing(true);
    try {
      const res = await api.post('/simulations', { scenarioId });
      const next = res?.data || res;
      if (!next?.id) throw new Error('Não foi possível criar nova simulação.');
      router.push(`/simulacao/${next.id}`);
    } catch (err) {
      showToast(err.message || 'Não foi possível refazer o cenário.', 'error');
      setRedoing(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => router.push('/cenarios')}
          aria-label="Voltar"
        >
          <BackIcon />
        </button>
        <div className={styles.topCopy}>
          <h1>Resultado</h1>
          <p>{simulation.scenarioTitle || 'Simulação concluída'}</p>
        </div>
      </div>

      <section className={styles.hero}>
        <ScoreRing score={animated ? total : 0} />
        <p className={`${styles.verdict} ${toneClass(overall.tone)}`}>{overall.text}</p>
        <p className={styles.pointsLabel}>de 50 pontos</p>
        <div className={styles.heroMeta}>
          <span>
            <ClockIcon />
            {Number(simulation.durationMinutes || 0)} min
          </span>
          <span>
            <ChatIcon />
            {userMessages} {userMessages === 1 ? 'mensagem' : 'mensagens'}
          </span>
        </div>
      </section>

      <div className={styles.split}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Competências</h2>
          <div className={styles.skillList}>
            {skills.map((skill) => {
              const label = scoreLabel(skill.value, 10);
              return (
                <div key={skill.key} className={styles.skillRow}>
                  <div className={styles.skillHead}>
                    <span className={styles.skillName}>{skill.label}</span>
                    <div className={styles.skillMeta}>
                      <span className={`${styles.skillLabel} ${toneClass(label.tone)}`}>
                        {label.text}
                      </span>
                      <span className={styles.skillScore}>{formatScore(skill.value)}/10</span>
                    </div>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{ width: animated ? `${Math.min(100, skill.value * 10)}%` : '0%' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Radar de Competências</h2>
          <CompetencyRadar values={radarValues} />
        </section>
      </div>

      <section className={styles.feedback}>
        <h2 className={styles.feedbackTitle}>Feedback do Gerente</h2>
        <FeedbackText text={feedbackText} />
      </section>

      <section className={styles.history} ref={historyRef}>
        <button
          type="button"
          className={styles.historyToggle}
          onClick={toggleConversation}
          aria-expanded={showHistory}
        >
          <div className={styles.historyLeft}>
            <h3>Histórico da Conversa</h3>
            <span className={styles.historyBadge}>{messages.length} mensagens</span>
          </div>
          <span aria-hidden="true">{showHistory ? '▴' : '▾'}</span>
        </button>

        {showHistory ? (
          <div className={styles.historyBody}>
            {messages.length === 0 ? (
              <p className={styles.pointsLabel}>Nenhuma mensagem registrada.</p>
            ) : (
              messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={`${msg.timestamp || index}-${index}`}
                    className={`${styles.msgRow} ${isUser ? styles.msgRowUser : ''}`}
                  >
                    <div
                      className={`${styles.msgAvatar} ${
                        isUser ? styles.msgAvatarUser : styles.msgAvatarClient
                      }`}
                    >
                      {isUser ? 'EU' : 'CL'}
                    </div>
                    <div
                      className={`${styles.msgBubble} ${
                        isUser ? styles.msgBubbleUser : styles.msgBubbleClient
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : null}
      </section>

      <div className={styles.actions}>
        <button type="button" className={`${styles.actionBtn} ${styles.actionSecondary}`} onClick={toggleConversation}>
          {showHistory ? 'Ocultar Conversa' : 'Ver Conversa Completa'}
        </button>

        <button
          type="button"
          className={`${styles.actionBtn} ${
            learningSaved ? styles.actionSuccess : styles.actionSecondary
          }`}
          onClick={sendToCopiloto}
          disabled={savingLearning || learningSaved}
        >
          <LightbulbIcon />
          {savingLearning ? 'Enviando...' : learningSaved ? 'Salvo no Copiloto' : 'Enviar para Copiloto'}
        </button>

        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionSecondary}`}
          onClick={redoScenario}
          disabled={!scenarioId || redoing}
        >
          <RedoIcon />
          {redoing ? 'Abrindo...' : 'Refazer Cenário'}
        </button>

        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionSecondary}`}
          onClick={() => {
            showToast('Simulação já salva no histórico.');
            router.push('/historico');
          }}
        >
          <SaveIcon />
          Salvar no Histórico
        </button>
      </div>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((current) => ({ ...current, visible: false }))}
      />
    </div>
  );
}
