// Vision module - AI-powered component identification
export {
  identifyComponents,
  filterComponentsByConfidence,
  groupComponentsByType,
  type IdentifyOptions,
  type IdentifyResult,
} from './identify';
export {
  COMPONENT_IDENTIFICATION_SYSTEM_PROMPT,
  COMPONENT_IDENTIFICATION_USER_PROMPT,
  COMPONENT_IDENTIFICATION_SCHEMA,
  SUPPORTED_COMPONENT_TYPES,
  type SupportedComponentType,
} from './prompts';
