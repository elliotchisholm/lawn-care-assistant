import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from './test-utils';
import userEvent from '@testing-library/user-event';
import LawnSizeCalculator from '@/components/LawnSizeCalculator';

describe('LawnSizeCalculator', () => {
  const defaultProps = {
    onSizeChange: vi.fn(),
    currentSize: 100,
    isSaving: false,
    isLoading: false,
    saveSuccess: false,
  };

  it('renders the calculator card', () => {
    render(<LawnSizeCalculator {...defaultProps} />);
    
    expect(screen.getByTestId('card-lawn-calculator')).toBeInTheDocument();
    expect(screen.getByText('Lawn Size Calculator')).toBeInTheDocument();
  });

  it('displays the current lawn size in input', () => {
    render(<LawnSizeCalculator {...defaultProps} currentSize={200} />);
    
    const input = screen.getByTestId('input-lawn-size') as HTMLInputElement;
    expect(input.value).toBe('200');
  });

  it('calls onSizeChange when form is submitted', async () => {
    const onSizeChange = vi.fn();
    render(<LawnSizeCalculator {...defaultProps} onSizeChange={onSizeChange} />);
    
    const input = screen.getByTestId('input-lawn-size');
    const button = screen.getByTestId('button-calculate');
    
    await userEvent.clear(input);
    await userEvent.type(input, '250');
    fireEvent.click(button);
    
    expect(onSizeChange).toHaveBeenCalledWith(250);
  });

  it('shows loading state when isSaving is true', () => {
    render(<LawnSizeCalculator {...defaultProps} isSaving={true} />);
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByTestId('button-calculate')).toBeDisabled();
  });

  it('disables input and button when isLoading is true', () => {
    render(<LawnSizeCalculator {...defaultProps} isLoading={true} />);
    
    expect(screen.getByTestId('input-lawn-size')).toBeDisabled();
    expect(screen.getByTestId('button-calculate')).toBeDisabled();
  });

  it('shows saved indicator when saveSuccess is true', async () => {
    const { rerender } = render(<LawnSizeCalculator {...defaultProps} saveSuccess={false} />);
    
    expect(screen.queryByTestId('text-saved-indicator')).not.toBeInTheDocument();
    
    rerender(<LawnSizeCalculator {...defaultProps} saveSuccess={true} />);
    
    expect(screen.getByTestId('text-saved-indicator')).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('does not call onSizeChange for invalid input', async () => {
    const onSizeChange = vi.fn();
    render(<LawnSizeCalculator {...defaultProps} onSizeChange={onSizeChange} currentSize={0} />);
    
    const button = screen.getByTestId('button-calculate');
    fireEvent.click(button);
    
    expect(onSizeChange).not.toHaveBeenCalled();
  });

  it('updates input value when user types', async () => {
    render(<LawnSizeCalculator {...defaultProps} />);
    
    const input = screen.getByTestId('input-lawn-size') as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, '300');
    
    expect(input.value).toBe('300');
  });
});
