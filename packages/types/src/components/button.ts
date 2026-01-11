import type {
  SurfaceColorKey,
  TextColorKey,
  BorderColorKey,
  RadiusKey,
  FontSizeKey,
  FontWeightKey,
} from '../primitives/index';

export interface ButtonVariantSpec {
  surface: SurfaceColorKey;
  text: TextColorKey;
  border: BorderColorKey | null;
  radius: RadiusKey;
  paddingX: number;
  paddingY: number;
  fontSize: FontSizeKey;
  fontWeight: FontWeightKey;
}
