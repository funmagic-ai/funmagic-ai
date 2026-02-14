import type { ToolDefinition } from './types';

/**
 * Crystal Memory tool definition
 * Creates 3D crystal-like visualizations from photos
 */
export const crystalMemoryDefinition: ToolDefinition = {
  name: 'crystal-memory',
  displayName: 'Crystal Memory',
  description: 'Transform photos into 3D point cloud crystal memories',

  i18n: {
    zh: {
      title: '水晶记忆',
      description: '将照片转化为3D点云水晶记忆',
      steps: {
        'background-remove': { name: '去除背景', description: '去除背景以获得更好的3D提取效果' },
        'vggt': { name: '生成点云', description: '从图片生成3D点云' },
      },
    },
    ja: {
      title: 'クリスタルメモリー',
      description: '写真を3Dポイントクラウドのクリスタルメモリーに変換',
      steps: {
        'background-remove': { name: '背景除去', description: 'より良い3D抽出のために背景を除去' },
        'vggt': { name: 'ポイントクラウド生成', description: '画像から3Dポイントクラウドを生成' },
      },
    },
    fr: {
      title: 'Mémoire cristalline',
      description: 'Transformez vos photos en mémoires cristallines de nuages de points 3D',
      steps: {
        'background-remove': { name: "Supprimer l'arrière-plan", description: "Supprimer l'arrière-plan pour une meilleure extraction 3D" },
        'vggt': { name: 'Générer le nuage de points', description: "Générer un nuage de points 3D à partir de l'image" },
      },
    },
    es: {
      title: 'Memoria de cristal',
      description: 'Transforma fotos en memorias de cristal de nubes de puntos 3D',
      steps: {
        'background-remove': { name: 'Eliminar fondo', description: 'Eliminar el fondo para una mejor extracción 3D' },
        'vggt': { name: 'Generar nube de puntos', description: 'Generar una nube de puntos 3D a partir de la imagen' },
      },
    },
    pt: {
      title: 'Memória de cristal',
      description: 'Transforme fotos em memórias de cristal de nuvens de pontos 3D',
      steps: {
        'background-remove': { name: 'Remover fundo', description: 'Remover o fundo para melhor extração 3D' },
        'vggt': { name: 'Gerar nuvem de pontos', description: 'Gerar uma nuvem de pontos 3D a partir da imagem' },
      },
    },
    de: {
      title: 'Kristallerinnerung',
      description: 'Verwandeln Sie Fotos in 3D-Punktwolken-Kristallerinnerungen',
      steps: {
        'background-remove': { name: 'Hintergrund entfernen', description: 'Hintergrund für bessere 3D-Extraktion entfernen' },
        'vggt': { name: 'Punktwolke generieren', description: '3D-Punktwolke aus dem Bild generieren' },
      },
    },
    vi: {
      title: 'Ký ức pha lê',
      description: 'Chuyển đổi ảnh thành ký ức pha lê đám mây điểm 3D',
      steps: {
        'background-remove': { name: 'Xóa nền', description: 'Xóa nền để trích xuất 3D tốt hơn' },
        'vggt': { name: 'Tạo đám mây điểm', description: 'Tạo đám mây điểm 3D từ hình ảnh' },
      },
    },
    ko: {
      title: '크리스탈 메모리',
      description: '사진을 3D 포인트 클라우드 크리스탈 메모리로 변환',
      steps: {
        'background-remove': { name: '배경 제거', description: '더 나은 3D 추출을 위해 배경 제거' },
        'vggt': { name: '포인트 클라우드 생성', description: '이미지에서 3D 포인트 클라우드 생성' },
      },
    },
  },

  steps: [
    {
      id: 'background-remove',
      name: 'Remove Background',
      description: 'Remove background for better 3D extraction',

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
    {
      id: 'vggt',
      name: 'Generate Point Cloud',
      description: 'Generate 3D point cloud from image',

      provider: {
        name: 'replicate',
        model: 'vufinder/vggt-1b:770898f053ca56571e8a49d71f27fc695b6d203e0691baa30d8fbb6954599f2b',
        providerOptions: {
          pcd_source: 'point_head',
          return_pcd: true,
          output_image_size: 518,
          scale_extent: 10,
        },
      },

      fields: {
        cost: {
          type: 'number',
          required: true,
          min: 0,
          default: 15,
          description: 'Credit cost for this step',
        },
      },

      overridableOptions: {},
    },
  ],
};
