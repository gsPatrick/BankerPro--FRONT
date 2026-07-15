'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Avatar from '@/components/atoms/Avatar/Avatar';
import Badge from '@/components/atoms/Badge/Badge';
import Button from '@/components/atoms/Button/Button';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import Pagination from '@/components/molecules/Pagination/Pagination';
import { api } from '@/lib/api';
import { pickField } from '@/lib/normalize';
import styles from './ranking.module.css';

function normalizeRankEntry(raw = {}) {
  return {
    userId: pickField(raw, 'userId', 'user_id'),
    userEmail: pickField(raw, 'userEmail', 'user_email') || '',
    userName: pickField(raw, 'userName', 'user_name') || '',
    roleTitle: pickField(raw, 'roleTitle', 'role_title') || 'Bancário',
    totalSimulations: Number(
      pickField(raw, 'totalSimulations', 'total_simulations') || 0
    ),
    averageScore: Number(pickField(raw, 'averageScore', 'average_score') || 0),
    xpPoints: Number(pickField(raw, 'xpPoints', 'xp_points') || 0),
  };
}

function formatScore(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  return Number.isInteger(num) ? String(num) : num.toFixed(1);
}

function initialsFrom(name, email) {
  const source = String(name || email || 'U').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function displayName(entry) {
  return entry?.userName || entry?.userEmail || 'Bancário';
}

function rankClass(rank) {
  if (rank === 1) return styles.rank1;
  if (rank === 2) return styles.rank2;
  if (rank === 3) return styles.rank3;
  return '';
}

function GhostBlock({ className = '' }) {
  return <div className={`${styles.ghostPulse} ${className}`} aria-hidden="true" />;
}

function GhostRow() {
  return (
    <div className={`${styles.row} ${styles.ghost}`} aria-hidden="true">
      <GhostBlock className={styles.ghostRank} />
      <div className={styles.player}>
        <GhostBlock className={styles.ghostAvatarSm} />
        <div className={styles.playerCopy}>
          <GhostBlock className={styles.ghostLine} />
          <GhostBlock className={styles.ghostLineSm} />
        </div>
      </div>
      <GhostBlock className={styles.ghostNum} />
      <GhostBlock className={styles.ghostNum} />
      <GhostBlock className={styles.ghostNum} />
    </div>
  );
}

export default function RankingPage() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [me, setMe] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((current) => ({ ...current, visible: false })), 3500);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [rankRes, meRes, profileRes] = await Promise.all([
          api.get('/ranking'),
          api.get('/auth/me').catch(() => null),
          api.get('/profile').catch(() => null),
        ]);

        const list = (rankRes?.data || rankRes || []).map(normalizeRankEntry);
        const active = list.filter((item) => item.totalSimulations > 0 || item.xpPoints > 0);
        setEntries(active.length > 0 ? active : list);

        const meData = meRes?.data || meRes || {};
        const profile = profileRes?.data || profileRes || meData.profile || {};
        setMe({
          id: meData.id || null,
          fullName: profile.fullName || meData.fullName || '',
          email: profile.email || meData.email || '',
          avatarUrl: profile.avatarUrl || meData.avatarUrl || '',
          roleTitle: profile.roleTitle || '',
          streakDays: pickField(profile, 'streakDays', 'streak_days') || 0,
          bestScore: pickField(profile, 'bestScore', 'best_score') || 0,
        });
      } catch (err) {
        showToast(err.message || 'Não foi possível carregar as informações do ranking.', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const meId = me?.id || null;

  const myEntry = useMemo(() => {
    if (!meId) return null;
    const index = entries.findIndex((item) => item.userId === meId);
    if (index >= 0) {
      return { ...entries[index], rank: index + 1 };
    }
    return {
      userId: meId,
      userEmail: me?.email || '',
      userName: me?.fullName || 'Bancário',
      roleTitle: me?.roleTitle || 'Bancário',
      totalSimulations: 0,
      averageScore: 0,
      xpPoints: 0,
      rank: 1
    };
  }, [entries, meId, me]);

  const filteredEntries = useMemo(() => {
    if (!myEntry) return [];
    return [myEntry];
  }, [myEntry]);

  const hasData = filteredEntries.length > 0;

  const bannerName = me?.fullName || myEntry?.userName || 'Seu nome';
  const bannerEmail = me?.email || myEntry?.userEmail || '';
  const bannerRole = myEntry?.roleTitle || me?.roleTitle || 'Bancário';
  const bannerInitials = initialsFrom(bannerName, bannerEmail);

  const stats = [
    {
      key: 'xp',
      label: 'Seu XP',
      value: myEntry ? String(myEntry.xpPoints) : '0',
      tone: 'gold',
    },
    {
      key: 'avg',
      label: 'Média de nota',
      value: myEntry ? formatScore(myEntry.averageScore) : '0',
      tone: 'accent',
    },
    {
      key: 'sims',
      label: 'Simulações',
      value: myEntry ? String(myEntry.totalSimulations) : '0',
      tone: 'success',
    },
    {
      key: 'best',
      label: 'Melhor nota',
      value: me?.bestScore !== undefined ? formatScore(me.bestScore) : '0',
      tone: 'info',
    },
  ];

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.identity}>
        <div className={styles.identityMain}>
          {me || myEntry ? (
            <Avatar
              size="xl"
              src={me?.avatarUrl || undefined}
              initials={bannerInitials}
            />
          ) : (
            <GhostBlock className={styles.ghostAvatar} />
          )}

          <div className={styles.identityText}>
            <p className={styles.eyebrow}>Progresso</p>
            {me || myEntry ? (
              <>
                <h2 className={styles.name}>{bannerName}</h2>
                <p className={styles.email}>{bannerEmail || bannerRole}</p>
                <div className={styles.badgeRow}>
                  <Badge variant="accent">{bannerRole}</Badge>
                  <Badge variant="gold">{myEntry?.xpPoints || 0} XP</Badge>
                  <Badge variant="default">Perfil Individual</Badge>
                </div>
              </>
            ) : (
              <div className={styles.ghost}>
                <GhostBlock className={styles.ghostLine} />
                <GhostBlock className={styles.ghostLineSm} />
              </div>
            )}
          </div>
        </div>

        <div className={styles.identityAside}>
          <span className={styles.asideLabel}>Ofensiva</span>
          <strong className={styles.asideValue}>
            {me?.streakDays || 0} 🔥
          </strong>
          <span className={styles.asideHint}>
            Treine diariamente para manter seu fogo ativo!
          </span>
        </div>
      </section>

      <section className={styles.statsGrid} aria-label="Seus números no ranking">
        {stats.map((stat) => (
          <article
            key={stat.key}
            className={[styles.statCard, styles[`tone_${stat.tone}`]].filter(Boolean).join(' ')}
          >
            {hasData || myEntry ? (
              <p className={styles.statValue}>{stat.value}</p>
            ) : (
              <GhostBlock className={styles.ghostStat} />
            )}
            <p className={styles.statLabel}>{stat.label}</p>
          </article>
        ))}
      </section>

      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Minha Classificação</h2>
        <p className={styles.sectionHint}>Seu desempenho individual no Closer.IA</p>
      </div>

      <div className={styles.board}>
        <div className={styles.boardHead}>
          <span>#</span>
          <span>Bancário</span>
          <span className={styles.boardHeadRight}>Sims</span>
          <span className={styles.boardHeadRight}>Média</span>
          <span className={styles.boardHeadRight}>XP</span>
        </div>

        {hasData
          ? filteredEntries.map((entry) => {
              const actualRank = entry.rank || 1;
              return (
                <div
                  key={entry.userId || `${entry.userEmail}-${actualRank}`}
                  className={`${styles.row} ${styles.rowMe}`}
                >
                  <div className={[styles.rankCell, rankClass(actualRank)].filter(Boolean).join(' ')}>
                    {actualRank}
                  </div>
                  <div className={styles.player}>
                    <Avatar
                      size="sm"
                      initials={initialsFrom(entry.userName, entry.userEmail)}
                    />
                    <div className={styles.playerCopy}>
                      <p className={styles.playerName}>
                        {displayName(entry)}
                        <span className={styles.youTag}>você</span>
                      </p>
                      <p className={styles.playerMeta}>
                        {entry.roleTitle || 'Bancário'}
                      </p>
                    </div>
                  </div>
                  <div className={[styles.numCell, styles.numMuted, styles.numSims].join(' ')}>
                    {entry.totalSimulations}
                  </div>
                  <div className={[styles.numCell, styles.numMuted, styles.numAvg].join(' ')}>
                    {formatScore(entry.averageScore)}
                  </div>
                  <div className={styles.numCell}>{entry.xpPoints}</div>
                </div>
              );
            })
          : Array.from({ length: 1 }).map((_, index) => (
              <GhostRow key={`ghost-row-${index}`} />
            ))}
      </div>

      <div className={styles.actions} style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
        <Link href="/cenarios">
          <Button variant="primary">Fazer Nova Simulação</Button>
        </Link>
      </div>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((current) => ({ ...current, visible: false }))}
      />
    </div>
  );
}
