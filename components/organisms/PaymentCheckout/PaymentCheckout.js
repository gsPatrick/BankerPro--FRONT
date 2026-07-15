'use client';

import { useEffect, useState, useRef } from 'react';
import Button from '@/components/atoms/Button/Button';
import FormField from '@/components/molecules/FormField/FormField';
import Modal from '@/components/organisms/Modal/Modal';
import Spinner from '@/components/atoms/Spinner/Spinner';
import { api } from '@/lib/api';
import styles from './PaymentCheckout.module.css';

function loadMercadoPagoSdk() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Ambiente inválido para carregar o Mercado Pago.'));
      return;
    }

    if (window.MercadoPago) {
      resolve(window.MercadoPago);
      return;
    }

    const existing = document.querySelector('script[data-mp-sdk="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.MercadoPago));
      existing.addEventListener('error', () => reject(new Error('Falha ao carregar SDK do Mercado Pago.')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.dataset.mpSdk = 'true';
    script.onload = () => resolve(window.MercadoPago);
    script.onerror = () => reject(new Error('Falha ao carregar SDK do Mercado Pago.'));
    document.body.appendChild(script);
  });
}

function formatPlanPrice(price) {
  const value = Number(price);
  if (!Number.isFinite(value) || value <= 0) return 'Grátis';
  return Number.isInteger(value)
    ? `R$ ${value}`
    : `R$ ${value.toFixed(2).replace('.', ',')}`;
}

/**
 * Transparent Mercado Pago checkout (card + PIX) for a selected paid plan.
 */
