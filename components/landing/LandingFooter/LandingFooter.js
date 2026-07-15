import BrandMark from '@/components/BrandMark/BrandMark';
import styles from './LandingFooter.module.css';

const NAV = [
  { label: 'Início', href: '#top' },
  { label: 'Produto', href: '#produto' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Planos', href: '#planos' },
  { label: 'App', href: '#app' },
  { label: 'FAQ', href: '#faq' },
];

export default function LandingFooter({ onLogin, onRegister }) {
  return (
    <footer className={styles.footer} data-landing-footer>
      <div className={styles.container}>
        <div className={styles.careersBlock}>
          <BrandMark className={styles.mark} />
          <h2 className={styles.heading}>
            Ferramentas para bancários que fecham com método.
          </h2>
          <p className={styles.careersText}>
            Treine, aborde e acompanhe a carteira no mesmo sistema.{' '}
            <button type="button" className={styles.careersLink} onClick={onRegister}>
              <span>Começar agora</span>
              <span className={styles.careersArrow} aria-hidden="true">
                →
              </span>
            </button>
          </p>
        </div>

        <div className={styles.bottom}>
          <nav className={styles.nav} aria-label="Rodapé">
            <ul className={styles.navList}>
              {NAV.map((item) => (
                <li key={item.label}>
                  <a className={styles.navLink} href={item.href}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.actions}>
            <button type="button" className={styles.loginBtn} onClick={onLogin}>
              Entrar
            </button>
            <button type="button" className={styles.signupBtn} onClick={onRegister}>
              Criar conta
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
