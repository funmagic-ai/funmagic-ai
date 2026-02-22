import type { ToolDefinition } from './types';

/**
 * Vintage Trace tool definition
 * Transforms user images into vintage-style illustrations (image generation only, no 3D)
 */
export const vintageTraceDefinition: ToolDefinition = {
  name: 'vintage-trace',
  displayName: 'Vintage Trace',
  description: 'Transform photos into vintage-style illustrations',

  i18n: {
    zh: {
      title: 'Vintage Trace',
      description: '将照片转化为复古风格插画',
      steps: {
        'image-gen': { name: '风格转换', description: '将输入图片转换为复古风格' },
      },
    },
    ja: {
      title: 'Vintage Trace',
      description: '写真をヴィンテージ風イラストに変換',
      steps: {
        'image-gen': { name: 'スタイル変換', description: '入力画像をヴィンテージスタイルに変換' },
      },
    },
    fr: {
      title: 'Vintage Trace',
      description: 'Transformez vos photos en illustrations vintage',
      steps: {
        'image-gen': { name: 'Transformation de style', description: "Transformer l'image en style vintage" },
      },
    },
    es: {
      title: 'Vintage Trace',
      description: 'Transforma fotos en ilustraciones de estilo vintage',
      steps: {
        'image-gen': { name: 'Transformación de estilo', description: 'Transformar la imagen al estilo vintage' },
      },
    },
    pt: {
      title: 'Vintage Trace',
      description: 'Transforme fotos em ilustrações de estilo vintage',
      steps: {
        'image-gen': { name: 'Transformação de estilo', description: 'Transformar a imagem no estilo vintage' },
      },
    },
    de: {
      title: 'Vintage Trace',
      description: 'Verwandeln Sie Fotos in Vintage-Illustrationen',
      steps: {
        'image-gen': { name: 'Stiltransformation', description: 'Das Eingabebild in den Vintage-Stil umwandeln' },
      },
    },
    vi: {
      title: 'Vintage Trace',
      description: 'Chuyển đổi ảnh thành minh họa phong cách cổ điển',
      steps: {
        'image-gen': { name: 'Chuyển đổi phong cách', description: 'Chuyển đổi hình ảnh sang phong cách cổ điển' },
      },
    },
    ko: {
      title: 'Vintage Trace',
      description: '사진을 빈티지 스타일 일러스트로 변환',
      steps: {
        'image-gen': { name: '스타일 변환', description: '입력 이미지를 빈티지 스타일로 변환' },
      },
    },
  },

  steps: [
    {
      id: 'image-gen',
      name: 'Style Transform',
      description: 'Transform the input image into a vintage style',

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
          placeholder: 'Transform this image into vintage style...',
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
  ],
};
