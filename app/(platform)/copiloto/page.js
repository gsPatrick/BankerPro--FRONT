'use client';

import { useEffect, useState } from 'react';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import { api } from '@/lib/api';
import { pickField } from '@/lib/normalize';
import styles from './copiloto.module.css';

const EXAMPLES = [
  {
    label: 'Sem crédito',
    text: 'Cliente 35 anos, casado, renda R$ 5.000. Quer comprar um lote, mas está sem margem de crédito liberada no banco.',
  },
  {
    label: 'Cross-sell',
    text: 'Cliente já tem conta e cartão. Tem dois filhos e falou que se preocupa com o futuro da família. Renda estável.',
  },
  {
    label: 'Oferta fria',
    text: 'Cliente entrou na agência só para tirar extrato. Não pediu nada. Quero iniciar uma conversa comercial sem forçar.',
  },
];

function asText(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

function asList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value ? [value] : [];
  return [];
}

function normalizeSolution(raw) {
  if (!raw || typeof raw !== 'object') {
    return { produto: asText(raw), porQueAtende: '', porQueRelacionamento: '' };
  }
  return {
    produto: asText(pickField(raw, 'produto', 'product')) || '—',
    porQueAtende: asText(pickField(raw, 'porQueAtende', 'por_que_atende')),
    porQueRelacionamento: asText(
      pickField(raw, 'porQueRelacionamento', 'por_que_relacionamento')
    ),
  };
}

function normalizeScript(raw) {
  const obj = raw && typeof raw === 'object' ? raw : {};
  return {
    abertura: asText(pickField(obj, 'abertura', 'opening')),
    diagnostico: asText(pickField(obj, 'diagnostico', 'diagnosis')),
    ofertaPrincipal: asText(pickField(obj, 'ofertaPrincipal', 'oferta_principal')),
    transicaoCrossSell: asText(
      pickField(obj, 'transicaoCrossSell', 'transicao_cross_sell')
    ),
    fechamento: asText(pickField(obj, 'fechamento', 'closing')),
  };
}

function normalizeObjections(list) {
  return asList(list)
    .map((item) => {
      if (typeof item === 'string') {
        return { objecao: item, resposta: '' };
      }
      return {
        objecao: asText(pickField(item, 'objecao', 'objection')) || 'Objeção',
        resposta:
          asText(
            pickField(
              item,
              'contorno',
              'respostaCurta',
              'resposta_curta',
              'resposta'
            )
          ) || asText(pickField(item, 'seContinuarResistente', 'se_continuar_resistente')),
      };
    })
    .filter((item) => item.objecao);
}

function normalizeExtras(list) {
  return asList(list)
    .map((item) => {
      if (typeof item === 'string') return { title: item, detail: '' };
      return {
        title:
          asText(pickField(item, 'produto', 'product', 'title', 'cenario', 'cenário')) ||
          'Oportunidade',
        detail: asText(
          pickField(
            item,
            'sinalAderencia',
            'sinal_aderencia',
            'quandoOferecer',
            'quando_oferecer',
            'script',
            'detail'
          )
        ),
      };
    })
    .filter((item) => item.title);
}

