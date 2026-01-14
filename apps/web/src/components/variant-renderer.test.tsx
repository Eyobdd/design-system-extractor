import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VariantRenderer, VariantPreviewCard } from './variant-renderer';
import type {
  ButtonVariantSpec,
  CardVariantSpec,
  InputVariantSpec,
  TextVariantSpec,
} from '@extracted/types';

function createButtonSpec(overrides: Partial<ButtonVariantSpec> = {}): ButtonVariantSpec {
  return {
    surface: 'primary',
    text: 'white',
    paddingX: 16,
    paddingY: 8,
    radius: 'md',
    fontSize: 'base',
    fontWeight: 'medium',
    border: null,
    ...overrides,
  };
}

function createCardSpec(overrides: Partial<CardVariantSpec> = {}): CardVariantSpec {
  return {
    surface: 'white',
    padding: 'md',
    radius: 'lg',
    border: null,
    shadow: null,
    ...overrides,
  };
}

function createInputSpec(overrides: Partial<InputVariantSpec> = {}): InputVariantSpec {
  return {
    surface: 'white',
    text: 'gray-900',
    border: 'gray-200',
    paddingX: 'sm',
    paddingY: 'sm',
    radius: 'md',
    fontSize: 'base',
    ...overrides,
  };
}

function createTextSpec(overrides: Partial<TextVariantSpec> = {}): TextVariantSpec {
  return {
    family: 'sans',
    color: 'gray-900',
    size: 'base',
    weight: 'normal',
    lineHeight: 'normal',
    ...overrides,
  };
}

