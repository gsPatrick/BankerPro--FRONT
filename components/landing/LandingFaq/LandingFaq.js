'use client';

import { useState } from 'react';
import styles from './LandingFaq.module.css';

const FAQ = [
  {
    q: 'O Closer.IA substitui o treinamento presencial?',
    a: 'Não. Ele complementa: você treina todos os dias com cenários e roteiros, e chega mais preparado na conversa real com o cliente.',
  },
  {
    q: 'Preciso de WhatsApp para usar o Copiloto?',
    a: 'O Copiloto funciona na plataforma. A integração com WhatsApp é opcional e depende do plano e da configuração.',
  },
  {
    q: 'Quanto tempo leva para ver resultado?',
    a: 'Bancários que treinam com consistência costumam ganhar segurança na abordagem já nas primeiras semanas — especialmente com os Scripts.',
  },
  {
    q: 'Serve para quem atende e para quem gerencia?',
    a: 'Sim. O bancário treina e fecha; ele mesmo acompanha suas métricas, metas e sua própria evolução de forma 100% individual.',
  },
  {
    q: 'Meus dados ficam seguros?',
    a: 'O acesso é autenticado por conta. Termos e privacidade (LGPD) ficam disponíveis no cadastro e nas configurações da plataforma.',
  },
];

export default function LandingFaq() {
  const [open, setOpen] = useState(0);

  return (
    <section className={styles.section} id="faq">
      <div className={styles.inner}>
        <div className={styles.head}>
          <p className={styles.eyebrow}>FAQ</p>
          <h2 className={styles.title}>Perguntas frequentes</h2>
          <p className={styles.lede}>
            O essencial para decidir se o Closer.IA encaixa na sua rotina de agência.
          </p>
        </div>

        <div className={styles.list}>
          {FAQ.map((item, index) => {
            const isOpen = open === index;
            return (
              <div
                key={item.q}
                className={[styles.item, isOpen ? styles.itemOpen : ''].filter(Boolean).join(' ')}
              >
                <button
                  type="button"
                  className={styles.question}
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : index)}
                >
                  <span>{item.q}</span>
                  <span className={styles.icon} aria-hidden="true">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                <div className={styles.answerWrap} hidden={!isOpen}>
                  <p className={styles.answer}>{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
