import styles from './LandingCta.module.css';

export default function LandingCta({ onLogin, onRegister }) {
  return (
    <section className={styles.section} id="começar">
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Comece agora</p>
        <h2 className={styles.title}>
          Pronto para treinar
          <br />
          o próximo fechamento?
        </h2>
        <p className={styles.text}>
          Crie sua conta e entre no Closer.IA. Cenários, copiloto e carteira no mesmo lugar.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={onRegister}>
            Criar conta
          </button>
          <button type="button" className={styles.ghost} onClick={onLogin}>
            Já tenho conta
          </button>
        </div>
      </div>
    </section>
  );
}
