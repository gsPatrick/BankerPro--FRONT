'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FormField from '@/components/molecules/FormField/FormField';
import Button from '@/components/atoms/Button/Button';
import Card from '@/components/molecules/Card/Card';
import Badge from '@/components/atoms/Badge/Badge';
import Toast from '@/components/molecules/Toast/Toast';
import Modal from '@/components/organisms/Modal/Modal';
import Spinner from '@/components/atoms/Spinner/Spinner';
import PaymentCheckout from '@/components/organisms/PaymentCheckout/PaymentCheckout';
import { api } from '@/lib/api';
import { clearOnboardingLocal, markOnboardingCompletedLocal } from '@/lib/onboarding';
import LandingPage from '@/components/landing/LandingPage/LandingPage';
import BrandMark from '@/components/BrandMark/BrandMark';
import styles from './page.module.css';

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

function formatPlanPrice(price, key = '') {
  const value = parsePlanPrice(price);
  if (value === null || value <= 0) {
    return { label: 'Grátis', period: '', currency: '' };
  }
  const formatted = Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace('.', ',');
  const isYearly = String(key).toLowerCase().includes('yearly') || String(key).toLowerCase().includes('year') || String(key).toLowerCase().includes('annual') || String(key).toLowerCase().includes('anual');
  const period = isYearly ? '/ano' : '/mês';
  return { label: formatted, period, currency: 'R$', value };
}

