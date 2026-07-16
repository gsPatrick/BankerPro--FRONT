'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/organisms/Modal/Modal';
import Button from '@/components/atoms/Button/Button';
import { PLAN_FEATURE_DENIED_EVENT } from '@/lib/api';

/**
 * Escuta o bloqueio que a API sinaliza e convida ao upgrade. Fica montado uma
 * vez no layout da plataforma, então vale para qualquer tela sem que cada uma
 * precise tratar o erro.
 */
export default function PlanUpgradeGate() {
  const router = useRouter();
  const [message, setMessage] = useState('');

  useEffect(() => {
    const onDenied = (event) => {
      setMessage(event.detail?.message || '');
    };
    window.addEventListener(PLAN_FEATURE_DENIED_EVENT, onDenied);
    return () => window.removeEventListener(PLAN_FEATURE_DENIED_EVENT, onDenied);
  }, []);

  const close = () => setMessage('');

  const goToPlans = () => {
    setMessage('');
    router.push('/plano');
  };

  return (
    <Modal
      isOpen={Boolean(message)}
      onClose={close}
      title="Funcionalidade não incluída no seu plano"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={close}>
            Agora não
          </Button>
          <Button type="button" variant="primary" onClick={goToPlans}>
            Ver planos
          </Button>
        </>
      }
    >
      <p>{message}</p>
      <p>Faça um upgrade para liberar o acesso e continuar de onde parou.</p>
    </Modal>
  );
}
