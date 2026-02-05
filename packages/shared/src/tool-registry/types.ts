// Tool Registry Field Types
// These types define the schema for tool configuration fields
// Admin UI uses these to auto-generate form inputs

/**
 * Base field interface shared by all field types
 */
interface BaseField {
  required?: boolean;
  description?: string;
}

/**
 * String field - renders as text input, select dropdown, or file upload
 */
export interface StringField extends BaseField {
  type: 'string';
  /** If true, renders a FileUpload component */
  upload?: boolean;
  /** If set, renders a Select dropdown with these options */
  options?: string[];
  /** Placeholder text for the input */
  placeholder?: string;
  /** Default value */
  default?: string;
}

/**
 * Number field - renders as number input with optional min/max
 */
export interface NumberField extends BaseField {
  type: 'number';
  min?: number;
  max?: number;
  /** Default value */
  default?: number;
}

/**
 * Boolean field - renders as checkbox or switch
 */
export interface BooleanField extends BaseField {
  type: 'boolean';
  /** Default value */
  default?: boolean;
}

/**
 * Array field - renders as a list with add/remove controls
 */
export interface ArrayField extends BaseField {
  type: 'array';
  /** Maximum number of items allowed */
  maxItems?: number;
  /** Minimum number of items required */
  minItems?: number;
  /** Field definitions for each array item */
  itemFields: Record<string, Field>;
}

/**
 * Object field - renders as a group of nested fields
 */
export interface ObjectField extends BaseField {
  type: 'object';
  /** Nested field definitions */
  properties: Record<string, Field>;
}

/**
 * Union type of all field types
 */
export type Field = StringField | NumberField | BooleanField | ArrayField | ObjectField;

/**
 * Provider configuration for a step - defines which provider and model to use
 * This is developer-defined (not admin-configurable)
 */
export interface StepProvider {
  /** Provider name - must match providers.name in database */
  name: string;
  /** Model to use (can be overridden by admin) */
  model: string;
  /** Default provider option values (from definition, can be overridden by admin) */
  providerOptions?: Record<string, unknown>;
  /** Admin-added custom provider options */
  customProviderOptions?: Record<string, unknown>;
}

/**
 * Step definition - represents a single step in a tool's workflow
 */
export interface StepDefinition {
  /** Unique identifier for the step (used as key in config) */
  id: string;
  /** Display name for the step */
  name: string;
  /** Optional description */
  description?: string;
  /** Developer-defined provider configuration (read-only in admin) */
  provider: StepProvider;
  /** Field definitions for admin-editable content fields */
  fields: Record<string, Field>;
  /** Options that admin can override from provider defaults */
  overridableOptions?: Record<string, Field>;
}

/**
 * Tool definition - the complete schema for a tool type
 */
export interface ToolDefinition {
  /** Unique name/slug for the tool (matches database slug) */
  name: string;
  /** Display name for the tool */
  displayName?: string;
  /** Description of what the tool does */
  description?: string;
  /** Steps that make up this tool's workflow */
  steps: StepDefinition[];
}

/**
 * Tool registry type - maps tool names to their definitions
 */
export type ToolRegistry = Record<string, ToolDefinition>;

/**
 * Saved step config structure (stored in database tools.config)
 */
export interface StepConfig {
  id: string;
  /** Step name (copied from definition) */
  name?: string;
  /** Step description (copied from definition) */
  description?: string;
  /** Provider configuration (copied from definition, with merged providerOptions) */
  provider?: StepProvider;
  /** Credit cost for this step */
  cost?: number;
  /** Admin overrides for provider options defined in overridableOptions */
  optionOverrides?: Record<string, unknown>;
  /** Other admin-editable fields (prompt, styleReferences, etc.) */
  [key: string]: unknown;
}

export interface SavedToolConfig {
  steps: StepConfig[];
  [key: string]: unknown;
}