function normalizePlan(raw = {}) {
  const source = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
  return {
    modo: asText(pickField(source, 'modoNegociacao', 'modo_negociacao')) || 'Análise',
    estrategia: asText(pickField(source, 'estrategia', 'strategy')),
    necessidade: asText(
      pickField(source, 'necessidadePrincipal', 'necessidade_principal')
    ),
    solucao: normalizeSolution(pickField(source, 'solucaoPrincipal', 'solucao_principal')),
    oportunidades: normalizeExtras(
      pickField(source, 'oportunidadesAdicionais', 'oportunidades_adicionais')
    ),
    melhorCombinacao: asText(
      pickField(source, 'melhorCombinacao', 'melhor_combinacao')
    ),
    comoOferecer: asText(pickField(source, 'comoOferecer', 'como_oferecer')),
    roteiro: normalizeScript(pickField(source, 'roteiroVenda', 'roteiro_venda')),
    cronograma: asList(
      pickField(source, 'cronogramaNegociacao', 'cronograma_negociacao')
    ).map((step, index) => {
      if (typeof step === 'string') {
        return { title: `Passo ${index + 1}`, detail: step };
      }
      return {
        title:
          asText(pickField(step, 'etapa', 'titulo', 'title')) || `Passo ${index + 1}`,
        detail: asText(
          pickField(
            step,
            'frasePronta',
            'frase_pronta',
            'acaoDoGerente',
            'acao_do_gerente',
            'objetivo',
            'detail'
          )
        ),
      };
    }),
    objecoes: normalizeObjections(
      pickField(source, 'tratamentoObjecoes', 'tratamento_objecoes')
    ),
    scriptsAlt: normalizeExtras(
      pickField(source, 'scriptsAlternativos', 'scripts_alternativos')
    ),
    planoB: asText(pickField(source, 'planoB', 'plano_b')),
    perguntas: asText(
      pickField(source, 'perguntasDiagnostico', 'perguntas_diagnostico')
    ),
    proximoPasso: asText(pickField(source, 'proximoPasso', 'proximo_passo')),
  };
}

function hasScript(roteiro) {
  return Object.values(roteiro || {}).some(Boolean);
}

