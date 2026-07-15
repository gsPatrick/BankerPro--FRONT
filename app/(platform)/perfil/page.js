'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import FormField from '@/components/molecules/FormField/FormField';
import Button from '@/components/atoms/Button/Button';
import Avatar from '@/components/atoms/Avatar/Avatar';
import Badge from '@/components/atoms/Badge/Badge';
import Toast from '@/components/molecules/Toast/Toast';
import Spinner from '@/components/atoms/Spinner/Spinner';
import { api, uploadFile } from '@/lib/api';
import {
  CERTIFICATION_OPTIONS,
  EXPERIENCE_LEVELS,
  WORK_SITUATIONS,
  formatPhone,
  markOnboardingCompletedLocal,
} from '@/lib/onboarding';
import styles from './perfil.module.css';

function formatScore(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  return Number.isInteger(num) ? String(num) : num.toFixed(1);
}

export default function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [plan, setPlan] = useState('free');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [workSituation, setWorkSituation] = useState(WORK_SITUATIONS.EMPLOYED);
  const [bankName, setBankName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Iniciante');
  const [certification, setCertification] = useState('');
  const [certificationOther, setCertificationOther] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [weeklyGoal, setWeeklyGoal] = useState(5);
  const [stats, setStats] = useState({
    weeklyCompleted: 0,
    totalSimulations: 0,
    averageScore: 0,
    bestScore: 0,
    streakDays: 0,
    xpPoints: 0,
  });
  const [errors, setErrors] = useState({});

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((current) => ({ ...current, visible: false })), 3500);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, profileRes] = await Promise.all([
          api.get('/auth/me').catch(() => null),
          api.get('/profile').catch(() => null),
        ]);
        const me = meRes?.data || meRes || {};
        const profile = profileRes?.data || profileRes || me.profile || {};

        setFullName(profile.fullName || me.fullName || '');
        setEmail(profile.email || me.email || '');
        setWhatsapp(formatPhone(profile.whatsapp || me.whatsapp || ''));
        setWorkSituation(profile.workSituation || WORK_SITUATIONS.EMPLOYED);
        setBankName(profile.bankName || '');
        setRoleTitle(profile.roleTitle || '');
        setExperienceLevel(profile.experienceLevel || 'Iniciante');
        setCertification(profile.certification || '');
        setCertificationOther(profile.certificationOther || '');
        setAvatarUrl(profile.avatarUrl || me.avatarUrl || '');
        setWeeklyGoal(Number(profile.weeklyGoal) || 5);
        setPlan(me.plan || 'free');
        setStats({
          weeklyCompleted: Number(profile.weeklyCompleted) || 0,
          totalSimulations: Number(profile.totalSimulations) || 0,
          averageScore: Number(profile.averageScore) || 0,
          bestScore: Number(profile.bestScore) || 0,
          streakDays: Number(profile.streakDays) || 0,
          xpPoints: Number(profile.xpPoints) || 0,
        });
      } catch (err) {
        showToast(err.message || 'Não foi possível carregar o perfil.', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const initials = String(fullName || email || 'U')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const weeklyProgress = useMemo(() => {
    if (!weeklyGoal) return 0;
    return Math.min(100, Math.round((stats.weeklyCompleted / weeklyGoal) * 100));
  }, [stats.weeklyCompleted, weeklyGoal]);

  const situationLabel =
    workSituation === WORK_SITUATIONS.STUDYING
      ? certification === 'Outra'
        ? certificationOther || 'Estudando'
        : certification || 'Estudando'
      : roleTitle || 'Profissional';

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const url = await uploadFile(file);
      setAvatarUrl(url);
      showToast('Foto carregada com sucesso!', 'success');
    } catch (err) {
      showToast(err.message || 'Não foi possível fazer upload da foto.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const next = {};
    if (!fullName.trim()) next.fullName = 'Informe seu nome.';
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

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        whatsapp: whatsapp.replace(/\D/g, '') || null,
        workSituation,
        avatarUrl: avatarUrl || null,
        weeklyGoal: Number(weeklyGoal) || 5,
        bankName: workSituation === WORK_SITUATIONS.EMPLOYED ? bankName.trim() : null,
        roleTitle:
          workSituation === WORK_SITUATIONS.EMPLOYED
            ? roleTitle.trim()
            : certification === 'Outra'
              ? certificationOther.trim()
              : certification,
        experienceLevel:
          workSituation === WORK_SITUATIONS.EMPLOYED ? experienceLevel : 'Iniciante',
        certification: workSituation === WORK_SITUATIONS.STUDYING ? certification : null,
        certificationOther:
          workSituation === WORK_SITUATIONS.STUDYING && certification === 'Outra'
            ? certificationOther.trim()
            : null,
        onboardingCompleted: true,
      };

      const response = await api.put('/profile', payload);
      const profile = response?.data || response;

      markOnboardingCompletedLocal({
        fullName: profile.fullName || fullName.trim(),
        whatsapp: profile.whatsapp || whatsapp.replace(/\D/g, '') || null,
        avatarUrl: profile.avatarUrl || avatarUrl || null,
      });

      showToast('Perfil atualizado com sucesso.');
    } catch (err) {
      showToast(err.message || 'Não foi possível salvar o perfil.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner />
      </div>
    );
  }

  const statCards = [
    { key: 'sims', label: 'Simulações', value: stats.totalSimulations, tone: 'accent' },
    { key: 'avg', label: 'Média', value: formatScore(stats.averageScore), tone: 'gold' },
    { key: 'best', label: 'Melhor score', value: formatScore(stats.bestScore), tone: 'success' },
    { key: 'xp', label: 'XP', value: stats.xpPoints, tone: 'violet' },
    { key: 'streak', label: 'Sequência', value: `${stats.streakDays} dias`, tone: 'info' },
  ];

  const goalPresets = [5, 8, 10, 12, 15, 20];

  return (
    <div className={styles.page}>
      <section className={styles.identity}>
        <div className={styles.identityMain}>
          <div className={styles.avatarWrap}>
            <Avatar size="xl" src={avatarUrl || undefined} initials={initials || 'U'} />
            <label className={styles.photoBtn}>
              Foto
              <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
            </label>
          </div>

          <div className={styles.identityText}>
            <p className={styles.eyebrow}>Perfil</p>
            <h2 className={styles.name}>{fullName || 'Seu nome'}</h2>
            <p className={styles.email}>{email}</p>
            <div className={styles.badgeRow}>
              <Badge variant="accent">{situationLabel}</Badge>
              <Badge variant="default">{experienceLevel}</Badge>
              <Link href="/plano" className={styles.planLink}>
                <Badge variant="gold">{String(plan).toUpperCase()}</Badge>
                <span>Gerenciar plano</span>
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.identityAside}>
          <span className={styles.asideLabel}>Este mês</span>
          <strong className={styles.asideValue}>
            {stats.weeklyCompleted}/{weeklyGoal}
          </strong>
          <span className={styles.asideHint}>simulações na meta</span>
        </div>
      </section>

      <section className={styles.statsGrid} aria-label="Estatísticas">
        {statCards.map((stat) => (
          <article key={stat.key} className={[styles.statCard, styles[`tone_${stat.tone}`]].join(' ')}>
            <p className={styles.statValue}>{stat.value}</p>
            <p className={styles.statLabel}>{stat.label}</p>
          </article>
        ))}
      </section>

      <div className={styles.mainGrid}>
        <section className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>Meta mensal de simulações</h3>
              <p className={styles.panelDesc}>Defina quantas simulações quer completar por mês.</p>
            </div>
            <span className={styles.goalNumber}>{weeklyGoal}</span>
          </header>

          <div className={styles.goalBody}>
            <div className={styles.presetRow} role="group" aria-label="Atalhos de meta">
              {goalPresets.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={[
                    styles.presetChip,
                    weeklyGoal === value ? styles.presetChipActive : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setWeeklyGoal(value)}
                >
                  {value}
                </button>
              ))}
            </div>

            <div className={styles.sliderBlock}>
              <input
                type="range"
                min={1}
                max={20}
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(Number(e.target.value))}
                className={styles.slider}
                aria-label="Meta mensal de simulações"
              />
              <div className={styles.sliderHints}>
                <span>1</span>
                <span>20</span>
              </div>
            </div>

            <div className={styles.progressBlock}>
              <div className={styles.progressTop}>
                <span>Progresso do mês</span>
                <strong>{weeklyProgress}%</strong>
              </div>
              <div className={styles.progressTrack} aria-hidden="true">
                <span className={styles.progressFill} style={{ width: `${weeklyProgress}%` }} />
              </div>
              <div className={styles.progressMeta}>
                <span>{stats.weeklyCompleted} de {weeklyGoal} concluídas</span>
                <span>{Math.max(weeklyGoal - stats.weeklyCompleted, 0)} restantes</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>Dados da conta</h3>
              <p className={styles.panelDesc}>Nome e contato usados na plataforma.</p>
            </div>
          </header>

          <div className={styles.accountGrid}>
            <FormField
              id="perfil-name"
              label="Nome"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              state={errors.fullName ? 'error' : 'default'}
              helperText={errors.fullName}
              className={styles.spanFull}
            />
            <FormField
              id="perfil-email"
              label="E-mail"
              value={email}
              disabled
              helperText="Não pode ser alterado por aqui"
            />
            <FormField
              id="perfil-whatsapp"
              label="WhatsApp"
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              helperText="Opcional"
            />
          </div>
        </section>

        <section className={[styles.panel, styles.panelWide].join(' ')}>
          <header className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>Situação profissional</h3>
              <p className={styles.panelDesc}>Atualize como você atua ou estuda no mercado.</p>
            </div>
          </header>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Situação atual</legend>
            <div className={styles.optionRow}>
              <button
                type="button"
                className={[
                  styles.option,
                  workSituation === WORK_SITUATIONS.EMPLOYED ? styles.optionActive : '',
                ].filter(Boolean).join(' ')}
                onClick={() => setWorkSituation(WORK_SITUATIONS.EMPLOYED)}
              >
                Trabalho atualmente
              </button>
              <button
                type="button"
                className={[
                  styles.option,
                  workSituation === WORK_SITUATIONS.STUDYING ? styles.optionActive : '',
                ].filter(Boolean).join(' ')}
                onClick={() => setWorkSituation(WORK_SITUATIONS.STUDYING)}
              >
                Estudando para entrar
              </button>
            </div>
          </fieldset>

          {workSituation === WORK_SITUATIONS.EMPLOYED ? (
            <div className={styles.workGrid}>
              <FormField
                id="perfil-bank"
                label="Instituição"
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                state={errors.bankName ? 'error' : 'default'}
                helperText={errors.bankName}
              />
              <FormField
                id="perfil-role"
                label="Cargo/função"
                required
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                state={errors.roleTitle ? 'error' : 'default'}
                helperText={errors.roleTitle}
              />
              <fieldset className={[styles.fieldset, styles.spanFull].join(' ')}>
                <legend className={styles.legend}>Nível de experiência</legend>
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
          ) : (
            <div className={styles.formStack}>
              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Certificação</legend>
                <div className={styles.optionGrid}>
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
                  id="perfil-cert-other"
                  label="Qual certificação?"
                  required
                  value={certificationOther}
                  onChange={(e) => setCertificationOther(e.target.value)}
                  state={errors.certificationOther ? 'error' : 'default'}
                  helperText={errors.certificationOther}
                />
              )}
            </div>
          )}

          <div className={styles.panelSaveRow}>
            <p className={styles.footerHint}>Meta, dados e situação são salvos juntos.</p>
            <Button variant="primary" size="lg" loading={saving} onClick={handleSave}>
              Salvar perfil
            </Button>
          </div>
        </section>
      </div>

      {toast.visible && (
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((current) => ({ ...current, visible: false }))}
        />
      )}
    </div>
  );
}
