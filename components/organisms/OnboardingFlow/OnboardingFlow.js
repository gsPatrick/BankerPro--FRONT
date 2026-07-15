'use client';

import { useEffect, useMemo, useState } from 'react';
import FormField from '@/components/molecules/FormField/FormField';
import Button from '@/components/atoms/Button/Button';
import Avatar from '@/components/atoms/Avatar/Avatar';
import Toast from '@/components/molecules/Toast/Toast';
import BrandMark from '@/components/BrandMark/BrandMark';
import { api, uploadFile } from '@/lib/api';
import {
  CERTIFICATION_OPTIONS,
  EXPERIENCE_LEVELS,
  WORK_SITUATIONS,
  formatPhone,
  markOnboardingCompletedLocal,
} from '@/lib/onboarding';
import styles from './OnboardingFlow.module.css';

/**
 * Organism: OnboardingFlow
 * First-access multi-step account setup (modal over platform)
 */
export default function OnboardingFlow({
  initialUser = null,
  asModal = true,
  onComplete,
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

  const [fullName, setFullName] = useState(initialUser?.fullName || '');
  const [whatsapp, setWhatsapp] = useState(formatPhone(initialUser?.whatsapp || ''));
  const [email, setEmail] = useState(initialUser?.email || '');
  const [workSituation, setWorkSituation] = useState(null);
  const [bankName, setBankName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [certification, setCertification] = useState('');
  const [certificationOther, setCertificationOther] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(initialUser?.avatarUrl || '');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!initialUser) return;
    if (initialUser.fullName) setFullName(initialUser.fullName);
    if (initialUser.whatsapp !== undefined) setWhatsapp(formatPhone(initialUser.whatsapp || ''));
    if (initialUser.email) setEmail(initialUser.email);
    if (initialUser.avatarUrl) setAvatarUrl(initialUser.avatarUrl);
  }, [initialUser]);

  useEffect(() => {
    if (!asModal) return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [asModal]);

  const totalSteps = useMemo(() => 3, []);

  const showToast = (message, type = 'error') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((current) => ({ ...current, visible: false })), 3500);
  };

  const initials = String(fullName || email || 'U')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const finishSuccessfully = (userPatch) => {
    markOnboardingCompletedLocal(userPatch);
    showToast('Perfil configurado!', 'success');
    onComplete?.(userPatch);
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const url = await uploadFile(file);
      setAvatarUrl(url);
      showToast('Foto carregada com sucesso!', 'success');
    } catch (err) {
      showToast(err.message || 'Não foi possível fazer upload da foto.');
    } finally {
      setLoading(false);
    }
  };

  const validateStep1 = () => {
    const next = {};
    if (!fullName.trim()) next.fullName = 'Informe seu nome.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateStep2 = () => {
    const next = {};
    if (!workSituation) next.workSituation = 'Selecione uma opção.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateStep3 = () => {
    const next = {};
    if (workSituation === WORK_SITUATIONS.EMPLOYED) {
      if (!bankName.trim()) next.bankName = 'Informe a instituição.';
      if (!roleTitle.trim()) next.roleTitle = 'Informe o cargo/função.';
      if (!experienceLevel) next.experienceLevel = 'Selecione o nível.';
    } else {
      if (!certification) next.certification = 'Selecione uma certificação.';
      if (certification === 'Outra' && !certificationOther.trim()) {
        next.certificationOther = 'Descreva a certificação.';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleContinue = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setErrors({});
    setStep((value) => Math.min(value + 1, 3));
  };

  const handleBack = () => {
    setErrors({});
    setStep((value) => Math.max(value - 1, 1));
  };

  const handleFinish = async () => {
    if (!validateStep3()) return;
    setLoading(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        whatsapp: whatsapp.replace(/\D/g, '') || null,
        workSituation,
        avatarUrl: avatarUrl || null,
        bankName: workSituation === WORK_SITUATIONS.EMPLOYED ? bankName.trim() : null,
        roleTitle: workSituation === WORK_SITUATIONS.EMPLOYED ? roleTitle.trim() : undefined,
        experienceLevel: workSituation === WORK_SITUATIONS.EMPLOYED ? experienceLevel : undefined,
        certification: workSituation === WORK_SITUATIONS.STUDYING ? certification : null,
        certificationOther:
          workSituation === WORK_SITUATIONS.STUDYING && certification === 'Outra'
            ? certificationOther.trim()
            : null,
      };

      const response = await api.post('/profile/onboarding', payload);
      const profile = response?.data || response;

      finishSuccessfully({
        fullName: profile?.fullName || fullName.trim(),
        whatsapp: profile?.whatsapp || whatsapp.replace(/\D/g, '') || null,
        avatarUrl: profile?.avatarUrl || avatarUrl || null,
      });
    } catch (err) {
      if (err.status === 404 || err.status === 405) {
        try {
          await api.put('/profile', {
            fullName: fullName.trim(),
            whatsapp: whatsapp.replace(/\D/g, '') || null,
            bankName: workSituation === WORK_SITUATIONS.EMPLOYED ? bankName.trim() : null,
            roleTitle:
              workSituation === WORK_SITUATIONS.EMPLOYED
                ? roleTitle.trim()
                : certification === 'Outra'
                  ? certificationOther.trim()
                  : certification,
            experienceLevel:
              workSituation === WORK_SITUATIONS.EMPLOYED ? experienceLevel : 'Iniciante',
            onboardingCompleted: true,
            workSituation,
            certification:
              workSituation === WORK_SITUATIONS.STUDYING ? certification : null,
            certificationOther:
              workSituation === WORK_SITUATIONS.STUDYING && certification === 'Outra'
                ? certificationOther.trim()
                : null,
            avatarUrl: avatarUrl || null,
          });
          finishSuccessfully({
            fullName: fullName.trim(),
            whatsapp: whatsapp.replace(/\D/g, '') || null,
            avatarUrl: avatarUrl || null,
          });
          return;
        } catch (fallbackErr) {
          showToast(fallbackErr.message || 'Não foi possível salvar o onboarding.');
          return;
        }
      }
      showToast(err.message || 'Não foi possível concluir o onboarding.');
    } finally {
      setLoading(false);
    }
  };

  const panel = (
    <div className={[styles.panel, asModal ? styles.panelModal : ''].filter(Boolean).join(' ')}>
      <div className={styles.brand}>
        <BrandMark className={styles.brandMark} />
        <span>Closer.IA</span>
      </div>
      <h1 id="onboarding-title" className={styles.title}>Configure sua conta</h1>
      <p className={styles.subtitle}>
        Leva menos de 1 minuto. Depois você pode alterar tudo em Perfil.
      </p>

      <div className={styles.progress} aria-hidden="true">
        {[1, 2, 3].map((item) => (
          <span
            key={item}
            className={[
              styles.progressBar,
              item <= step ? styles.progressBarActive : '',
            ].filter(Boolean).join(' ')}
          />
        ))}
      </div>
      <p className={styles.stepLabel}>
        Etapa {step} de {totalSteps}
        {step === 1 && ' · Confirmação de dados'}
        {step === 2 && ' · Situação atual'}
        {step === 3 && workSituation === WORK_SITUATIONS.EMPLOYED && ' · Experiência'}
        {step === 3 && workSituation === WORK_SITUATIONS.STUDYING && ' · Certificação'}
      </p>

      {step === 1 && (
        <div className={styles.form}>
          <div className={styles.avatarRow}>
            <Avatar size="xl" src={avatarUrl || undefined} initials={initials || 'U'} />
            <label className={styles.avatarBtn}>
              Adicionar foto
              <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
            </label>
          </div>

          <p className={styles.question}>Confirmação de dados</p>
          <p className={styles.confirmHint}>
            Já preenchemos com o que veio do cadastro. Ajuste se quiser.
          </p>

          <FormField
            id="onboarding-name"
            label="Nome"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Seu nome completo"
            state={errors.fullName ? 'error' : 'default'}
            helperText={errors.fullName}
          />
          <FormField
            id="onboarding-whatsapp"
            label="WhatsApp"
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
            placeholder="(11) 99999-9999"
            helperText="Opcional — pode alterar se precisar"
          />
          {email ? (
            <FormField
              id="onboarding-email"
              label="E-mail"
              value={email}
              disabled
              helperText="Do cadastro"
            />
          ) : null}
        </div>
      )}

      {step === 2 && (
        <div className={styles.form}>
          <p className={styles.question}>
            Você atualmente trabalha em banco ou instituição financeira?
          </p>
          <div className={styles.optionList} role="radiogroup" aria-label="Situação atual">
            <button
              type="button"
              className={[
                styles.option,
                workSituation === WORK_SITUATIONS.EMPLOYED ? styles.optionActive : '',
              ].filter(Boolean).join(' ')}
              onClick={() => setWorkSituation(WORK_SITUATIONS.EMPLOYED)}
            >
              Sim, trabalho atualmente
            </button>
            <button
              type="button"
              className={[
                styles.option,
                workSituation === WORK_SITUATIONS.STUDYING ? styles.optionActive : '',
              ].filter(Boolean).join(' ')}
              onClick={() => setWorkSituation(WORK_SITUATIONS.STUDYING)}
            >
              Não, estou estudando para entrar
            </button>
          </div>
          {errors.workSituation && (
            <p className={styles.fieldError}>{errors.workSituation}</p>
          )}
        </div>
      )}

      {step === 3 && workSituation === WORK_SITUATIONS.EMPLOYED && (
        <div className={styles.form}>
          <FormField
            id="onboarding-bank"
            label="Instituição onde trabalha"
            required
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="Ex.: Banco do Brasil"
            state={errors.bankName ? 'error' : 'default'}
            helperText={errors.bankName}
          />
          <FormField
            id="onboarding-role"
            label="Cargo/função atual"
            required
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder="Ex.: Gerente de Relacionamento"
            state={errors.roleTitle ? 'error' : 'default'}
            helperText={errors.roleTitle}
          />
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>
              Nível de experiência <span aria-hidden="true">*</span>
            </legend>
            <div className={styles.chipRow}>
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  className={[
                    styles.chip,
                    experienceLevel === level ? styles.chipActive : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setExperienceLevel(level)}
                >
                  {level}
                </button>
              ))}
            </div>
            {errors.experienceLevel && (
              <p className={styles.fieldError}>{errors.experienceLevel}</p>
            )}
          </fieldset>
        </div>
      )}

      {step === 3 && workSituation === WORK_SITUATIONS.STUDYING && (
        <div className={styles.form}>
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>
              Qual certificação você está estudando? <span aria-hidden="true">*</span>
            </legend>
            <div className={styles.optionList}>
              {CERTIFICATION_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={[
                    styles.option,
                    certification === option ? styles.optionActive : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setCertification(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            {errors.certification && (
              <p className={styles.fieldError}>{errors.certification}</p>
            )}
          </fieldset>

          {certification === 'Outra' && (
            <FormField
              id="onboarding-cert-other"
              label="Qual certificação?"
              required
              value={certificationOther}
              onChange={(e) => setCertificationOther(e.target.value)}
              placeholder="Digite a certificação"
              state={errors.certificationOther ? 'error' : 'default'}
              helperText={errors.certificationOther}
            />
          )}
        </div>
      )}

      <div className={styles.actions}>
        {step > 1 && (
          <Button variant="ghost" size="lg" onClick={handleBack} disabled={loading}>
            Voltar
          </Button>
        )}
        {step < 3 ? (
          <Button variant="primary" size="lg" className={styles.primaryAction} onClick={handleContinue}>
            Continuar
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            className={styles.primaryAction}
            loading={loading}
            onClick={handleFinish}
          >
            Finalizar
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {asModal ? (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
          {panel}
        </div>
      ) : (
        <div className={styles.page}>{panel}</div>
      )}

      {toast.visible && (
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((current) => ({ ...current, visible: false }))}
        />
      )}
    </>
  );
}
