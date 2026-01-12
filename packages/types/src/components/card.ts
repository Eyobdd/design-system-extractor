import type {
  SurfaceColorKey,
  BorderColorKey,
  RadiusKey,
  ShadowKey,
  SpacingKey,
} from '../primitives/index';

export type CardVariant = 'default' | 'elevated' | 'bordered';

export interface CardVariantSpec {
  surface: SurfaceColorKey;
  border: BorderColorKey | null;
  radius: RadiusKey;
  padding: SpacingKey;
  shadow: ShadowKey | null;
}