export default function CopilotoPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'error',
  });

  useEffect(() => {
    if (!loading) {
      setElapsed(0);
      return undefined;
    }
    const started = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, [loading]);

  const showToast = (message, type = 'error') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((current) => ({ ...current, visible: false })), 3800);
  };

  const analyze = async () => {
    const situationText = input.trim();
    if (!situationText || loading) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/ai/copiloto/analyze', { situationText });
      const plan = normalizePlan(res?.data || res);
      setResult(plan);
    } catch (err) {
      showToast(err.message || 'Não foi possível analisar a situação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.banner}>
        <div className={styles.bannerInner}>
          <p className={styles.eyebrow}>IA</p>
          <h1 className={styles.title}>Copiloto comercial</h1>
          <p className={styles.subtitle}>
            Descreva a situação do cliente e receba modo de negociação, roteiro, objeções e
            próximo passo — pronto para usar no atendimento.
          </p>
        </div>
      </section>

      <section className={styles.composer}>
        <textarea
          className={styles.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ex.: Cliente quer um carro, tem renda de R$ 4.500, já negou financiamento e pediu uma opção sem crédito..."
          disabled={loading}
        />
        <div className={styles.composerFooter}>
          <div className={styles.chips}>
            {EXAMPLES.map((item) => (
              <button
                key={item.label}
                type="button"
                className={styles.chip}
                disabled={loading}
                onClick={() => setInput(item.text)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={styles.analyzeBtn}
            disabled={!input.trim() || loading}
            onClick={analyze}
          >
            {loading ? 'Analisando…' : 'Analisar situação'}
          </button>
        </div>
      </section>

      {loading ? (
        <div className={styles.analyzing}>
          <Spinner size="md" />
          <div className={styles.analyzingText}>
            <p className={styles.analyzingTitle}>Montando a abordagem</p>
            <p className={styles.analyzingHint}>
              Chamando a IA na API — costuma levar de 15 a 40 segundos.
              {elapsed > 0 ? ` ${elapsed}s` : ''}
            </p>
          </div>
        </div>
      ) : null}

      {result ? (
        <div className={styles.results}>
          <header className={styles.modeBar}>
            <p className={styles.modeLabel}>Modo detectado</p>
            <h2 className={styles.modeValue}>{result.modo}</h2>
            {result.estrategia ? (
              <p className={styles.modeStrategy}>{result.estrategia}</p>
            ) : null}
          </header>

          {(result.necessidade || result.solucao.produto) ? (
            <div className={styles.pair}>
              {result.necessidade ? (
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>Necessidade</h3>
                  <p className={styles.sectionBody}>{result.necessidade}</p>
                </section>
              ) : null}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Solução principal</h3>
                <p className={styles.sectionLead}>{result.solucao.produto}</p>
                {result.solucao.porQueAtende ? (
                  <p className={styles.sectionBody}>{result.solucao.porQueAtende}</p>
                ) : null}
                {result.solucao.porQueRelacionamento ? (
                  <p className={styles.sectionBody}>{result.solucao.porQueRelacionamento}</p>
                ) : null}
              </section>
            </div>
          ) : null}

          {result.melhorCombinacao ? (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Melhor combinação</h3>
              <p className={styles.sectionBody}>{result.melhorCombinacao}</p>
            </section>
          ) : null}

          {result.oportunidades.length > 0 ? (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Cross-sell</h3>
              <div className={styles.pillRow}>
                {result.oportunidades.map((item) => (
                  <span key={item.title} className={styles.pill}>
                    {item.title}
                  </span>
                ))}
              </div>
              {result.oportunidades.some((item) => item.detail) ? (
                <ul className={styles.itemList}>
                  {result.oportunidades
                    .filter((item) => item.detail)
                    .map((item) => (
                      <li key={`${item.title}-d`} className={styles.item}>
                        <strong>{item.title}</strong>
                        {item.detail}
                      </li>
                    ))}
                </ul>
              ) : null}
            </section>
          ) : null}

          {result.comoOferecer ? (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Como oferecer</h3>
              <p className={styles.sectionBody}>{result.comoOferecer}</p>
            </section>
          ) : null}

          {hasScript(result.roteiro) ? (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Roteiro de venda</h3>
              <ol className={styles.steps}>
                {[
                  ['Abertura', result.roteiro.abertura],
                  ['Diagnóstico', result.roteiro.diagnostico],
                  ['Oferta', result.roteiro.ofertaPrincipal],
                  ['Cross-sell', result.roteiro.transicaoCrossSell],
                  ['Fechamento', result.roteiro.fechamento],
                ]
                  .filter(([, text]) => text)
                  .map(([label, text], index) => (
                    <li key={label} className={styles.step}>
                      <span className={styles.stepNum}>{index + 1}</span>
                      <div>
                        <p className={styles.stepLabel}>{label}</p>
                        <p className={styles.stepText}>{text}</p>
                      </div>
                    </li>
                  ))}
              </ol>
            </section>
          ) : null}

          {(result.cronograma.length > 0 || result.objecoes.length > 0) ? (
            <div className={styles.pair}>
              {result.cronograma.length > 0 ? (
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>Cronograma</h3>
                  <ul className={styles.itemList}>
                    {result.cronograma.map((step) => (
                      <li key={`${step.title}-${step.detail}`} className={styles.item}>
                        <strong>{step.title}</strong>
                        {step.detail}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {result.objecoes.length > 0 ? (
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>Objeções</h3>
                  <ul className={styles.itemList}>
                    {result.objecoes.map((item) => (
                      <li key={item.objecao} className={styles.item}>
                        <strong>{item.objecao}</strong>
                        {item.resposta}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          ) : null}

          {result.scriptsAlt.length > 0 ? (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Scripts alternativos</h3>
              <ul className={styles.itemList}>
                {result.scriptsAlt.map((item) => (
                  <li key={`${item.title}-${item.detail}`} className={styles.item}>
                    <strong>{item.title}</strong>
                    {item.detail || null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {result.planoB ? (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Plano B</h3>
              <p className={styles.sectionBody}>{result.planoB}</p>
            </section>
          ) : null}

          {result.perguntas ? (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Perguntas de diagnóstico</h3>
              <p className={styles.sectionBody}>{result.perguntas}</p>
            </section>
          ) : null}

          {result.proximoPasso ? (
            <div className={styles.nextStep}>
              <p className={styles.nextLabel}>Próximo passo</p>
              <p className={styles.nextText}>{result.proximoPasso}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((current) => ({ ...current, visible: false }))}
      />
    </div>
  );
}
