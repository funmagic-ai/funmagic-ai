import type { ToolDefinition } from './types';

/**
 * Background Remove tool definition
 * Removes backgrounds from images using AI
 */
export const backgroundRemoveDefinition: ToolDefinition = {
  name: 'background-remove',
  displayName: 'Background Remove',
  description: 'Remove backgrounds from images using AI',

  steps: [
    {
      id: 'remove-bg',
      name: 'Remove Background',
      description: 'Process the image to remove its background',

      provider: {
        name: 'fal',
        model: 'fal-ai/bria-rmbg',
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
