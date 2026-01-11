import type {
  FontFamilyKey,
  FontSizeKey,
  FontWeightKey,
  LineHeightKey,
  TextColorKey,
} from '../primitives/index';

export interface TextVariantSpec {
  family: FontFamilyKey;
  size: FontSizeKey;
  weight: FontWeightKey;
  lineHeight: LineHeightKey;
  color: TextColorKey;
}
