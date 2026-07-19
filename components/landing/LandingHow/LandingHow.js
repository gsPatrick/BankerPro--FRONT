'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './LandingHow.module.css';

const STEPS = [
  {
    id: 'treine',
    number: '01',
    title: 'Treine com cliente de IA',
    body: 'Entre em cenários reais de agência: objeções, perfil e pressão de tempo. A IA responde como cliente e avalia sua condução.',
    chips: ['Cenários', 'Simulação ao vivo', 'Feedback'],
    preview: 'sim',
  },
  {
    id: 'aborde',
    number: '02',
    title: 'Aborde com roteiro pronto',
    body: 'Copiloto e Scripts entregam abertura, diagnóstico, respostas a objeções e fechamento — no canal certo.',
    chips: ['Copiloto IA', 'Scripts', 'WhatsApp', 'Análise de Áudio'],
    preview: 'opp',
  },
  {
    id: 'feche',
    number: '03',
    title: 'Acompanhe e feche a carteira',
    body: 'Painel, agenda e metas mostram o que está andando. Você vê perfil, produto e retorno — e prioriza o próximo fechamento.',
    chips: ['Painel', 'Metas', 'Agenda'],
    preview: 'dash',
  },
];

function PreviewSim() {
  return (
    <div className={`${styles.preview} ${styles.previewSim}`}>
      <div className={styles.previewTop}>
        <span className={styles.dotLive} />
        Simulação · Capitalização
      </div>
      <div className={styles.bubbleBot}>
        Não tenho dinheiro sobrando esse mês…
      </div>
      <div className={styles.bubbleUser}>
        Por isso a ideia é começar leve. Posso te mostrar uma opção simples?
      </div>
      <div className={styles.scoreRow}>
        <span>Condução</span>
        <strong>8.4</strong>
      </div>
    </div>
  );
}

function PreviewOpp() {
  return (
    <div className={`${styles.preview} ${styles.previewOpp}`}>
      <p className={styles.previewEyebrow}>Oportunidade</p>
      <p className={styles.previewTitle}>Cliente jovem · pouco relacionamento</p>
      <p className={styles.previewMeta}>Capitalização · WhatsApp · Ativo</p>
      <div className={styles.scriptLine}>
        “Oi, [nome] — dá para organizar um valor pequeno por mês sem pesar?”
      </div>
    </div>
  );
}

function PreviewDash() {
  return (
    <div className={`${styles.preview} ${styles.previewDash}`}>
      <div className={styles.dashRow}>
        <div>
          <span>Meta geral</span>
          <strong>72%</strong>
        </div>
        <div>
          <span>Agenda</span>
          <strong>12</strong>
        </div>
      </div>
      <div className={styles.dashBar}>
        <i style={{ width: '72%' }} />
      </div>
      <p className={styles.previewMeta}>36 de 50 · Capitalização no topo</p>
    </div>
  );
}

function Preview({ type }) {
  if (type === 'opp') return <PreviewOpp />;
  if (type === 'dash') return <PreviewDash />;
  return <PreviewSim />;
}

export default function LandingHow() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef([]);

  useEffect(() => {
    const nodes = stepRefs.current.filter(Boolean);
    if (!nodes.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = Number(entry.target.getAttribute('data-index'));
          if (Number.isFinite(index)) setActive(index);
        });
      },
      { rootMargin: '-35% 0px -45% 0px', threshold: 0.15 }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.section} id="como-funciona">
      <div className={styles.layout}>
        <aside className={styles.sticky}>
          <p className={styles.eyebrow}>Como funciona</p>
          <h2 className={styles.title}>
            Três movimentos.
            <br />
            Um fechamento melhor.
          </h2>
          <p className={styles.lede}>
            Do treino à carteira: o Closer.IA acompanha o bancário no ritmo real da agência.
          </p>
          <ol className={styles.indexList} aria-label="Etapas">
            {STEPS.map((step, index) => (
              <li key={step.id}>
                <button
                  type="button"
                  className={[styles.indexBtn, active === index ? styles.indexBtnActive : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => {
                    stepRefs.current[index]?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center',
                    });
                  }}
                >
                  <span>{step.number}</span>
                  {step.title}
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <div className={styles.steps}>
          <div className={styles.rail} aria-hidden="true">
            <div
              className={styles.railFill}
              style={{ height: `${((active + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          {STEPS.map((step, index) => (
            <article
              key={step.id}
              ref={(el) => {
                stepRefs.current[index] = el;
              }}
              data-index={index}
              className={[styles.step, active === index ? styles.stepActive : '']
                .filter(Boolean)
                .join(' ')}
            >
              <div className={styles.stepCopy}>
                <span className={styles.stepNumber}>{step.number}</span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepBody}>{step.body}</p>
                <div className={styles.chips}>
                  {step.chips.map((chip) => (
                    <span key={chip}>{chip}</span>
                  ))}
                </div>
              </div>
              <Preview type={step.preview} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
