import type {
  SurfaceColorKey,
  TextColorKey,
  BorderColorKey,
  RadiusKey,
  FontSizeKey,
  SpacingKey,
} from '../primitives/index';

export interface InputVariantSpec {
  surface: SurfaceColorKey;
  text: TextColorKey;
  border: BorderColorKey;
  radius: RadiusKey;
  paddingX: SpacingKey;
  paddingY: SpacingKey;
  fontSize: FontSizeKey;
}
