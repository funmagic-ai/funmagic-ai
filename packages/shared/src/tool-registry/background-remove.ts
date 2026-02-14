import type { ToolDefinition } from './types';

/**
 * Background Remove tool definition
 * Removes backgrounds from images using AI
 */
export const backgroundRemoveDefinition: ToolDefinition = {
  name: 'background-remove',
  displayName: 'Background Remove',
  description: 'Remove backgrounds from images using AI',

  i18n: {
    zh: {
      title: '智能抠图',
      description: '使用AI智能去除图片背景',
      steps: {
        'remove-bg': { name: '去除背景', description: '处理图片以去除背景' },
      },
    },
    ja: {
      title: '背景除去',
      description: 'AIを使用して画像の背景を除去',
      steps: {
        'remove-bg': { name: '背景を除去', description: '画像を処理して背景を除去する' },
      },
    },
    fr: {
      title: "Suppression d'arrière-plan",
      description: "Supprimez les arrière-plans des images grâce à l'IA",
      steps: {
        'remove-bg': { name: "Supprimer l'arrière-plan", description: "Traiter l'image pour supprimer son arrière-plan" },
      },
    },
    es: {
      title: 'Eliminar fondo',
      description: 'Elimina fondos de imágenes usando IA',
      steps: {
        'remove-bg': { name: 'Eliminar fondo', description: 'Procesar la imagen para eliminar su fondo' },
      },
    },
    pt: {
      title: 'Remover fundo',
      description: 'Remova fundos de imagens usando IA',
      steps: {
        'remove-bg': { name: 'Remover fundo', description: 'Processar a imagem para remover o fundo' },
      },
    },
    de: {
      title: 'Hintergrund entfernen',
      description: 'Entfernen Sie Bildhintergründe mit KI',
      steps: {
        'remove-bg': { name: 'Hintergrund entfernen', description: 'Das Bild verarbeiten, um den Hintergrund zu entfernen' },
      },
    },
    vi: {
      title: 'Xóa nền',
      description: 'Xóa nền ảnh bằng AI',
      steps: {
        'remove-bg': { name: 'Xóa nền', description: 'Xử lý hình ảnh để xóa nền' },
      },
    },
    ko: {
      title: '배경 제거',
      description: 'AI를 사용하여 이미지 배경 제거',
      steps: {
        'remove-bg': { name: '배경 제거', description: '이미지를 처리하여 배경 제거' },
      },
    },
  },

  steps: [
    {
      id: 'remove-bg',
      name: 'Remove Background',
      description: 'Process the image to remove its background',

      provider: {
        name: 'fal',
        model: 'fal-ai/bria/background/remove',
        providerOptions: {
          sync_mode: false,
        },
      },

      fields: {
        cost: {
          type: 'number',
          required: true,
          min: 0,
          default: 5,
          description: 'Credit cost for this step',
        },
      },

      overridableOptions: {},
    },
  ],
};