describe('VariantRenderer', () => {
  describe('component type routing', () => {
    it('renders button component for button type', () => {
      render(<VariantRenderer componentType="button" spec={createButtonSpec()} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Button Text')).toBeInTheDocument();
    });

    it('renders card component for card type', () => {
      render(<VariantRenderer componentType="card" spec={createCardSpec()} />);

      expect(screen.getByText('Card Header')).toBeInTheDocument();
      expect(screen.getByText(/Card body content/)).toBeInTheDocument();
    });

    it('renders input component for input type', () => {
      render(<VariantRenderer componentType="input" spec={createInputSpec()} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Input text')).toBeInTheDocument();
    });

    it('renders text component for text type', () => {
      render(<VariantRenderer componentType="text" spec={createTextSpec()} />);

      expect(screen.getByText(/Sample text content/)).toBeInTheDocument();
    });

    it('renders error message for unknown component type', () => {
      render(<VariantRenderer componentType={'unknown' as 'button'} spec={createButtonSpec()} />);

      expect(screen.getByText(/Unknown component type: unknown/)).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('passes className to button', () => {
      render(
        <VariantRenderer
          componentType="button"
          spec={createButtonSpec()}
          className="custom-class"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('passes className to input', () => {
      render(
        <VariantRenderer componentType="input" spec={createInputSpec()} className="custom-class" />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });
  });

  describe('ButtonRenderer styling', () => {
    it('applies background color from surface token', () => {
      render(
        <VariantRenderer componentType="button" spec={createButtonSpec({ surface: 'primary' })} />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ backgroundColor: '#3b82f6' });
    });

    it('applies text color from text token', () => {
      render(<VariantRenderer componentType="button" spec={createButtonSpec({ text: 'white' })} />);

      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ color: '#ffffff' });
    });

    it('applies border radius from radius token', () => {
      render(<VariantRenderer componentType="button" spec={createButtonSpec({ radius: 'lg' })} />);

      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ borderRadius: '12px' });
    });

    it('applies border when border token is specified', () => {
      render(
        <VariantRenderer componentType="button" spec={createButtonSpec({ border: 'gray-200' })} />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ borderWidth: '1px', borderStyle: 'solid' });
    });

    it('has no border when border is null', () => {
      render(<VariantRenderer componentType="button" spec={createButtonSpec({ border: null })} />);

      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ borderWidth: '0' });
    });

    it('applies padding from paddingX and paddingY', () => {
      render(
        <VariantRenderer
          componentType="button"
          spec={createButtonSpec({ paddingX: 20, paddingY: 10 })}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        paddingLeft: '20px',
        paddingRight: '20px',
        paddingTop: '10px',
        paddingBottom: '10px',
      });
    });

    it('has type="button" attribute', () => {
      render(<VariantRenderer componentType="button" spec={createButtonSpec()} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('CardRenderer styling', () => {
    it('applies background color from surface token', () => {
      render(
        <VariantRenderer componentType="card" spec={createCardSpec({ surface: 'gray-50' })} />
      );

      const cardHeader = screen.getByText('Card Header');
      const card = cardHeader.parentElement;
      expect(card).toHaveStyle({ backgroundColor: '#f9fafb' });
    });

    it('applies padding from padding token', () => {
      render(<VariantRenderer componentType="card" spec={createCardSpec({ padding: 'lg' })} />);

      const cardHeader = screen.getByText('Card Header');
      const card = cardHeader.parentElement;
      expect(card).toHaveStyle({ padding: '24px' });
    });

    it('applies shadow when shadow token is specified', () => {
      render(<VariantRenderer componentType="card" spec={createCardSpec({ shadow: 'md' })} />);

      const cardHeader = screen.getByText('Card Header');
      const card = cardHeader.parentElement;
      expect(card).toHaveStyle({ boxShadow: '0 4px 6px rgba(0,0,0,0.1)' });
    });
  });

  describe('InputRenderer styling', () => {
    it('applies background color from surface token', () => {
      render(
        <VariantRenderer componentType="input" spec={createInputSpec({ surface: 'gray-50' })} />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveStyle({ backgroundColor: '#f9fafb' });
    });

    it('applies border color from border token', () => {
      render(
        <VariantRenderer componentType="input" spec={createInputSpec({ border: 'primary' })} />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveStyle({ borderColor: '#3b82f6' });
    });

    it('has readOnly attribute', () => {
      render(<VariantRenderer componentType="input" spec={createInputSpec()} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
    });

    it('has full width style', () => {
      render(<VariantRenderer componentType="input" spec={createInputSpec()} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveStyle({ width: '100%' });
    });
  });

  describe('TextRenderer styling', () => {
    it('applies color from color token', () => {
      render(<VariantRenderer componentType="text" spec={createTextSpec({ color: 'primary' })} />);

      const text = screen.getByText(/Sample text content/);
      expect(text).toHaveStyle({ color: '#3b82f6' });
    });

    it('applies font size from size token', () => {
      render(<VariantRenderer componentType="text" spec={createTextSpec({ size: 'lg' })} />);

      const text = screen.getByText(/Sample text content/);
      expect(text).toHaveStyle({ fontSize: '18px' });
    });

    it('applies font weight from weight token', () => {
      render(<VariantRenderer componentType="text" spec={createTextSpec({ weight: 'bold' })} />);

      const text = screen.getByText(/Sample text content/);
      expect(text).toHaveStyle({ fontWeight: '700' });
    });

    it('applies line height from lineHeight token', () => {
      render(
        <VariantRenderer componentType="text" spec={createTextSpec({ lineHeight: 'tight' })} />
      );

      const text = screen.getByText(/Sample text content/);
      expect(text).toHaveStyle({ lineHeight: '1.25' });
    });
  });

  describe('token resolution', () => {
    it('passes through unknown token values as-is', () => {
      render(
        <VariantRenderer
          componentType="button"
          spec={createButtonSpec({ surface: '#custom-color' })}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ backgroundColor: '#custom-color' });
    });

    it('handles null token values', () => {
      render(
        <VariantRenderer
          componentType="button"
          spec={createButtonSpec({ border: null as unknown as string })}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ borderWidth: '0' });
    });
  });
});

describe('VariantPreviewCard', () => {
  describe('rendering', () => {
    it('displays component type label', () => {
      render(
        <VariantPreviewCard
          componentType="button"
          variantName="Primary"
          spec={createButtonSpec()}
        />
      );

      expect(screen.getByText('button')).toBeInTheDocument();
    });

    it('displays variant name', () => {
      render(
        <VariantPreviewCard
          componentType="button"
          variantName="Primary Large"
          spec={createButtonSpec()}
        />
      );

      expect(screen.getByText('Primary Large')).toBeInTheDocument();
    });

    it('renders the variant component', () => {
      render(
        <VariantPreviewCard
          componentType="button"
          variantName="Primary"
          spec={createButtonSpec()}
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('status display', () => {
    it('defaults to pending status', () => {
      render(
        <VariantPreviewCard
          componentType="button"
          variantName="Primary"
          spec={createButtonSpec()}
        />
      );

      expect(screen.getByText('Pending Review')).toBeInTheDocument();
    });

    it('displays accepted status', () => {
      render(
        <VariantPreviewCard
          componentType="button"
          variantName="Primary"
          spec={createButtonSpec()}
          status="accepted"
        />
      );

      expect(screen.getByText('Accepted')).toBeInTheDocument();
    });

    it('displays failed status', () => {
      render(
        <VariantPreviewCard
          componentType="button"
          variantName="Primary"
          spec={createButtonSpec()}
          status="failed"
        />
      );

      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    it('displays dne (does not exist) status', () => {
      render(
        <VariantPreviewCard
          componentType="button"
          variantName="Primary"
          spec={createButtonSpec()}
          status="dne"
        />
      );

      expect(screen.getByText('Does Not Exist')).toBeInTheDocument();
    });
  });

  describe('different component types', () => {
    it('renders card variant preview', () => {
      render(
        <VariantPreviewCard
          componentType="card"
          variantName="Elevated"
          spec={createCardSpec({ shadow: 'md' })}
        />
      );

      expect(screen.getByText('card')).toBeInTheDocument();
      expect(screen.getByText('Elevated')).toBeInTheDocument();
      expect(screen.getByText('Card Header')).toBeInTheDocument();
    });

    it('renders input variant preview', () => {
      render(
        <VariantPreviewCard componentType="input" variantName="Outlined" spec={createInputSpec()} />
      );

      expect(screen.getByText('input')).toBeInTheDocument();
      expect(screen.getByText('Outlined')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders text variant preview', () => {
      render(
        <VariantPreviewCard
          componentType="text"
          variantName="Heading"
          spec={createTextSpec({ size: '2xl', weight: 'bold' })}
        />
      );

      expect(screen.getByText('text')).toBeInTheDocument();
      expect(screen.getByText('Heading')).toBeInTheDocument();
      expect(screen.getByText(/Sample text content/)).toBeInTheDocument();
    });
  });
});
