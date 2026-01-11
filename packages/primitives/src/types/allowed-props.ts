import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes } from 'react';

/**
 * Allowed behavioral props for Button primitive.
 * Explicitly excludes: id, className, style, and user-provided data-* attributes.
 * Only behavioral and accessibility props are permitted.
 */
export type AllowedButtonBehavioralProps = Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | 'onClick'
  | 'onMouseDown'
  | 'onMouseUp'
  | 'onMouseEnter'
  | 'onMouseLeave'
  | 'onFocus'
  | 'onBlur'
  | 'onKeyDown'
  | 'onKeyUp'
  | 'disabled'
  | 'type'
  | 'name'
  | 'value'
  | 'form'
  | 'formAction'
  | 'formMethod'
  | 'formNoValidate'
  | 'formTarget'
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-describedby'
  | 'aria-pressed'
  | 'aria-expanded'
  | 'aria-haspopup'
  | 'aria-controls'
  | 'aria-disabled'
  | 'aria-hidden'
  | 'tabIndex'
  | 'autoFocus'
>;

/**
 * Allowed behavioral props for Div/Card primitive.
 * Explicitly excludes: id, className, style, and user-provided data-* attributes.
 */
export type AllowedDivBehavioralProps = Pick<
  HTMLAttributes<HTMLDivElement>,
  | 'onClick'
  | 'onMouseDown'
  | 'onMouseUp'
  | 'onMouseEnter'
  | 'onMouseLeave'
  | 'onFocus'
  | 'onBlur'
  | 'onKeyDown'
  | 'onKeyUp'
  | 'role'
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-describedby'
  | 'aria-hidden'
  | 'aria-live'
  | 'aria-atomic'
  | 'aria-busy'
  | 'tabIndex'
>;

/**
 * Allowed behavioral props for Input primitive.
 * Explicitly excludes: id, className, style, and user-provided data-* attributes.
 */
export type AllowedInputBehavioralProps = Pick<
  InputHTMLAttributes<HTMLInputElement>,
  | 'onChange'
  | 'onInput'
  | 'onFocus'
  | 'onBlur'
  | 'onKeyDown'
  | 'onKeyUp'
  | 'value'
  | 'defaultValue'
  | 'placeholder'
  | 'disabled'
  | 'readOnly'
  | 'required'
  | 'name'
  | 'type'
  | 'min'
  | 'max'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'step'
  | 'autoComplete'
  | 'autoFocus'
  | 'form'
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-describedby'
  | 'aria-invalid'
  | 'aria-required'
  | 'aria-disabled'
  | 'tabIndex'
>;

/**
 * Allowed behavioral props for Text/Span primitive.
 * Explicitly excludes: id, className, style, and user-provided data-* attributes.
 */
export type AllowedSpanBehavioralProps = Pick<
  HTMLAttributes<HTMLSpanElement>,
  | 'onClick'
  | 'onMouseEnter'
  | 'onMouseLeave'
  | 'role'
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-describedby'
  | 'aria-hidden'
>;
