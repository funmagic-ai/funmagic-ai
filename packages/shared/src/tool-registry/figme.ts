import type { ToolDefinition } from './types';

/**
 * Figme tool definition
 * Transforms user images into stylized versions and generates 3D models
 */
export const figmeDefinition: ToolDefinition = {
  name: 'figme',
  displayName: 'FigMe',
  description: 'Transform photos into stylized images and 3D models',

  steps: [
    {
      id: 'style-transform',
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
          maxItems: 8,
          description: 'Style reference images (upload URLs)',
          itemFields: {
            imageUrl: {
              type: 'string',
              required: true,
              upload: true,
              description: 'Reference image for this style',
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
