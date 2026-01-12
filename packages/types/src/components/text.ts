import type {
  FontFamilyKey,
  FontSizeKey,
  FontWeightKey,
  LineHeightKey,
  TextColorKey,
} from '../primitives/index';

export type TextVariant = 'body' | 'heading-sm' | 'heading-lg' | 'caption';

export interface TextVariantSpec {
  family: FontFamilyKey;
  size: FontSizeKey;
  weight: FontWeightKey;
  lineHeight: LineHeightKey;
  color: TextColorKey;
}