function parsePlanPrice(price) {
  if (price === null || price === undefined || price === '') return null;
  if (typeof price === 'number') {
    return Number.isFinite(price) ? price : null;
  }
  const normalized = String(price).trim().replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function isFreePlan(plan) {
  if (!plan) return false;
  const key = String(plan.key || '').toLowerCase();
  if (key === 'free' || key === 'gratis' || key === 'gratuito') return true;

  const name = String(plan.name || '').toLowerCase();
  if (name.includes('gratuito') || name.includes('grátis') || name.includes('gratis')) {
    const price = parsePlanPrice(plan.price);
    if (price === null || price <= 0) return true;
  }

  const price = parsePlanPrice(plan.price);
  return price !== null && price <= 0;
}

function normalizePlan(plan) {
  return {
    id: plan.id,
    key: plan.key,
    name: plan.name,
    price: plan.price,
    limitSimulations: plan.limit_simulations ?? plan.limitSimulations,
    features: plan.features || [],
  };
}

const PLANS_PER_PAGE = 2;

export default function OnboardingContainer() {
  const router = useRouter();
  const plansTrackRef = useRef(null);

  // Transition state: 'welcome' | 'gate' | 'login' | 'register' | 'checkout'
  const [activeView, setActiveView] = useState('welcome');
  const [regStep, setRegStep] = useState(1);

  // Success animations states
  const [authTransitioning, setAuthTransitioning] = useState(false);
  const [authTransitionMessage, setAuthTransitionMessage] = useState('');
  const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState('');
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedPaidPlan, setSelectedPaidPlan] = useState(null);
  const isProgrammaticScroll = useRef(false);
  const [checkoutBillingPeriod, setCheckoutBillingPeriod] = useState('monthly'); // 'monthly' | 'yearly'

  const cleanPlanName = (name) => {
    return name ? name.replace(/\s*-\s*(Mensal|Anual)\s*/gi, '') : '';
  };

  const filteredCheckoutPlans = useMemo(() => {
    return plans.filter((plan) => {
      const key = String(plan.key || '').toLowerCase();
      if (checkoutBillingPeriod === 'monthly') {
        return key.endsWith('_monthly') || (!key.endsWith('_yearly') && !key.endsWith('_annual') && !key.includes('yearly') && !key.includes('anual'));
      } else {
        return key.endsWith('_yearly') || key.endsWith('_annual') || key.includes('yearly') || key.includes('anual');
      }
    });
  }, [plans, checkoutBillingPeriod]);

  useEffect(() => {
    setRegStep(1);
  }, [activeView]);

  // Common Toast states
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const markPlanSelected = (planKey = 'free') => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('bankerpro_plan_selected', planKey);
  };

  const hasLocalPlanSelected = () => {
    if (typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem('bankerpro_plan_selected'));
  };

  const showToast = (message, type = 'error') => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3500);
  };

  const enterPlatformWithLoginAnimation = (startMessage = 'Autenticando...') => {
    setAuthTransitioning(true);
    setAuthTransitionMessage(startMessage);

    setTimeout(() => {
      setAuthTransitionMessage('Acesso autorizado!');
      setTimeout(() => {
        setAuthTransitionMessage('Carregando Closer.IA...');
        setTimeout(() => {
          router.push('/home');
        }, 800);
      }, 800);
    }, 800);
  };

  const activateFreeAndEnter = (planKey = 'free') => {
    markPlanSelected(planKey);
    enterPlatformWithLoginAnimation('Ativando plano gratuito...');
  };

  const isLegacyFreeCheckoutMessage = (message = '', code = '') => {
    const text = String(message || '');
    return /planos?\s+gratuitos?\s+n[aã]o\s+exigem\s+checkout/i.test(text) ||
      (code === 'BAD_REQUEST' && /checkout financeiro/i.test(text));
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const view = searchParams.get('view');
      if (view === 'login' || view === 'register' || view === 'gate') {
        setActiveView(view);
      }
    }
  }, []);

  useEffect(() => {
    if (activeView !== 'checkout') return;

    let cancelled = false;
    const loadPlans = async () => {
      setPlansLoading(true);
      try {
        const response = await api.get('/subscription/plans');
        if (cancelled) return;
        const list = Array.isArray(response.data)
          ? response.data.map(normalizePlan)
          : [];
        setPlans(list);
      } catch (err) {
        if (!cancelled) {
          showToast(err.message || 'Não foi possível carregar os planos.');
          setPlans([]);
        }
      } finally {
        if (!cancelled) setPlansLoading(false);
      }
    };

    loadPlans();
    return () => {
      cancelled = true;
    };
  }, [activeView]);

  const plansPageCount = Math.max(
    1,
    Math.ceil(filteredCheckoutPlans.length / PLANS_PER_PAGE)
  );

  // Trocar de Mensal para Anual troca o conjunto de páginas: voltar para a primeira
  // evita ficar preso numa página que não existe mais no outro período.
  useEffect(() => {
    setActivePageIndex(0);
    const track = plansTrackRef.current;
    if (track) track.scrollTo({ left: 0, behavior: 'auto' });
  }, [checkoutBillingPeriod]);

  const scrollToPlansPage = (pageIndex) => {
    const track = plansTrackRef.current;
    if (!track) {
      setActivePageIndex(pageIndex);
      return;
    }

    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      setActivePageIndex(pageIndex);
      return;
    }

    const nextPage = Math.max(0, Math.min(pageIndex, plansPageCount - 1));
    isProgrammaticScroll.current = true;
    setActivePageIndex(nextPage);
    track.scrollTo({
      left: nextPage * track.clientWidth,
      behavior: 'smooth',
    });
    window.setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 450);
  };

  useEffect(() => {
    if (activeView !== 'checkout' || !plansTrackRef.current || plans.length === 0) return;
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      return;
    }

    const syncScroll = () => {
      const track = plansTrackRef.current;
      if (!track) return;
      track.scrollTo({
        left: activePageIndex * track.clientWidth,
        behavior: 'auto',
      });
    };

    syncScroll();
    // Re-sync after the panel expand animation finishes
    const timer = window.setTimeout(syncScroll, 900);
    window.addEventListener('resize', syncScroll);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', syncScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only realign on checkout enter/plans load
  }, [activeView, plans.length]);

  const handlePlansScroll = () => {
    const track = plansTrackRef.current;
    if (!track || typeof window === 'undefined') return;
    if (window.matchMedia('(max-width: 1023px)').matches) return;
    if (isProgrammaticScroll.current) return;

    const pageWidth = track.clientWidth || 1;
    const nextPage = Math.round(track.scrollLeft / pageWidth);
    setActivePageIndex((current) => (current === nextPage ? current : nextPage));
  };
  /* ────────────────────────────────────────────────────────
     LOGIN FORM CONTROLS
     ──────────────────────────────────────────────────────── */
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginEmailError, setLoginEmailError] = useState('');
  const [loginPasswordError, setLoginPasswordError] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginEmailError('');
    setLoginPasswordError('');

    let hasError = false;
    if (!loginEmail) {
      setLoginEmailError('E-mail é obrigatório');
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(loginEmail)) {
        setLoginEmailError('E-mail inválido');
        hasError = true;
      }
    }
    if (!loginPassword) {
      setLoginPasswordError('Senha é obrigatória');
      hasError = true;
    }

    if (hasError) return;

    setLoginLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: loginEmail,
        password: loginPassword,
      });

      if (response.success && response.data) {
        const accessToken = response.data.access_token || response.data.accessToken || response.data.token;
        clearOnboardingLocal();
        localStorage.setItem('bankerpro_token', accessToken);
        localStorage.setItem('bankerpro_user', JSON.stringify(response.data.user));
        if (response.data.user?.onboardingCompleted) {
          markOnboardingCompletedLocal(response.data.user);
        }

        let needsPlanSelection = true;
        try {
          const subResponse = await api.get('/subscription/current');
          const subscription = subResponse?.data;
          needsPlanSelection = !(
            subscription?.plan_selected ||
            subscription?.planSelected ||
            subscription?.id ||
            hasLocalPlanSelected()
          );
        } catch {
          needsPlanSelection = !hasLocalPlanSelected();
        }

        if (needsPlanSelection) {
          setActiveView('checkout');
          return;
        }

        enterPlatformWithLoginAnimation('Autenticando...');
      }
    } catch (err) {
      const credentialsError =
        err.code === 'INVALID_CREDENTIALS' ||
        /e-mail ou senha/i.test(err.message || '');

      if (credentialsError) {
        setLoginPasswordError(err.message || 'E-mail ou senha inválidos.');
      } else {
        showToast(err.message || 'Não foi possível fazer login. Tente novamente.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  /* ────────────────────────────────────────────────────────
     REGISTER FORM CONTROLS
     ──────────────────────────────────────────────────────── */
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regAcceptedTerms, setRegAcceptedTerms] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  const [regEmailError, setRegEmailError] = useState('');
  const [regPasswordError, setRegPasswordError] = useState('');
  const [regConfirmError, setRegConfirmError] = useState('');
  const [regFullNameError, setRegFullNameError] = useState('');
  const [regWhatsappError, setRegWhatsappError] = useState('');

  // Terms sheet modal states
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsText, setTermsText] = useState('Carregando termos...');
  const [loadingTerms, setLoadingTerms] = useState(false);

  const loadTerms = async () => {
    setTermsOpen(true);
    if (termsText !== 'Carregando termos...') return;
    
    setLoadingTerms(true);
    try {
      const response = await api.get('/auth/terms');
      if (response.success && response.data) {
        setTermsText(response.data.text);
      }
    } catch (err) {
      setTermsText('Não foi possível carregar os termos de uso. Por favor, tente novamente mais tarde.');
    } finally {
      setLoadingTerms(false);
    }
  };

  const handleTermsClick = (e) => {
    e.preventDefault();
    if (window.innerWidth >= 1024) {
      window.open('/terms', '_blank');
    } else {
      loadTerms();
    }
  };

  const formatPhone = (val) => {
    const digits = val.replace(/\D/g, '');
    const truncated = digits.slice(0, 11);
    if (truncated.length <= 2) return truncated;
    if (truncated.length <= 6) return `(${truncated.slice(0, 2)}) ${truncated.slice(2)}`;
    if (truncated.length <= 10) return `(${truncated.slice(0, 2)}) ${truncated.slice(2, 6)}-${truncated.slice(6)}`;
    return `(${truncated.slice(0, 2)}) ${truncated.slice(2, 7)}-${truncated.slice(7)}`;
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'transparent' };
    if (pwd.length < 6) return { score: 1, label: 'Fraca', color: '#FF3B30' };
    
    const hasLetters = /[a-zA-Z]/.test(pwd);
    const hasNumbers = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const complexityScore = (hasLetters ? 1 : 0) + (hasNumbers ? 1 : 0) + (hasSpecial ? 1 : 0);
    
    if (pwd.length >= 8 && complexityScore >= 3) {
      return { score: 3, label: 'Forte', color: '#00D166' };
    }
    return { score: 2, label: 'Média', color: '#FF9F0A' };
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    if (regStep === 1) {
      setRegFullNameError('');
      setRegEmailError('');
      setRegWhatsappError('');

      let hasError = false;
      if (!regFullName) {
        setRegFullNameError('Nome completo é obrigatório');
        hasError = true;
      }
      if (!regEmail) {
        setRegEmailError('E-mail é obrigatório');
        hasError = true;
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(regEmail)) {
          setRegEmailError('E-mail inválido');
          hasError = true;
        }
      }
      if (!regWhatsapp) {
        setRegWhatsappError('Telefone é obrigatório');
        hasError = true;
      } else {
        const digits = regWhatsapp.replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 11) {
          setRegWhatsappError('Insira um telefone válido com DDD');
          hasError = true;
        }
      }

      if (hasError) return;
      setRegStep(2);
      return;
    }

    // Step 2 validation
    setRegPasswordError('');
    setRegConfirmError('');

    let hasError = false;
    if (!regPassword) {
      setRegPasswordError('Senha é obrigatória');
      hasError = true;
    } else if (regPassword.length < 6) {
      setRegPasswordError('A senha deve ter no mínimo 6 caracteres');
      hasError = true;
    }
    if (regPassword !== regConfirmPassword) {
      setRegConfirmError('As senhas não coincidem');
      hasError = true;
    }
    if (!regAcceptedTerms) {
      showToast('Você precisa ler e aceitar os Termos de Uso e LGPD.');
      hasError = true;
    }

    if (hasError) return;

    setRegLoading(true);
    try {
      const response = await api.post('/auth/register', {
        email: regEmail,
        password: regPassword,
        acceptedTerms: true,
        fullName: regFullName,
        whatsapp: regWhatsapp,
      });

      if (response.success && response.data) {
        const accessToken = response.data.access_token || response.data.accessToken || response.data.token;
        clearOnboardingLocal();
        localStorage.setItem('bankerpro_token', accessToken);
        localStorage.setItem('bankerpro_user', JSON.stringify({
          id: response.data.id,
          email: response.data.email,
          fullName: response.data.fullName || regFullName,
          role: response.data.role,
          onboardingCompleted: false
        }));

        setActiveView('checkout');
      }
    } catch (err) {
      showToast(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleSelectPlan = async (plan) => {
    // Free plan nunca abre modal de pagamento
    if (isFreePlan(plan)) {
      setSelectedPaidPlan(null);
      setCheckoutLoadingPlan(plan.key);
      const planKey = plan.key || 'free';

      try {
        const response = await api.post('/subscription/checkout', {
          planType: planKey,
          paymentMethod: 'free',
        });

        if (!response?.success) {
          throw new Error(response?.message || 'Não foi possível ativar o plano gratuito.');
        }

        activateFreeAndEnter(planKey);
      } catch (err) {
        // API antiga: "Planos gratuitos não exigem checkout financeiro."
        // Nesse caso o free já é válido — só entra no sistema.
        if (isLegacyFreeCheckoutMessage(err.message, err.code)) {
          activateFreeAndEnter(planKey);
          return;
        }

        try {
          const fallback = await api.post('/subscription/checkout', {
            planType: planKey,
          });
          if (fallback?.success) {
            activateFreeAndEnter(planKey);
            return;
          }
        } catch (fallbackErr) {
          if (isLegacyFreeCheckoutMessage(fallbackErr.message, fallbackErr.code)) {
            activateFreeAndEnter(planKey);
            return;
          }
        }

        showToast(err.message || 'Erro ao ativar plano gratuito.');
      } finally {
        setCheckoutLoadingPlan('');
      }
      return;
    }

    setSelectedPaidPlan(plan);
  };

  const handlePaymentSuccess = () => {
    const planKey = selectedPaidPlan?.key || 'paid';
    setSelectedPaidPlan(null);
    markPlanSelected(planKey);
    enterPlatformWithLoginAnimation('Pagamento confirmado...');
  };

  const scrollPlans = (direction) => {
    if (plans.length === 0) return;
    const nextPage =
      direction === 'next'
        ? Math.min(activePageIndex + 1, plansPageCount - 1)
        : Math.max(activePageIndex - 1, 0);
    scrollToPlansPage(nextPage);
  };

  /* ────────────────────────────────────────────────────────
     RENDER VIEW
     ──────────────────────────────────────────────────────── */
  // Conditional layouts classes
  const layoutClasses = [
    styles.splitLayout,
    // Gate = 70/30 (welcome). Login/register/checkout = painel ativo 50/50.
    activeView === 'login' || activeView === 'register' || activeView === 'checkout'
      ? styles.formActive
      : '',
    activeView === 'checkout' ? styles.checkoutActive : '',
  ].filter(Boolean).join(' ');

  if (authTransitioning) {
    return (
      <div className={styles.transitionScreen}>
        <div className={styles.transitionContent}>
          <div className={styles.spinnerWrapper}>
            <div className={styles.premiumSpinner} />
            <div className={styles.spinnerGlow} />
          </div>
          <h2 className={styles.transitionTitle}>Closer.IA</h2>
          <p className={styles.transitionMessage}>{authTransitionMessage}</p>
        </div>
      </div>
    );
  }

  if (activeView === 'welcome') {
    return (
      <LandingPage
        onLogin={() => setActiveView('gate')}
        onRegister={() => setActiveView('register')}
      />
    );
  }

  return (
    <div className={[layoutClasses, styles.layoutReveal].filter(Boolean).join(' ')}>
      {/* Left panel (marketing banner/background) */}
      <div className={styles.marketingSide}>
        <div className={styles.placeholderImageWrapper} />
        
        <div className={styles.logoHeader}>
          <button
            type="button"
            className={styles.systemLogoBtn}
            onClick={() => setActiveView('welcome')}
            aria-label="Voltar para a landing"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <BrandMark style={{ width: '22px', height: '22px' }} />
            <span className={styles.systemLogoText} style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#ffffff'
            }}>
              Closer.IA
            </span>
          </button>
        </div>

        <div className={styles.bottomLeftContainer}>
          <p className={styles.bottomLeftPhrase}>
            Acelerando sua performance em vendas e negociação com inteligência artificial.
          </p>
        </div>
      </div>

      {/* Right panel (form area) */}
      <div className={styles.controlSide}>
        <div className={styles.controlContainer}>
          {/* VIEW: Auth gate — choose login or register */}
          {activeView === 'gate' && (
            <div className={styles.welcomeView}>
              <div className={styles.introHeader}>
                <p className={styles.welcomeText}>Seja bem-vindo</p>
                <p className={styles.tagline}>Treine negociações de alto nível com IA.</p>
              </div>

              <div className={styles.buttonStack}>
                <Button
                  variant="primary"
                  size="lg"
                  className={styles.fullWidthBtn}
                  onClick={() => setActiveView('register')}
                >
                  Criar conta nova
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  className={styles.fullWidthBtn}
                  onClick={() => setActiveView('login')}
                >
                  Já tenho conta
                </Button>
              </div>
            </div>
          )}

          {/* VIEW: Login Form */}
          {activeView === 'login' && (
            <div className={styles.formView}>
              <div className={styles.authHeader}>
                <h1 className={styles.systemLogo}>Closer.IA</h1>
                <p className={styles.formSubtitle}>Faça login para praticar suas abordagens.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className={styles.formStack}>
                <FormField
                  id="loginEmail"
                  label="E-mail profissional"
                  placeholder="nome@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  state={loginEmailError ? 'error' : 'default'}
                  helperText={loginEmailError}
                  type="email"
                  iconLeft={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  }
                />

                <FormField
                  id="loginPassword"
                  label="Senha de acesso"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  state={loginPasswordError ? 'error' : 'default'}
                  helperText={loginPasswordError}
                  type={showLoginPassword ? 'text' : 'password'}
                  iconLeft={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  }
                  iconRight={
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0
                      }}
                      aria-label={showLoginPassword ? 'Esconder senha' : 'Mostrar senha'}
                    >
                      {showLoginPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  }
                />

                <Button variant="primary" type="submit" size="lg" loading={loginLoading} className={styles.submitBtn}>
                  Entrar no aplicativo
                </Button>
              </form>

              <div className={styles.authFooter}>
                <span>Novo no Closer.IA? </span>
                <button className={styles.accentTextBtn} onClick={() => setActiveView('register')}>
                  Crie sua conta agora
                </button>
              </div>
            </div>
          )}

          {/* VIEW: Register Form */}
          {activeView === 'register' && (
            <div className={styles.formView}>
              <div className={styles.authHeader}>
                <h1 className={styles.systemLogo}>Closer.IA</h1>
                <p className={styles.formSubtitle}>
                  {regStep === 1 
                    ? 'Dados de identificação' 
                    : 'Configuração de segurança'}
                </p>
                <div className={styles.stepIndicator}>
                  <div className={`${styles.stepIndicatorBar} ${regStep >= 1 ? styles.stepActive : ''}`} />
                  <div className={`${styles.stepIndicatorBar} ${regStep >= 2 ? styles.stepActive : ''}`} />
                </div>
              </div>

              <form onSubmit={handleRegisterSubmit} className={styles.formStackCompact}>
                {regStep === 1 && (
                  <div className={styles.stepFadeIn}>
                    <FormField
                      id="regFullName"
                      label="Nome completo"
                      placeholder="Seu nome"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      state={regFullNameError ? 'error' : 'default'}
                      helperText={regFullNameError}
                      type="text"
                      iconLeft={
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      }
                    />

                    <FormField
                      id="regEmail"
                      label="E-mail profissional"
                      placeholder="nome@email.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      state={regEmailError ? 'error' : 'default'}
                      helperText={regEmailError}
                      type="email"
                      iconLeft={
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      }
                    />

                    <div className={styles.phoneFieldWrapper}>
                      <FormField
                        id="regWhatsapp"
                        label="Telefone / WhatsApp"
                        placeholder="(00) 00000-0000"
                        value={regWhatsapp}
                        onChange={(e) => setRegWhatsapp(formatPhone(e.target.value))}
                        state={regWhatsappError ? 'error' : 'default'}
                        helperText={regWhatsappError}
                        type="tel"
                        iconLeft={
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                        }
                      />
                      <p className={styles.phoneWarning}>
                        Este número será usado para disparos no WhatsApp.
                      </p>
                    </div>

                    <Button variant="primary" type="submit" size="lg" className={styles.submitBtn}>
                      Continuar →
                    </Button>
                  </div>
                )}

                {regStep === 2 && (
                  <div className={styles.stepFadeIn}>
                    <div className={styles.passwordFieldWrapper}>
                      <FormField
                        id="regPassword"
                        label="Senha de acesso"
                        placeholder="Mínimo 6 caracteres"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        state={regPasswordError ? 'error' : 'default'}
                        helperText={regPasswordError}
                        type={showRegPassword ? 'text' : 'password'}
                        iconLeft={
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        }
                        iconRight={
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--color-text-secondary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0
                            }}
                            aria-label={showRegPassword ? 'Esconder senha' : 'Mostrar senha'}
                          >
                            {showRegPassword ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            )}
                          </button>
                        }
                      />
                      
                      {regPassword && (
                        <div className={styles.strengthMeter}>
                          <div className={styles.strengthBars}>
                            <div className={`${styles.strengthBar} ${getPasswordStrength(regPassword).score >= 1 ? styles.active : ''}`} style={{ backgroundColor: getPasswordStrength(regPassword).score >= 1 ? getPasswordStrength(regPassword).color : '' }} />
                            <div className={`${styles.strengthBar} ${getPasswordStrength(regPassword).score >= 2 ? styles.active : ''}`} style={{ backgroundColor: getPasswordStrength(regPassword).score >= 2 ? getPasswordStrength(regPassword).color : '' }} />
                            <div className={`${styles.strengthBar} ${getPasswordStrength(regPassword).score >= 3 ? styles.active : ''}`} style={{ backgroundColor: getPasswordStrength(regPassword).score >= 3 ? getPasswordStrength(regPassword).color : '' }} />
                          </div>
                          <span className={styles.strengthLabel} style={{ color: getPasswordStrength(regPassword).color }}>
                            Senha {getPasswordStrength(regPassword).label.toLowerCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    <FormField
                      id="regConfirmPassword"
                      label="Confirme sua senha"
                      placeholder="Repita a senha"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      state={regConfirmError ? 'error' : 'default'}
                      helperText={regConfirmError}
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      iconLeft={
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      }
                      iconRight={
                        <button
                          type="button"
                          onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0
                          }}
                          aria-label={showRegConfirmPassword ? 'Esconder senha' : 'Mostrar senha'}
                        >
                          {showRegConfirmPassword ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      }
                    />

                    {/* Checkbox Termos de Uso */}
                    <div className={styles.checkboxContainer}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={regAcceptedTerms}
                          onChange={(e) => setRegAcceptedTerms(e.target.checked)}
                          className={styles.checkbox}
                        />
                        <span className={styles.checkboxText}>
                          Li e concordo com os{' '}
                          <button type="button" onClick={handleTermsClick} className={styles.termsTrigger}>
                            Termos de Uso e Políticas de Privacidade (LGPD)
                          </button>
                        </span>
                      </label>
                    </div>

                    <Button variant="primary" type="submit" size="lg" loading={regLoading} className={styles.submitBtn}>
                      Cadastrar e começar
                    </Button>

                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
                      <button type="button" onClick={() => setRegStep(1)} className={styles.accentTextBtn}>
                        ← Voltar para dados de contato
                      </button>
                    </div>
                  </div>
                )}
              </form>

              <div className={styles.authFooter}>
                <span>Já tem uma conta? </span>
                <button className={styles.accentTextBtn} onClick={() => setActiveView('login')}>
                  Entre por aqui
                </button>
              </div>
            </div>
          )}

          {/* VIEW: Checkout Page */}
          {activeView === 'checkout' && (
            <div className={styles.checkoutView}>
              <div className={styles.authHeader}>
                <h1 className={styles.systemLogo}>Closer.IA</h1>
                <p className={styles.formSubtitle}>Selecione seu plano de assinatura</p>
              </div>

              <p className={styles.checkoutTagline}>
                Desbloqueie simulações ilimitadas e o Copiloto no WhatsApp para acelerar sua performance em vendas.
              </p>

              {plansLoading ? (
                <div className={styles.plansLoading}>
                  <Spinner size="md" />
                  <span>Carregando planos...</span>
                </div>
              ) : plans.length === 0 ? (
                <div className={styles.plansLoading}>
                  <span>Nenhum plano disponível no momento.</span>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <div style={{
                      display: 'inline-flex',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      padding: '4px',
                      borderRadius: '999px',
                    }}>
                      <button
                        type="button"
                        style={{
                          background: checkoutBillingPeriod === 'monthly' ? '#ffffff' : 'none',
                          color: checkoutBillingPeriod === 'monthly' ? '#000000' : 'rgba(255, 255, 255, 0.6)',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '999px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 700,
                          transition: 'all 0.2s'
                        }}
                        onClick={() => setCheckoutBillingPeriod('monthly')}
                      >
                        Mensal
                      </button>
                      <button
                        type="button"
                        style={{
                          background: checkoutBillingPeriod === 'yearly' ? '#ffffff' : 'none',
                          color: checkoutBillingPeriod === 'yearly' ? '#000000' : 'rgba(255, 255, 255, 0.6)',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '999px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 700,
                          transition: 'all 0.2s'
                        }}
                        onClick={() => setCheckoutBillingPeriod('yearly')}
                      >
                        Anual (Economize)
                      </button>
                    </div>
                  </div>

                  {filteredCheckoutPlans.length === 0 ? (
                    <div className={styles.plansLoading}>
                      <span>
                        Nenhum plano {checkoutBillingPeriod === 'yearly' ? 'anual' : 'mensal'} disponível no momento.
                      </span>
                    </div>
                  ) : (
                  <div className={styles.plansCarousel}>
                    {plansPageCount > 1 && (
                      <button
                        type="button"
                        className={`${styles.plansNavBtn} ${styles.plansNavPrev}`}
                        onClick={() => scrollPlans('prev')}
                        disabled={activePageIndex === 0}
                        aria-label="Planos anteriores"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </button>
                    )}

                    <div
                      className={styles.plansTrack}
                      ref={plansTrackRef}
                      onScroll={handlePlansScroll}
                    >
                      {Array.from({ length: plansPageCount }, (_, pageIndex) => {
                        const pagePlans = filteredCheckoutPlans.slice(
                          pageIndex * PLANS_PER_PAGE,
                          pageIndex * PLANS_PER_PAGE + PLANS_PER_PAGE
                        );

                        return (
                          <div key={`plans-page-${pageIndex}`} className={styles.plansPage}>
                            {pagePlans.map((plan) => {
                              const price = formatPlanPrice(plan.price, plan.key);
                              const isFree = isFreePlan(plan);
                              const isRecommended = String(plan.key || '').includes('premium');
                              const features = Array.isArray(plan.features) ? plan.features : [];
                              const monthlyEquivalent =
                                checkoutBillingPeriod === 'yearly' && price.value
                                  ? (price.value / 12).toFixed(2).replace('.', ',')
                                  : null;

                              return (
                                <div
                                  key={plan.id || plan.key}
                                  className={`${styles.planCard} ${isRecommended ? styles.planCardPro : ''}`}
                                >
                                  {isRecommended && (
                                    <div className={styles.planCardBadge}>Recomendado</div>
                                  )}
                                  <h3 className={styles.planName}>{cleanPlanName(plan.name)}</h3>
                                  <div className={styles.planPriceWrapper}>
                                    {price.currency && (
                                      <span className={styles.planPriceCurrency}>{price.currency}</span>
                                    )}
                                    <span className={styles.planPriceValue}>{price.label}</span>
                                    {price.period && (
                                      <span className={styles.planPricePeriod}>{price.period}</span>
                                    )}
                                  </div>
                                  {monthlyEquivalent && (
                                    <span className={styles.planPriceEquivalent}>
                                      Equivalente a R$ {monthlyEquivalent}/mês
                                    </span>
                                  )}
                                  <ul className={styles.planFeatures}>
                                    {features.map((feature) => (
                                      <li key={feature}>
                                        <CheckIcon />
                                        {feature}
                                      </li>
                                    ))}
                                  </ul>
                                  <Button
                                    variant={isRecommended ? 'primary' : 'secondary'}
                                    size="lg"
                                    className={styles.fullWidthBtn}
                                    loading={checkoutLoadingPlan === plan.key}
                                    onClick={() => handleSelectPlan(plan)}
                                  >
                                    {isFree ? 'Começar grátis' : `Assinar ${cleanPlanName(plan.name)}`}
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>

                    {plansPageCount > 1 && (
                      <button
                        type="button"
                        className={`${styles.plansNavBtn} ${styles.plansNavNext}`}
                        onClick={() => scrollPlans('next')}
                        disabled={activePageIndex >= plansPageCount - 1}
                        aria-label="Próximos planos"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    )}

                    {plansPageCount > 1 && (
                      <div className={styles.plansDots}>
                        {Array.from({ length: plansPageCount }, (_, index) => (
                          <button
                            key={`plans-dot-${index}`}
                            type="button"
                            className={`${styles.plansDot} ${index === activePageIndex ? styles.plansDotActive : ''}`}
                            onClick={() => scrollToPlansPage(index)}
                            aria-label={`Ir para página ${index + 1} de planos`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Floating Toast Notification */}
      <div className={styles.toastWrapper}>
        <Toast
          type={toastType}
          message={toastMessage}
          visible={toastVisible}
          onClose={() => setToastVisible(false)}
        />
      </div>

      <PaymentCheckout
        isOpen={!!selectedPaidPlan && !isFreePlan(selectedPaidPlan)}
        plan={selectedPaidPlan && !isFreePlan(selectedPaidPlan) ? selectedPaidPlan : null}
        onClose={() => setSelectedPaidPlan(null)}
        onSuccess={handlePaymentSuccess}
        onError={(message) => showToast(message)}
      />

      {/* Dynamic Terms Dialog (Bottom Sheet) */}
      <Modal
        isOpen={termsOpen}
        onClose={() => setTermsOpen(false)}
        title="Termos de Uso e Proteção de Dados (LGPD)"
        footer={
          <Button
            variant="primary"
            size="md"
            className={styles.fullWidthBtn}
            onClick={() => {
              setRegAcceptedTerms(true);
              setTermsOpen(false);
            }}
          >
            Li e aceito os termos
          </Button>
        }
      >
        <div className={styles.termsContent}>
          {loadingTerms ? (
            <div className={styles.loadingBox}>
              <span>Carregando termos de uso...</span>
            </div>
          ) : (
            <p className={styles.markdownText}>{termsText}</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
