export function parsePlanPrice(price) {
  if (price === null || price === undefined || price === '') return null;
  const value = Number(price);
  return Number.isFinite(value) ? value : null;
}

export function isFreePlan(plan) {
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

export function formatPlanPrice(price) {
  const value = parsePlanPrice(price);
  if (value === null || value <= 0) return 'Grátis';
  return Number.isInteger(value)
    ? `R$ ${value}`
    : `R$ ${value.toFixed(2).replace('.', ',')}`;
}

export function normalizePlan(plan) {
  if (!plan) return null;
  return {
    id: plan.id,
    key: plan.key,
    name: plan.name,
    price: plan.price,
    limitSimulations: plan.limit_simulations ?? plan.limitSimulations,
    features: Array.isArray(plan.features) ? plan.features : [],
    permissions: Array.isArray(plan.permissions) ? plan.permissions : [],
  };
}

export function planRank(plan) {
  const price = parsePlanPrice(plan?.price);
  if (price === null) return 0;
  return price;
}

export function comparePlanAction(currentPlan, targetPlan) {
  if (!targetPlan) return 'none';
  if (!currentPlan) return isFreePlan(targetPlan) ? 'activate' : 'upgrade';
  if (currentPlan.key === targetPlan.key) return 'current';

  const currentRank = planRank(currentPlan);
  const targetRank = planRank(targetPlan);

  if (targetRank > currentRank) return 'upgrade';
  if (targetRank < currentRank) return 'downgrade';
  return 'switch';
}
