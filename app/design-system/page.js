'use client';

import { useState } from 'react';
import NavBar from '@/components/organisms/NavBar/NavBar';
import BottomNav from '@/components/organisms/BottomNav/BottomNav';
import Button from '@/components/atoms/Button/Button';
import Badge from '@/components/atoms/Badge/Badge';
import Input from '@/components/atoms/Input/Input';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Avatar from '@/components/atoms/Avatar/Avatar';
import Card from '@/components/molecules/Card/Card';
import FormField from '@/components/molecules/FormField/FormField';
import Toast from '@/components/molecules/Toast/Toast';
import Modal from '@/components/organisms/Modal/Modal';
import styles from './page.module.css';

export default function DesignSystemPage() {
  // Navigation active state
  const [activeTab, setActiveTab] = useState('system');

  // Input states
  const [inputText, setInputText] = useState('');
  const [inputError, setInputError] = useState('Este campo é obrigatório');

  // Toast states
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);

  const showToast = (message, type) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const navItems = [
    {
      id: 'system',
      label: 'Sistema',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" />
          <rect x="14" y="3" width="7" height="5" />
          <rect x="14" y="12" width="7" height="9" />
          <rect x="3" y="16" width="7" height="5" />
        </svg>
      ),
    },
    {
      id: 'components',
      label: 'Componentes',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      ),
    },
    {
      id: 'mockups',
      label: 'Simulador',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className={styles.appContainer}>
      {/* Dynamic Top bar */}
      <NavBar
        title="Closer.IA DS"
        subtitle="Design System"
        actionRight={
          <Avatar size="sm" initials="PH" online={true} />
        }
      />

      <main className={styles.contentArea}>
        {/* Intro */}
        <section className={styles.heroSection}>
          <Badge variant="accent" size="sm" dot={true}>
            Mobile App Native v1.0
          </Badge>
          <h1 className={styles.heroTitle}>Aparência Cinematográfica</h1>
          <p className={styles.heroDescription}>
            Design system atômico estruturado sob o arquétipo <strong>Darkroom</strong>. Foco mobile-first, contrastes marcantes e microinterações táteis refinadas.
          </p>
        </section>

        {/* Cores */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Diretriz de Cores</h2>
          <p className={styles.sectionDesc}>Harmonia de cores inspirada em riqueza e sofisticação financeira.</p>
          <div className={styles.colorGrid}>
            <div className={styles.colorCard} style={{ '--bg-color': '#0E0E0E' }}>
              <span className={styles.colorHex}>#0E0E0E</span>
              <span className={styles.colorName}>Canvas (Fundo)</span>
            </div>
            <div className={styles.colorCard} style={{ '--bg-color': '#C9CED6', color: '#0E0E0E' }}>
              <span className={styles.colorHex}>#C9CED6</span>
              <span className={styles.colorName}>Accent (Roxo Secundário)</span>
            </div>
            <div className={styles.colorCard} style={{ '--bg-color': '#F6F6F6', color: '#0E0E0E' }}>
              <span className={styles.colorHex}>#F6F6F6</span>
              <span className={styles.colorName}>Ink (Contraste Claro)</span>
            </div>
            <div className={styles.colorCard} style={{ '--bg-color': '#161616' }}>
              <span className={styles.colorHex}>#161616</span>
              <span className={styles.colorName}>Surface</span>
            </div>
            <div className={styles.colorCard} style={{ '--bg-color': '#C9A84C', color: '#0E0E0E' }}>
              <span className={styles.colorHex}>#C9A84C</span>
              <span className={styles.colorName}>Gold (Sucesso/Ganho)</span>
            </div>
          </div>
        </section>

        {/* ATOMS */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Atoms</h2>
          
          {/* Buttons */}
          <div className={styles.subSection}>
            <h3 className={styles.subSectionTitle}>Botões (Variantes & Estados)</h3>
            <div className={styles.flexWrap}>
              <Button variant="primary">Principal</Button>
              <Button variant="secondary">Secundário</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Erro / Alerta</Button>
              <Button variant="gold">Premium Gold</Button>
            </div>
            <div className={styles.flexWrap} style={{ marginTop: '12px' }}>
              <Button variant="primary" size="sm">Tamanho P</Button>
              <Button variant="primary" size="md">Tamanho M</Button>
              <Button variant="primary" size="lg">Tamanho G</Button>
              <Button variant="primary" loading={true}>Carregando</Button>
              <Button variant="primary" disabled={true}>Desativado</Button>
            </div>
          </div>

          {/* Badges */}
          <div className={styles.subSection}>
            <h3 className={styles.subSectionTitle}>Badges</h3>
            <div className={styles.flexWrap}>
              <Badge variant="default">Padrão</Badge>
              <Badge variant="accent" dot={true}>Ativo</Badge>
              <Badge variant="success">Sucesso</Badge>
              <Badge variant="warning">Atenção</Badge>
              <Badge variant="danger">Erro</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="gold">Premium</Badge>
            </div>
          </div>

          {/* Avatars */}
          <div className={styles.subSection}>
            <h3 className={styles.subSectionTitle}>Avatars</h3>
            <div className={styles.flexWrap}>
              <Avatar size="sm" initials="SM" />
              <Avatar size="md" initials="MD" online={true} />
              <Avatar size="lg" initials="LG" />
              <Avatar size="xl" initials="XL" online={true} />
            </div>
          </div>

          {/* Inputs */}
          <div className={styles.subSection}>
            <h3 className={styles.subSectionTitle}>Inputs de Texto</h3>
            <div className={styles.inputStack}>
              <Input
                placeholder="Nome do usuário"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                iconLeft={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                }
              />
              <Input
                placeholder="Insira sua senha"
                type="password"
                iconLeft={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                }
              />
            </div>
          </div>
        </section>

        {/* MOLECULES */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Molecules</h2>

          {/* Form Fields */}
          <div className={styles.subSection}>
            <h3 className={styles.subSectionTitle}>Campos de Formulário</h3>
            <div className={styles.inputStack}>
              <FormField
                id="f1"
                label="E-mail Corporativo"
                placeholder="seu.nome@banker.pro"
                required={true}
                helperText="Use seu e-mail de bancário parceiro."
              />
              <FormField
                id="f2"
                label="Valor do Financiamento"
                placeholder="R$ 0,00"
                state="error"
                helperText={inputError}
                iconLeft={<span className={styles.inputPrefix}>R$</span>}
              />
            </div>
          </div>

          {/* Cards */}
          <div className={styles.subSection}>
            <h3 className={styles.subSectionTitle}>Cards (Contêineres)</h3>
            <div className={styles.cardStack}>
              <Card variant="default">
                <h4>Card Padrão</h4>
                <p>Base branca Nubank. Foco em alta legibilidade e contraste premium.</p>
              </Card>
              <Card variant="elevated">
                <h4>Card Elevado</h4>
                <p>Canvas branco com sombra suave e destaque elevado para listagens.</p>
              </Card>
              <Card variant="accent" borderGlow={true} onClick={() => showToast('Card Premium clicado!', 'success')}>
                <div className={styles.cardHeaderRow}>
                  <Badge variant="gold" size="sm">Copiloto Ativo</Badge>
                </div>
                <h4 style={{ marginTop: '8px' }}>Efeito Border Glow</h4>
                <p>Card com borda gradiente e fundo branco premium. Clique para testar.</p>
              </Card>
            </div>
          </div>

          {/* Toasts Triggers */}
          <div className={styles.subSection}>
            <h3 className={styles.subSectionTitle}>Feedback Visual (Toast)</h3>
            <div className={styles.flexWrap}>
              <Button variant="ghost" size="sm" onClick={() => showToast('Operação realizada com sucesso!', 'success')}>
                Toast Sucesso
              </Button>
              <Button variant="ghost" size="sm" onClick={() => showToast('Erro ao validar assinatura!', 'error')}>
                Toast Erro
              </Button>
              <Button variant="ghost" size="sm" onClick={() => showToast('Instância sincronizada.', 'info')}>
                Toast Info
              </Button>
            </div>
          </div>
        </section>

        {/* ORGANISMS */}
        <section className={styles.section} style={{ paddingBottom: '80px' }}>
          <h2 className={styles.sectionTitle}>Organisms</h2>
          
          <div className={styles.subSection}>
            <h3 className={styles.subSectionTitle}>Dialog / Bottom Sheet</h3>
            <Button variant="primary" size="lg" className={styles.fullWidthBtn} onClick={() => setModalOpen(true)}>
              Abrir Bottom Sheet
            </Button>
          </div>
        </section>
      </main>

      {/* Floating Bottom Nav */}
      <BottomNav
        items={navItems}
        activeId={activeTab}
        onChange={(id) => {
          setActiveTab(id);
          showToast(`Aba alterada para: ${id}`, 'info');
        }}
      />

      {/* Toast Alert Component */}
      <div className={styles.toastContainer}>
        <Toast
          type={toastType}
          message={toastMessage}
          visible={toastVisible}
          onClose={() => setToastVisible(false)}
        />
      </div>

      {/* Bottom Sheet Component */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Detalhes do Cenário"
        footer={
          <>
            <Button variant="secondary" size="md" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>
              Voltar
            </Button>
            <Button variant="primary" size="md" style={{ flex: 1 }} onClick={() => {
              setModalOpen(false);
              showToast('Cenário iniciado!', 'success');
            }}>
              Iniciar Treinamento
            </Button>
          </>
        }
      >
        <div className={styles.sheetBody}>
          <div className={styles.sheetHeader}>
            <Badge variant="gold">Venda de Consórcio</Badge>
            <Badge variant="default">Dificuldade: Média</Badge>
          </div>
          <h3 className={styles.sheetMetaTitle}>Cliente: Roberto Silva</h3>
          <p className={styles.sheetDescription}>
            Roberto quer renegociar uma parcela mas tem medo de pagar juros abusivos. Se perguntado sobre a família, vai revelar que tem dois filhos em escola privada.
          </p>
          <div className={styles.tipBox}>
            <strong>Dica de IA:</strong> Concentre a abordagem nas vantagens tributárias e no resgate planejado do consórcio imobiliário.
          </div>
        </div>
      </Modal>
    </div>
  );
}
