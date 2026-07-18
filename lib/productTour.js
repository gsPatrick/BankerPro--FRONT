export const PRODUCT_TOUR_STORAGE_KEY = 'bankerpro_product_tour_completed';

export function isProductTourCompleted() {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(PRODUCT_TOUR_STORAGE_KEY) === 'true';
}

export function markProductTourCompleted() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PRODUCT_TOUR_STORAGE_KEY, 'true');
}

export function clearProductTourLocal() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PRODUCT_TOUR_STORAGE_KEY);
}

/**
 * Passos do tour guiado da plataforma.
 * `targets`: data-tour candidates — usa o primeiro visível.
 */
export const PRODUCT_TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Este é o seu Início',
    body: 'Aqui você acompanha carteira, metas, agenda e o que merece atenção no dia.',
    targets: ['tour-home-banner'],
    placement: 'bottom',
  },
  {
    id: 'cenarios',
    title: 'Treine em Cenários',
    body: 'Simule abordagens com IA, pratique objeções e receba feedback da condução.',
    targets: ['tour-nav-cenarios'],
    placement: 'right',
  },
  {
    id: 'copiloto',
    title: 'Copiloto IA',
    body: 'Na hora H, use o copiloto para roteiro de abertura, diagnóstico e fechamento.',
    targets: ['tour-nav-copiloto'],
    placement: 'right',
  },
  {
    id: 'oportunidades',
    title: 'Lista de Oportunidades',
    body: 'Roteiros prontos por produto e perfil — sem improvisar na ligação.',
    targets: ['tour-nav-oportunidades'],
    placement: 'right',
  },
  {
    id: 'gestao',
    title: 'Carteira, agenda e metas',
    body: 'Organize clientes, compromissos e objetivos. No celular, esses itens ficam em Mais.',
    targets: ['tour-nav-carteira', 'tour-nav-mais'],
    placement: 'right',
  },
  {
    id: 'conta',
    title: 'Sua conta',
    body: 'Perfil, plano e configurações ficam aqui. Você pode refazer este tour depois se precisar.',
    targets: ['tour-user-menu'],
    placement: 'bottom',
  },
];
