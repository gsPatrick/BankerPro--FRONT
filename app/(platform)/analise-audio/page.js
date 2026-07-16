'use client';

import { useEffect, useRef, useState } from 'react';
import Button from '@/components/atoms/Button/Button';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import Modal from '@/components/organisms/Modal/Modal';
import { api, uploadAudioAnalysis } from '@/lib/api';
import { pickField } from '@/lib/normalize';
import styles from './analise-audio.module.css';

function normalizeAnalysis(raw = {}) {
  const score = pickField(raw, 'score');
  return {
    id: pickField(raw, 'id'),
    title: pickField(raw, 'title') || 'Negociação sem título',
    analysis: pickField(raw, 'analysis') || '',
    transcription: pickField(raw, 'transcription') || '',
    score: score === null || score === undefined ? null : Number(score),
    durationSeconds: Number(pickField(raw, 'durationSeconds', 'duration_seconds') ?? 0),
    source: pickField(raw, 'source') || 'painel',
    createdAt: pickField(raw, 'createdAt', 'created_at', 'created_date'),
  };
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(seconds) {
  if (!seconds) return '';
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${String(sec).padStart(2, '0')}`;
}

function scoreTone(score) {
  if (score === null) return '';
  if (score <= 3) return styles.scoreLow;
  if (score <= 6) return styles.scoreMid;
  return styles.scoreHigh;
}

export default function AnaliseAudioPage() {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [items, setItems] = useState([]);
  const [detail, setDetail] = useState(null);
  const [showTranscription, setShowTranscription] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((c) => ({ ...c, visible: false })), 5000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audio-analysis');
      const list = res?.data || res || [];
      setItems((Array.isArray(list) ? list : []).map(normalizeAnalysis));
    } catch (err) {
      // Bloqueio por plano já abre o modal de upgrade sozinho.
      if (err.code !== 'PLAN_FEATURE_DENIED') {
        showToast(err.message || 'Erro ao carregar o histórico.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const enviar = async (file, durationSeconds) => {
    setAnalyzing(true);
    try {
      await uploadAudioAnalysis(file, { durationSeconds });
      showToast('Análise concluída! Confira o feedback abaixo.');
      await load();
    } catch (err) {
      if (err.code !== 'PLAN_FEATURE_DENIED') {
        showToast(err.message || 'Não foi possível analisar o áudio.', 'error');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const onPickFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) enviar(file, null);
  };

  const startRecording = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      showToast('Seu navegador não permite gravar áudio. Envie um arquivo.', 'error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        // Solta o microfone: sem isto o indicador de gravação fica aceso.
        stream.getTracks().forEach((track) => track.stop());
        const duration = (Date.now() - startedAtRef.current) / 1000;
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `negociacao-${Date.now()}.webm`, { type: 'audio/webm' });
        enviar(file, duration);
      };

      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      recorder.start();
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 1000);
    } catch {
      showToast('Não foi possível acessar o microfone. Autorize o acesso e tente de novo.', 'error');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stop();
    setRecording(false);
  };

  const remover = async (id) => {
    try {
      await api.delete(`/audio-analysis/${id}`);
      setDetail(null);
      showToast('Análise removida.');
      await load();
    } catch (err) {
      showToast(err.message || 'Erro ao remover.', 'error');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.banner}>
        <p className={styles.eyebrow}>Treinamento</p>
        <h1 className={styles.title}>Análise de negociação por áudio</h1>
        <p className={styles.subtitle}>
          Grave ou envie o áudio de um atendimento real e receba o feedback de um
          treinador comercial: o que foi bem, onde travou e o que fazer na próxima.
        </p>

        <div className={styles.actions}>
          {recording ? (
            <Button type="button" variant="primary" onClick={stopRecording}>
              ⏹ Parar e analisar ({formatDuration(elapsed)})
            </Button>
          ) : (
            <Button type="button" variant="primary" onClick={startRecording} disabled={analyzing}>
              🎙 Gravar negociação
            </Button>
          )}

          <Button
            type="button"
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            disabled={analyzing || recording}
          >
            Enviar arquivo de áudio
          </Button>

          <input
            ref={inputRef}
            type="file"
            accept="audio/*,.mp3,.m4a,.ogg,.opus,.wav,.webm"
            hidden
            onChange={onPickFile}
          />
        </div>

        <p className={styles.hint}>
          Também funciona pelo WhatsApp: mande o áudio da negociação e a análise volta no chat.
        </p>
      </div>

      {analyzing ? (
        <div className={styles.analyzing}>
          <Spinner size="md" />
          <div>
            <strong>Ouvindo a negociação…</strong>
            <p>Estamos transcrevendo o áudio e analisando a conversa. Leva alguns instantes.</p>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className={styles.loading}>
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <p className={styles.empty}>
          Nenhuma negociação analisada ainda. Grave ou envie um áudio para começar.
        </p>
      ) : (
        <div className={styles.list}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.card}
              onClick={() => {
                setDetail(item);
                setShowTranscription(false);
              }}
            >
              <div className={styles.cardTop}>
                {item.score !== null ? (
                  <span className={`${styles.score} ${scoreTone(item.score)}`}>{item.score}</span>
                ) : (
                  <span className={styles.score}>—</span>
                )}
                <div className={styles.cardMeta}>
                  <strong>{item.title}</strong>
                  <span>
                    {formatDate(item.createdAt)}
                    {item.durationSeconds ? ` · ${formatDuration(item.durationSeconds)}` : ''}
                    {item.source === 'whatsapp' ? ' · WhatsApp' : ''}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal
        isOpen={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.title || 'Análise da negociação'}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => remover(detail.id)}>
              Excluir
            </Button>
            <Button type="button" variant="primary" onClick={() => setDetail(null)}>
              Fechar
            </Button>
          </>
        }
      >
        {detail ? (
          <div className={styles.detail}>
            <pre className={styles.analysisText}>{detail.analysis}</pre>

            <button
              type="button"
              className={styles.toggle}
              onClick={() => setShowTranscription((v) => !v)}
            >
              {showTranscription ? 'Ocultar transcrição' : 'Ver transcrição do áudio'}
            </button>

            {showTranscription ? (
              <pre className={styles.transcriptionText}>{detail.transcription}</pre>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Toast
        type={toast.type}
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast((c) => ({ ...c, visible: false }))}
      />
    </div>
  );
}
