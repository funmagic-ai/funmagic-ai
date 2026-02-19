import type { ToolDefinition } from './types';

/**
 * Figme tool definition
 * Transforms user images into stylized versions and generates 3D models
 */
export const figmeDefinition: ToolDefinition = {
  name: 'figme',
  displayName: 'FigMe',
  description: 'Transform photos into stylized images and 3D models',

  i18n: {
    zh: {
      title: 'FigMe',
      description: '将照片转化为风格化图片和3D模型',
      steps: {
        'image-gen': { name: '风格转换', description: '将输入图片转换为选定风格' },
        '3d-gen': { name: '3D 生成', description: '从风格化图片生成3D模型' },
      },
    },
    ja: {
      title: 'FigMe',
      description: '写真をスタイリッシュな画像や3Dモデルに変換',
      steps: {
        'image-gen': { name: 'スタイル変換', description: '入力画像を選択したスタイルに変換' },
        '3d-gen': { name: '3D生成', description: 'スタイル化された画像から3Dモデルを生成' },
      },
    },
    fr: {
      title: 'FigMe',
      description: 'Transformez vos photos en images stylisées et modèles 3D',
      steps: {
        'image-gen': { name: 'Transformation de style', description: "Transformer l'image d'entrée dans le style sélectionné" },
        '3d-gen': { name: 'Génération 3D', description: "Générer un modèle 3D à partir de l'image stylisée" },
      },
    },
    es: {
      title: 'FigMe',
      description: 'Transforma fotos en imágenes estilizadas y modelos 3D',
      steps: {
        'image-gen': { name: 'Transformación de estilo', description: 'Transformar la imagen de entrada en el estilo seleccionado' },
        '3d-gen': { name: 'Generación 3D', description: 'Generar un modelo 3D a partir de la imagen estilizada' },
      },
    },
    pt: {
      title: 'FigMe',
      description: 'Transforme fotos em imagens estilizadas e modelos 3D',
      steps: {
        'image-gen': { name: 'Transformação de estilo', description: 'Transformar a imagem de entrada no estilo selecionado' },
        '3d-gen': { name: 'Geração 3D', description: 'Gerar um modelo 3D a partir da imagem estilizada' },
      },
    },
    de: {
      title: 'FigMe',
      description: 'Verwandeln Sie Fotos in stilisierte Bilder und 3D-Modelle',
      steps: {
        'image-gen': { name: 'Stiltransformation', description: 'Das Eingabebild in den ausgewählten Stil umwandeln' },
        '3d-gen': { name: '3D-Generierung', description: 'Ein 3D-Modell aus dem stilisierten Bild generieren' },
      },
    },
    vi: {
      title: 'FigMe',
      description: 'Chuyển đổi ảnh thành hình ảnh phong cách hóa và mô hình 3D',
      steps: {
        'image-gen': { name: 'Chuyển đổi phong cách', description: 'Chuyển đổi hình ảnh đầu vào sang phong cách đã chọn' },
        '3d-gen': { name: 'Tạo mô hình 3D', description: 'Tạo mô hình 3D từ hình ảnh phong cách hóa' },
      },
    },
    ko: {
      title: 'FigMe',
      description: '사진을 스타일화된 이미지와 3D 모델로 변환',
      steps: {
        'image-gen': { name: '스타일 변환', description: '입력 이미지를 선택한 스타일로 변환' },
        '3d-gen': { name: '3D 생성', description: '스타일화된 이미지에서 3D 모델 생성' },
      },
    },
  },

  steps: [
    {
      id: 'image-gen',
      name: 'Style Transform',
      description: 'Transform the input image into a selected style',

      provider: {
        name: 'openai',
        model: 'gpt-image-1',
        providerOptions: {
          size: '1024x1024',
          quality: 'medium',
          format: 'png',
          background: 'transparent',
          moderation: 'low',
        },
      },

      fields: {
        cost: {
          type: 'number',
          required: true,
          min: 0,
          default: 20,
          description: 'Credit cost for this step',
        },
        prompt: {
          type: 'string',
          required: true,
          description: 'Base prompt template for style transformation',
          placeholder: 'Transform this image into {style} style...',
        },
        styleReferences: {
          type: 'array',
          minItems: 1,
          maxItems: 8,
          description: 'Style reference images (at least one required)',
          itemFields: {
            imageUrl: {
              type: 'string',
              required: true,
              upload: true,
              description: 'Reference image for this style',
            },
            prompt: {
              type: 'string',
              required: false,
              description: 'Custom prompt for this style (overrides step-level prompt)',
              placeholder: 'Leave empty to use the default prompt above',
            },
            useStyleImage: {
              type: 'boolean',
              required: false,
              default: true,
              description: 'Whether to send this style image to the AI along with the user image',
            },
          },
        },
      },

      overridableOptions: {
        size: {
          type: 'string',
          options: ['1024x1024', '1536x1024', '1024x1536'],
          default: '1024x1024',
          description: 'Output image size',
        },
        quality: {
          type: 'string',
          options: ['low', 'medium', 'high'],
          default: 'medium',
          description: 'Image quality',
        },
        background: {
          type: 'string',
          options: ['transparent', 'opaque'],
          default: 'transparent',
          description: 'Background type',
        },
        moderation: {
          type: 'string',
          options: ['low', 'auto'],
          default: 'low',
          description: 'Moderation level',
        },
      },
    },
    {
      id: '3d-gen',
      name: '3D Generation',
      description: 'Generate a 3D model from the stylized image',

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

      overridableOptions: {},
    },
  ],
};
