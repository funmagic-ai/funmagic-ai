import type { ToolDefinition } from './types';

/**
 * Crystal Memory tool definition
 * Creates 3D crystal-like visualizations from photos
 */
export const crystalMemoryDefinition: ToolDefinition = {
  name: 'crystal-memory',
  displayName: 'Crystal Memory',
  description: 'Transform photos into 3D point cloud crystal memories',

  steps: [
    {
      id: 'background-remove',
      name: 'Remove Background',
      description: 'Remove background for better 3D extraction',

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
