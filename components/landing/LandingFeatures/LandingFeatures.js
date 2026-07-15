'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './LandingFeatures.module.css';

const FEATURES = [
  {
    id: 'painel',
    kicker: 'Visão geral',
    title: 'Painel',
    body: 'Perfis da carteira, produtos em alta, metas e agenda do mês em um só lugar.',
  },
  {
    id: 'cenarios',
    kicker: 'Treino',
    title: 'Cenários com IA',
    body: 'Simule abordagens com cliente virtual, objeções reais e feedback da condução.',
  },
  {
    id: 'copiloto',
    kicker: 'IA',
    title: 'Copiloto',
    body: 'Roteiro na hora H: abertura, diagnóstico, respostas e fechamento no seu canal.',
  },
  {
    id: 'oportunidades',
    kicker: 'Comercial',
    title: 'Lista de Oportunidades',
    body: 'Roteiros prontos por produto e perfil — sem improvisar na hora da ligação.',
  },
  {
    id: 'carteira',
    kicker: 'Gestão',
    title: 'Carteira',
    body: 'Organize clientes, produtos oferecidos, status e próximos retornos.',
  },
  {
    id: 'agenda',
    kicker: 'Rotina',
    title: 'Agenda',
    body: 'Veja quem retorna no mês e priorize o dia com clareza.',
  },
  {
    id: 'metas',
    kicker: 'Performance',
    title: 'Metas',
    body: 'Acompanhe alvos por produto e o progresso real da sua performance.',
  },
  {
    id: 'ranking',
    kicker: 'Evolução',
    title: 'Histórico & Pontuações',
    body: 'Monitore seus pontos de XP, analise erros em simulações passadas e evolua no seu próprio ritmo.',
  },
];

export default function LandingFeatures() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return undefined;

    const update = () => {
      const rect = section.getBoundingClientRect();
      const scrollable = section.offsetHeight - window.innerHeight;
      if (scrollable <= 0) {
        setProgress(0);
        return;
      }
      const scrolled = Math.min(Math.max(-rect.top, 0), scrollable);
      const next = scrolled / scrollable;
      setProgress(next);

      const maxX = Math.max(track.scrollWidth - window.innerWidth, 0);
      track.style.transform = `translate3d(${-maxX * next}px, 0, 0)`;
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      id="recursos"
      style={{ '--feature-count': FEATURES.length }}
    >
      <div className={styles.sticky}>
        <div className={styles.head}>
          <p className={styles.eyebrow}>Recursos</p>
          <h2 className={styles.title}>Tudo que o bancário precisa para fechar.</h2>
          <div className={styles.progressTrack} aria-hidden="true">
            <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
          </div>
        </div>

        <div className={styles.viewport}>
          <div ref={trackRef} className={styles.track}>
            {FEATURES.map((feature, index) => (
              <article key={feature.id} className={styles.card}>
                <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
                <p className={styles.kicker}>{feature.kicker}</p>
                <h3 className={styles.cardTitle}>{feature.title}</h3>
                <p className={styles.cardBody}>{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
