import type { ToolDefinition } from './types';

/**
 * Image to 3D tool definition
 * Converts user-uploaded images into 3D models using selectable providers (Tripo or Hunyuan)
 */
export const imageTo3dDefinition: ToolDefinition = {
  name: 'image-to-3d',
  displayName: 'Image to 3D',
  description: 'Convert images into 3D models with AI',

  i18n: {
    zh: {
      title: '图片转3D',
      description: '使用AI将图片转换为3D模型',
      steps: {
        '3d-gen': { name: '3D 生成', description: '从图片生成3D模型' },
      },
    },
    ja: {
      title: '画像から3D',
      description: 'AIを使って画像を3Dモデルに変換',
      steps: {
        '3d-gen': { name: '3D生成', description: '画像から3Dモデルを生成' },
      },
    },
    fr: {
      title: 'Image vers 3D',
      description: 'Convertissez des images en modèles 3D avec l\'IA',
      steps: {
        '3d-gen': { name: 'Génération 3D', description: 'Générer un modèle 3D à partir d\'une image' },
      },
    },
    es: {
      title: 'Imagen a 3D',
      description: 'Convierte imágenes en modelos 3D con IA',
      steps: {
        '3d-gen': { name: 'Generación 3D', description: 'Generar un modelo 3D a partir de una imagen' },
      },
    },
    pt: {
      title: 'Imagem para 3D',
      description: 'Converta imagens em modelos 3D com IA',
      steps: {
        '3d-gen': { name: 'Geração 3D', description: 'Gerar um modelo 3D a partir de uma imagem' },
      },
    },
    de: {
      title: 'Bild zu 3D',
      description: 'Konvertieren Sie Bilder mit KI in 3D-Modelle',
      steps: {
        '3d-gen': { name: '3D-Generierung', description: 'Ein 3D-Modell aus einem Bild generieren' },
      },
    },
    vi: {
      title: 'Ảnh sang 3D',
      description: 'Chuyển đổi ảnh thành mô hình 3D bằng AI',
      steps: {
        '3d-gen': { name: 'Tạo mô hình 3D', description: 'Tạo mô hình 3D từ ảnh' },
      },
    },
    ko: {
      title: '이미지를 3D로',
      description: 'AI를 사용하여 이미지를 3D 모델로 변환',
      steps: {
        '3d-gen': { name: '3D 생성', description: '이미지에서 3D 모델 생성' },
      },
    },
  },

  steps: [
    {
      id: '3d-gen',
      name: '3D Generation',
      description: 'Generate a 3D model from the uploaded image',

      provider: {
        name: 'tripo',
        model: 'v3.0-20250812',
        providerOptions: {},
      },

      fields: {
        cost: {
          type: 'number',
          required: true,
          min: 0,
          default: 30,
          description: 'Credit cost for this step',
        },
      },

      overridableOptions: {
        model_version: {
          type: 'string',
          options: ['Turbo-v1.0-20250506', 'v2.0-20240919', 'v2.5-20250123', 'v3.0-20250812'],
          default: 'v3.0-20250812',
          description: 'Model version (Tripo)',
        },
        face_limit: {
          type: 'number',
          min: 1000,
          max: 500000,
          description: 'Maximum face count (Tripo)',
        },
        pbr: {
          type: 'boolean',
          default: true,
          description: 'Enable PBR materials',
        },
      },
    },
  ],
};
