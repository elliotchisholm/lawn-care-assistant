import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from './test-utils';
import Header from '@/components/Header';

const mockUseAuth = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    });

    it('renders the app title', () => {
      render(<Header />);
      expect(screen.getByTestId('text-app-title')).toHaveTextContent('NZLA Lawn Care Assistant');
    });

    it('shows login button', () => {
      render(<Header />);
      expect(screen.getByTestId('button-login')).toBeInTheDocument();
    });

    it('does not show logout button', () => {
      render(<Header />);
      expect(screen.queryByTestId('button-logout')).not.toBeInTheDocument();
    });

    it('shows external NZLA guide link', () => {
      render(<Header />);
      const link = screen.getByTestId('link-nzla-external');
      expect(link).toHaveAttribute('href', 'https://www.newzealandlawnaddicts.com/application-guide');
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  describe('when user is authenticated', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      profileImageUrl: null,
      lawnSize: 100,
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
      });
    });

    it('shows user name', () => {
      render(<Header />);
      expect(screen.getByTestId('text-user-name')).toHaveTextContent('John Doe');
    });

    it('shows logout button', () => {
      render(<Header />);
      expect(screen.getByTestId('button-logout')).toBeInTheDocument();
    });

    it('does not show login button', () => {
      render(<Header />);
      expect(screen.queryByTestId('button-login')).not.toBeInTheDocument();
    });
  });

  describe('menu button', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    });

    it('renders menu button when onMenuClick is provided', () => {
      const onMenuClick = vi.fn();
      render(<Header onMenuClick={onMenuClick} />);
      expect(screen.getByTestId('button-menu')).toBeInTheDocument();
    });

    it('calls onMenuClick when menu button is clicked', () => {
      const onMenuClick = vi.fn();
      render(<Header onMenuClick={onMenuClick} />);
      
      fireEvent.click(screen.getByTestId('button-menu'));
      expect(onMenuClick).toHaveBeenCalledTimes(1);
    });

    it('does not render menu button when onMenuClick is not provided', () => {
      render(<Header />);
      expect(screen.queryByTestId('button-menu')).not.toBeInTheDocument();
    });
  });
});