export default function PaymentCheckout({
  isOpen,
  plan,
  onClose,
  onSuccess,
  onError,
}) {
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [docType, setDocType] = useState('CPF');
  const [docNumber, setDocNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [processing, setProcessing] = useState(false);
  const [pixResult, setPixResult] = useState(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mpPublicKey, setMpPublicKey] = useState('');
  const successNotifiedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    setPaymentMethod('credit_card');
    setDocType('CPF');
    setDocNumber('');
    setCardholderName('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setPixResult(null);
    setCopiedPix(false);
    setSuccess(false);
    setProcessing(false);
    successNotifiedRef.current = false;

    let cancelled = false;
    (async () => {
      try {
        const [configRes] = await Promise.all([
          api.get('/subscription/checkout-config'),
          loadMercadoPagoSdk().catch(() => null),
        ]);
        if (!cancelled) {
          setMpPublicKey(configRes?.data?.public_key || configRes?.data?.publicKey || '');
        }
      } catch {
        // Key may still come from env fallback later; keep empty and validate on submit
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, plan?.key]);

  useEffect(() => {
    if (!pixResult?.paymentId || success) return undefined;

    const interval = window.setInterval(async () => {
      try {
        const response = await api.get(`/subscription/payment/${pixResult.paymentId}`);
        if (response?.data?.activated || response?.data?.status === 'approved') {
          if (!successNotifiedRef.current) {
            successNotifiedRef.current = true;
            setSuccess(true);
            onSuccess?.('pix');
          }
        }
      } catch {
        // Keep polling while payment is pending
      }
    }, 4000);

    return () => window.clearInterval(interval);
  }, [pixResult?.paymentId, success, onSuccess]);

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const parts = [];
    for (let i = 0; i < val.length; i += 4) {
      parts.push(val.substring(i, i + 4));
    }
    setCardNumber(parts.join(' '));
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) {
      setCardExpiry(`${val.substring(0, 2)}/${val.substring(2)}`);
    } else {
      setCardExpiry(val);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (processing || !plan) return;
    setProcessing(true);

    try {
      const cleanDoc = docNumber.replace(/\D/g, '');
      if (!cleanDoc) {
        throw new Error('CPF ou CNPJ é obrigatório.');
      }

      if (paymentMethod === 'credit_card') {
        if (!cardholderName || !cardNumber || !cardExpiry || !cardCvv) {
          throw new Error('Preencha todos os campos do cartão.');
        }

        const [expiryMonth, expiryYear] = cardExpiry.split('/');
        if (!expiryMonth || !expiryYear || expiryYear.length !== 2) {
          throw new Error('Validade do cartão incorreta (MM/AA).');
        }

        const publicKey =
          mpPublicKey ||
          process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ||
          '';

        if (!publicKey) {
          throw new Error('Chave pública do Mercado Pago não configurada.');
        }

        await loadMercadoPagoSdk();
        if (!window.MercadoPago) {
          throw new Error('SDK do Mercado Pago não carregado. Tente novamente.');
        }

        const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' });
        const cardTokenResponse = await mp.createCardToken({
          cardNumber: cardNumber.replace(/\s/g, ''),
          cardholderName,
          cardExpirationMonth: expiryMonth,
          cardExpirationYear: `20${expiryYear}`,
          securityCode: cardCvv,
          identificationType: docType,
          identificationNumber: cleanDoc,
        });

        if (!cardTokenResponse?.id) {
          throw new Error('Falha ao validar os dados do cartão.');
        }

        const response = await api.post('/subscription/checkout', {
          planType: plan.key,
          paymentMethod: 'credit_card',
          cardToken: cardTokenResponse.id,
          docNumber: cleanDoc,
          docType,
        });

        const status = response?.data?.status;
        const activated = response?.data?.activated;
        if (activated || status === 'authorized' || status === 'active' || response?.data?.id) {
          if (!successNotifiedRef.current) {
            successNotifiedRef.current = true;
            setSuccess(true);
            onSuccess?.('credit_card');
          }
        } else {
          throw new Error('O pagamento do cartão foi recusado pelo emissor.');
        }
      } else {
        const response = await api.post('/subscription/checkout', {
          planType: plan.key,
          paymentMethod: 'pix',
          docNumber: cleanDoc,
          docType,
        });

        const transactionData =
          response?.data?.point_of_interaction?.transaction_data ||
          response?.data?.pointOfInteraction?.transaction_data ||
          {};

        const qrCodeBase64 =
          response?.data?.qr_code_base64 ||
          response?.data?.qrCodeBase64 ||
          transactionData.qr_code_base64 ||
          null;
        const qrCodeCopy =
          response?.data?.qr_code_copy ||
          response?.data?.qrCodeCopy ||
          transactionData.qr_code ||
          transactionData.qr_code_copy ||
          null;
        const paymentId = response?.data?.id;

        if (!paymentId || (!qrCodeBase64 && !qrCodeCopy)) {
          throw new Error('Não foi possível gerar o PIX. Tente novamente.');
        }

        setPixResult({
          paymentId,
          qrCodeBase64,
          qrCodeCopy,
        });
      }
    } catch (err) {
      onError?.(err.message || 'Erro ao processar pagamento.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCopyPix = async () => {
    if (!pixResult?.qrCodeCopy) return;
    try {
      await navigator.clipboard.writeText(pixResult.qrCodeCopy);
      setCopiedPix(true);
      window.setTimeout(() => setCopiedPix(false), 2000);
    } catch {
      onError?.('Não foi possível copiar o código PIX.');
    }
  };

  if (!plan) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={processing ? () => {} : onClose}
      title={success ? 'Pagamento confirmado' : `Assinar ${plan.name}`}
      size="lg"
    >
      {success ? (
        <div className={styles.successState}>
          <div className={styles.successIcon}>✓</div>
          <p className={styles.successText}>
            Seu plano <strong>{plan.name}</strong> foi ativado. Entrando na plataforma...
          </p>
          <Spinner size="md" />
        </div>
      ) : pixResult ? (
        <div className={styles.pixState}>
          <p className={styles.pixHint}>
            Escaneie o QR Code ou copie o código PIX. A confirmação é automática após o pagamento.
          </p>

          {pixResult.qrCodeBase64 ? (
            <div className={styles.qrWrap}>
              <img
                src={`data:image/png;base64,${pixResult.qrCodeBase64}`}
                alt="QR Code PIX"
                className={styles.qrImage}
              />
            </div>
          ) : (
            <div className={styles.qrPlaceholder}>
              Use o código copia e cola abaixo para pagar.
            </div>
          )}

          {pixResult.qrCodeCopy && (
            <div className={styles.copyRow}>
              <code className={styles.copyCode}>{pixResult.qrCodeCopy}</code>
              <Button variant="secondary" size="sm" type="button" onClick={handleCopyPix}>
                {copiedPix ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          )}

          <div className={styles.waitingRow}>
            <Spinner size="sm" />
            <span>Aguardando confirmação do pagamento...</span>
          </div>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.planSummary}>
            <span>{plan.name}</span>
            <strong>{formatPlanPrice(plan.price)}/mês</strong>
          </div>

          <div className={styles.methodTabs}>
            <button
              type="button"
              className={`${styles.methodTab} ${paymentMethod === 'credit_card' ? styles.methodTabActive : ''}`}
              onClick={() => setPaymentMethod('credit_card')}
            >
              <svg className={styles.methodIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              Cartão
            </button>
            <button
              type="button"
              className={`${styles.methodTab} ${paymentMethod === 'pix' ? styles.methodTabActive : ''}`}
              onClick={() => setPaymentMethod('pix')}
            >
              <svg className={styles.methodIcon} width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12.6 2.4c-.4-.4-1-.4-1.4 0L8.1 5.5c-.2.2-.2.5 0 .7l3.1 3.1c.4.4 1 .4 1.4 0l3.1-3.1c.2-.2.2-.5 0-.7l-3.1-3.1zM5.5 8.1L2.4 11.2c-.4.4-.4 1 0 1.4l3.1 3.1c.2.2.5.2.7 0l3.1-3.1c.4-.4.4-1 0-1.4L6.2 8.1c-.2-.2-.5-.2-.7 0zm12.8 0c-.2-.2-.5-.2-.7 0l-3.1 3.1c-.4.4-.4 1 0 1.4l3.1 3.1c.2.2.5.2.7 0l3.1-3.1c.4-.4.4-1 0-1.4L18.3 8.1zM12.6 15.7c-.4-.4-1-.4-1.4 0l-3.1 3.1c-.2.2-.2.5 0 .7l3.1 3.1c.4.4 1 .4 1.4 0l3.1-3.1c.2-.2.2-.5 0-.7l-3.1-3.1z" />
              </svg>
              PIX
            </button>
          </div>

          <div className={styles.docRow}>
            <label className={styles.docTypeLabel} htmlFor="payDocType">
              Tipo
              <select
                id="payDocType"
                className={styles.docTypeSelect}
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
              </select>
            </label>
            <FormField
              id="payDocNumber"
              label={docType}
              placeholder={docType === 'CPF' ? '00000000000' : '00000000000000'}
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value.replace(/\D/g, ''))}
              required
              className={styles.docField}
            />
          </div>

          {paymentMethod === 'credit_card' && (
            <>
              <FormField
                id="cardholderName"
                label="Nome no cartão"
                placeholder="Como está impresso no cartão"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                required
              />
              <FormField
                id="cardNumber"
                label="Número do cartão"
                placeholder="ACCT-000003"
                value={cardNumber}
                onChange={handleCardNumberChange}
                required
              />
              <div className={styles.cardRow}>
                <FormField
                  id="cardExpiry"
                  label="Validade"
                  placeholder="MM/AA"
                  value={cardExpiry}
                  onChange={handleExpiryChange}
                  required
                />
                <FormField
                  id="cardCvv"
                  label="CVV"
                  placeholder="123"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                  required
                />
              </div>
            </>
          )}

          {paymentMethod === 'pix' && (
            <p className={styles.pixIntro}>
              Gere o QR Code PIX e conclua o pagamento no app do seu banco. A assinatura é liberada automaticamente.
            </p>
          )}

          <Button
            variant="primary"
            size="lg"
            type="submit"
            loading={processing}
            className={styles.submitBtn}
          >
            {paymentMethod === 'pix' ? 'Gerar PIX' : `Pagar ${formatPlanPrice(plan.price)}`}
          </Button>
        </form>
      )}
    </Modal>
  );
}
