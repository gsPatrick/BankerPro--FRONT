/** Pick first defined value among camelCase / snake_case keys. */
export function pickField(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return obj[key];
    }
  }
  return undefined;
}

export function normalizeScenario(raw = {}) {
  return {
    id: pickField(raw, 'id'),
    title: pickField(raw, 'title') || '',
    description: pickField(raw, 'description') || '',
    category: pickField(raw, 'category') || '',
    difficulty: pickField(raw, 'difficulty') || '',
    clientName: pickField(raw, 'clientName', 'client_name') || '',
    clientAge: pickField(raw, 'clientAge', 'client_age'),
    clientProfile: pickField(raw, 'clientProfile', 'client_profile') || '',
    clientPersona: pickField(raw, 'clientPersona', 'client_persona') || '',
    openingMessage: pickField(raw, 'openingMessage', 'opening_message') || '',
    userObjective: pickField(raw, 'userObjective', 'user_objective') || '',
    commercialClues: pickField(raw, 'commercialClues', 'commercial_clues') || '',
    mainProduct: pickField(raw, 'mainProduct', 'main_product') || '',
    supportProducts: pickField(raw, 'supportProducts', 'support_products') || '',
    evaluationCriteria:
      pickField(raw, 'evaluationCriteria', 'evaluation_criteria') || '',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
  };
}

function asStringList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/\n|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function normalizeOpportunity(raw = {}) {
  return {
    id: pickField(raw, 'id'),
    title: pickField(raw, 'title') || '',
    product: pickField(raw, 'product') || '',
    alternativeProduct:
      pickField(raw, 'alternativeProduct', 'alternative_product') || '',
    clientProfile: pickField(raw, 'clientProfile', 'client_profile') || '',
    ageRange: pickField(raw, 'ageRange', 'age_range') || '',
    incomeRange: pickField(raw, 'incomeRange', 'income_range') || '',
    balanceRange: pickField(raw, 'balanceRange', 'balance_range') || '',
    recommendedChannel:
      pickField(raw, 'recommendedChannel', 'recommended_channel') || '',
    objective: pickField(raw, 'objective') || '',
    openingScript: pickField(raw, 'openingScript', 'opening_script') || '',
    diagnosticQuestions: asStringList(
      pickField(raw, 'diagnosticQuestions', 'diagnostic_questions') ??
        raw.diagnosticQuestions ??
        raw.diagnostic_questions
    ),
    mainArgument: pickField(raw, 'mainArgument', 'main_argument') || '',
    objections: asStringList(
      pickField(raw, 'objections') ?? raw.objections
    ),
    objectionResponses: asStringList(
      pickField(raw, 'objectionResponses', 'objection_responses') ??
        raw.objectionResponses ??
        raw.objection_responses
    ),
    fallbackPlan: pickField(raw, 'fallbackPlan', 'fallback_plan') || '',
    closingScript: pickField(raw, 'closingScript', 'closing_script') || '',
    tags: asStringList(pickField(raw, 'tags') ?? raw.tags),
    status: pickField(raw, 'status') || 'Ativo',
  };
}

export function normalizeSimulation(raw = {}) {
  return {
    ...raw,
    id: pickField(raw, 'id'),
    scenarioId: pickField(raw, 'scenarioId', 'scenario_id'),
    scenarioTitle: pickField(raw, 'scenarioTitle', 'scenario_title') || '',
    scenarioCategory:
      pickField(raw, 'scenarioCategory', 'scenario_category') || '',
    status: pickField(raw, 'status') || '',
    messages: Array.isArray(raw.messages) ? raw.messages : [],
    durationMinutes: Number(
      pickField(raw, 'durationMinutes', 'duration_minutes') || 0
    ),
    scoreTotal: Number(pickField(raw, 'scoreTotal', 'score_total') || 0),
    scoreDiagnostico: Number(
      pickField(raw, 'scoreDiagnostico', 'score_diagnostico') || 0
    ),
    scoreArgumentacao: Number(
      pickField(raw, 'scoreArgumentacao', 'score_argumentacao') || 0
    ),
    scoreObjeccoes: Number(
      pickField(raw, 'scoreObjeccoes', 'score_objeccoes') || 0
    ),
    scoreCrossSell: Number(
      pickField(raw, 'scoreCrossSell', 'score_cross_sell') || 0
    ),
    scoreFechamento: Number(
      pickField(raw, 'scoreFechamento', 'score_fechamento') || 0
    ),
    pontosFortes: pickField(raw, 'pontosFortes', 'pontos_fortes') || '',
    oportunidadesMelhoria:
      pickField(raw, 'oportunidadesMelhoria', 'oportunidades_melhoria') || '',
    argumentosSugeridos:
      pickField(raw, 'argumentosSugeridos', 'argumentos_sugeridos') || '',
    feedback: pickField(raw, 'feedback') || '',
    createdAt: pickField(raw, 'createdAt', 'created_at', 'created_date'),
    updatedAt: pickField(raw, 'updatedAt', 'updated_at', 'updated_date'),
    scenario: raw.scenario
      ? normalizeScenario(raw.scenario)
      : raw.scenario,
  };
}
