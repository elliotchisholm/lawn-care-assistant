import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from './test-utils';
import Login from '@/pages/Login';

const fetchMock = vi.fn();

function fill(value: string) {
  fireEvent.change(screen.getByTestId('input-password'), { target: { value } });
}

describe('Login', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('disables submit until a password is entered', () => {
    render(<Login />);
    expect(screen.getByTestId('button-submit-login')).toBeDisabled();
    fill('secret');
    expect(screen.getByTestId('button-submit-login')).toBeEnabled();
  });

  it('toggles password visibility', () => {
    render(<Login />);
    const input = screen.getByTestId('input-password');
    expect(input).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByTestId('button-toggle-password'));
    expect(input).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByTestId('button-toggle-password'));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('posts the password to /api/login', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));
    render(<Login />);
    fill('secret');
    fireEvent.click(screen.getByTestId('button-submit-login'));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/login');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ password: 'secret' });
  });

  it.each([
    [401, 'Incorrect password.'],
    [429, 'Too many failed attempts. Try again in 15 minutes.'],
    [500, 'Sign in failed. Please try again.'],
  ])('shows an error for status %i', async (status, message) => {
    fetchMock.mockResolvedValue(new Response('{}', { status }));
    render(<Login />);
    fill('bad');
    fireEvent.click(screen.getByTestId('button-submit-login'));
    expect(await screen.findByTestId('text-login-error')).toHaveTextContent(message);
  });

  it('shows a network error when the server is unreachable', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    render(<Login />);
    fill('x');
    fireEvent.click(screen.getByTestId('button-submit-login'));
    expect(await screen.findByTestId('text-login-error')).toHaveTextContent('Unable to reach the server');
  });
});
