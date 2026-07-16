'use client';

/**
 * Shared platform navigation (sidebar desktop + bottom bar mobile)
 */

const iconProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function IconHome() {
  return (
    <svg {...iconProps}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg {...iconProps}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconHistory() {
  return (
    <svg {...iconProps}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function IconTrophy() {
  return (
    <svg {...iconProps}>
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4z" />
      <path d="M17 4h2a2 2 0 0 1 0 4h-2" />
      <path d="M7 4H5a2 2 0 0 0 0 4h2" />
    </svg>
  );
}

function IconBriefcase() {
  return (
    <svg {...iconProps}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg {...iconProps}>
      <path d="M3 3v18h18" />
      <path d="M7 14v4" />
      <path d="M12 10v8" />
      <path d="M17 6v12" />
    </svg>
  );
}

function IconNote() {
  return (
    <svg {...iconProps}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
    </svg>
  );
}

function IconSparkles() {
  return (
    <svg {...iconProps}>
      <path d="M12 3v3" />
      <path d="M5.2 7.2 7.3 9.3" />
      <path d="M18.8 7.2 16.7 9.3" />
      <circle cx="12" cy="14" r="7" />
      <path d="M9.5 14h5" />
      <path d="M12 11.5v5" />
    </svg>
  );
}

function IconLibrary() {
  return (
    <svg {...iconProps}>
      <path d="M4 4v16" />
      <path d="M8 4v16" />
      <path d="M12 4h6a2 2 0 0 1 2 2v14l-5-2-5 2V6a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg {...iconProps}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconCard() {
  return (
    <svg {...iconProps}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

function IconTerminal() {
  return (
    <svg {...iconProps}>
      <path d="M4 17 10 11 4 5" />
      <path d="M12 19h8" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}

function IconCpu() {
  return (
    <svg {...iconProps}>
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <path d="M9 1v4" />
      <path d="M15 1v4" />
      <path d="M9 19v4" />
      <path d="M15 19v4" />
      <path d="M1 9h4" />
      <path d="M1 15h4" />
      <path d="M19 9h4" />
      <path d="M19 15h4" />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg {...iconProps}>
      <path d="M12 2 2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg {...iconProps}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconMore() {
  return (
    <svg {...iconProps}>
      <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Full sidebar navigation */
export const PLATFORM_NAV_ITEMS = [
  { id: 'home', href: '/home', label: 'Painel', icon: <IconHome />, group: 'principal' },
  { id: 'cenarios', href: '/cenarios', label: 'Cenários', icon: <IconBook />, group: 'treino' },
  { id: 'historico', href: '/historico', label: 'Histórico', icon: <IconHistory />, group: 'treino' },
  { id: 'ranking', href: '/ranking', label: 'Ranking', icon: <IconTrophy />, group: 'treino' },
  { id: 'carteira', href: '/carteira', label: 'Carteira', icon: <IconBriefcase />, group: 'gestao' },
  { id: 'agenda', href: '/agenda', label: 'Agenda', icon: <IconCalendar />, group: 'gestao' },
  { id: 'metas', href: '/metas', label: 'Metas', icon: <IconChart />, group: 'gestao' },
  { id: 'anotacoes', href: '/anotacoes', label: 'Anotações', icon: <IconNote />, group: 'gestao' },
  { id: 'copiloto', href: '/copiloto', label: 'Copiloto IA', icon: <IconSparkles />, group: 'ia' },
  {
    id: 'oportunidades',
    href: '/oportunidades',
    label: 'Lista de Oportunidades',
    icon: <IconLibrary />,
    group: 'ia',
  },
  {
    id: 'admin-divider',
    type: 'divider',
    label: 'Administração',
    group: 'admin',
    adminOnly: true,
  },
  {
    id: 'admin-usuarios',
    href: '/admin/usuarios',
    label: 'Usuários',
    icon: <IconUsers />,
    group: 'admin',
    adminOnly: true,
  },
  {
    id: 'admin-financeiro',
    href: '/admin/financeiro',
    label: 'Financeiro',
    icon: <IconCard />,
    group: 'admin',
    adminOnly: true,
  },
  {
    id: 'admin-planos',
    href: '/admin/planos',
    label: 'Planos',
    icon: <IconCard />,
    group: 'admin',
    adminOnly: true,
  },
  {
    id: 'admin-cenarios',
    href: '/admin/cenarios',
    label: 'Cenários (Admin)',
    icon: <IconBook />,
    group: 'admin',
    adminOnly: true,
  },
  {
    id: 'admin-oportunidades',
    href: '/admin/oportunidades',
    label: 'Oportunidades',
    icon: <IconLayers />,
    group: 'admin',
    adminOnly: true,
  },
  {
    id: 'admin-conhecimento',
    href: '/admin/conhecimento',
    label: 'Conhecimento',
    icon: <IconLibrary />,
    group: 'admin',
    adminOnly: true,
  },
  {
    id: 'admin-prompts',
    href: '/admin/prompts',
    label: 'Prompts',
    icon: <IconTerminal />,
    group: 'admin',
    adminOnly: true,
  },
  {
    id: 'admin-config',
    href: '/admin/configuracoes',
    label: 'Config. Admin',
    icon: <IconSettings />,
    group: 'admin',
    adminOnly: true,
  },
  {
    id: 'admin-agente',
    href: '/admin/agente',
    label: 'Auto-Gestor IA',
    icon: <IconCpu />,
    group: 'admin',
    adminOnly: true,
  },
  { id: 'perfil', href: '/perfil', label: 'Perfil', icon: <IconUser />, group: 'conta' },
];

export const PLATFORM_MOBILE_PRIMARY_IDS = [
  'home',
  'cenarios',
  'copiloto',
  'oportunidades',
  'mais',
];

export const PLATFORM_MORE_ITEM = {
  id: 'mais',
  href: '#mais',
  label: 'Mais',
  icon: <IconMore />,
};

// Itens cujo id é também a key da permissão no plano. Painel e Perfil ficam de
// fora de propósito: são sempre liberados.
const PERMISSION_GATED_IDS = [
  'cenarios',
  'historico',
  'ranking',
  'carteira',
  'agenda',
  'metas',
  'anotacoes',
  'copiloto',
  'oportunidades',
];

export function getVisibleNavItems(userRole = 'user', permissions = null) {
  const isAdmin = userRole === 'admin';
  return PLATFORM_NAV_ITEMS.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (isAdmin) return true;
    // permissions null = ainda carregando; mostrar tudo evita o menu piscar.
    // Quem realmente bloqueia é a API, então não há risco em mostrar aqui.
    if (permissions === null) return true;
    if (!PERMISSION_GATED_IDS.includes(item.id)) return true;
    return permissions.includes(item.id);
  });
}

export function getMobilePrimaryItems(userRole = 'user', permissions = null) {
  const visible = getVisibleNavItems(userRole, permissions).filter(
    (item) => item.type !== 'divider'
  );
  return PLATFORM_MOBILE_PRIMARY_IDS.map((id) => {
    if (id === 'mais') return { ...PLATFORM_MORE_ITEM };
    const item = visible.find((entry) => entry.id === id);
    if (!item) return null;
    return {
      ...item,
      center: id === 'copiloto',
    };
  }).filter(Boolean);
}

export function getMobileSecondaryItems(userRole = 'user', permissions = null) {
  const primary = new Set(PLATFORM_MOBILE_PRIMARY_IDS.filter((id) => id !== 'mais'));
  return getVisibleNavItems(userRole, permissions).filter(
    (item) => item.type !== 'divider' && !primary.has(item.id)
  );
}

export function getActiveNavId(pathname) {
  if (!pathname) return 'home';

  if (/^\/simulacao\/[^/]+\/resultado/.test(pathname)) return 'historico';
  if (/^\/simulacao\//.test(pathname)) return 'cenarios';

  if (pathname === '/admin' || pathname === '/admin/') return 'admin-usuarios';
  if (pathname === '/treinamento' || pathname.startsWith('/treinamento/')) {
    return 'admin-cenarios';
  }

  const match = PLATFORM_NAV_ITEMS.filter((item) => item.href).find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  return match?.id || 'home';
}

/**
 * Header context: root pages show title; nested flows show back + local title.
 */
export function getShellContext(pathname = '') {
  if (/^\/simulacao\/[^/]+\/resultado\/?$/.test(pathname)) {
    return {
      isRoot: false,
      title: 'Resultado',
      subtitle: 'Simulação concluída',
      backHref: '/historico',
    };
  }

  if (/^\/simulacao\/[^/]+\/?$/.test(pathname)) {
    return {
      isRoot: false,
      title: 'Atendimento',
      subtitle: 'Simulação',
      backHref: '/cenarios',
    };
  }

  return {
    isRoot: true,
    title: null,
    subtitle: null,
    backHref: null,
  };
}

export function getNavItemById(id) {
  if (id === 'mais') return PLATFORM_MORE_ITEM;
  return PLATFORM_NAV_ITEMS.find((item) => item.id === id) || PLATFORM_NAV_ITEMS[0];
}
