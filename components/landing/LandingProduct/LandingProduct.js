'use client';

import CloserPanelMock from './CloserPanelMock';
import styles from './LandingProduct.module.css';

/**
 * Linear-style second section:
 * headline + support copy, then a framed live lookalike of the Closer.IA panel.
 */
export default function LandingProduct({ onRegister }) {
  return (
    <section className={styles.section} id="produto">
      <div className={styles.intro}>
        <h2 className={styles.title}>
          O sistema de performance
          <br />
          comercial para times e IA.
        </h2>
        <div className={styles.descriptionRow}>
          <p className={styles.description}>
            Feito para treinar, acompanhar carteira e fechar com copiloto.
            Desenhado para a era da inteligência artificial.
          </p>
          <button type="button" className={styles.cta} onClick={onRegister}>
            Ver na prática
            <span className={styles.ctaArrow} aria-hidden="true">
              →
            </span>
          </button>
        </div>
      </div>

      <div className={styles.stage}>
        <div className={styles.glow} aria-hidden="true" />
        <div
          className={styles.frameWrap}
          aria-label="Prévia do painel Closer.IA com carteira e metas"
        >
          <div className={styles.frame}>
            <CloserPanelMock />
          </div>
        </div>
      </div>

      <p className={styles.bridge}>
        Veja como tudo funciona
      </p>
    </section>
  );
}
