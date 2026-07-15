export default function manifest() {
  return {
    name: 'Closer.IA',
    short_name: 'Closer.IA',
    description:
      'Plataforma de treinamento de vendas e negociação comercial com IA',
    start_url: '/?view=gate',
    scope: '/',
    id: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'portrait-primary',
    background_color: '#0E0E0E',
    theme_color: '#0E0E0E',
    lang: 'pt-BR',
    dir: 'ltr',
    categories: ['business', 'productivity', 'education'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Abrir Closer.IA',
        short_name: 'Abrir',
        description: 'Abre a plataforma Closer.IA',
        url: '/?view=gate',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
