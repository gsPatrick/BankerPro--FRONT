export const WORK_SITUATIONS = {
  EMPLOYED: 'employed',
  STUDYING: 'studying'
};

export const EXPERIENCE_LEVELS = ['Iniciante', 'Intermediário', 'Avançado'];

export const CERTIFICATION_OPTIONS = [
  'C-Pro',
  'C-Pro R',
  'C-Pro I',
  'Ainda não comecei uma certificação',
  'Outra',
];

export const ONBOARDING_STORAGE_KEY = 'bankerpro_onboarding_completed';

export function formatPhone(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function isOnboardingCompleted(userOrProfile) {
  if (!userOrProfile) return false;
  if (userOrProfile.onboardingCompleted === true) return true;
  if (userOrProfile.profile?.onboardingCompleted === true) return true;
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
  }
  return false;
}

export function markOnboardingCompletedLocal(userPatch = {}) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
  try {
    const raw = localStorage.getItem('bankerpro_user');
    const current = raw ? JSON.parse(raw) : {};
    localStorage.setItem(
      'bankerpro_user',
      JSON.stringify({
        ...current,
        ...userPatch,
        onboardingCompleted: true
      })
    );
  } catch {
    // ignore malformed local cache
  }
}

export function clearOnboardingLocal() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
}

/** Resize image file to a compact JPEG data URL for avatar storage */
export function fileToAvatarDataUrl(file, maxSize = 320, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('Selecione uma imagem válida.'));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error('A imagem deve ter no máximo 8 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Imagem inválida.'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
