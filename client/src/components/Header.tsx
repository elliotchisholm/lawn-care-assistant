import { Leaf, Menu, LogOut, ExternalLink, LogIn, LayoutDashboard } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const getUserInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            {onMenuClick && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onMenuClick}
                data-testid="button-menu"
                className="shrink-0"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary shrink-0">
                <Leaf className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm md:text-lg font-semibold truncate" data-testid="text-app-title">
                  NZLA Lawn Care Assistant
                </h1>
                <p className="text-xs text-muted-foreground hidden md:block">
                  Professional lawn care application guide
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <a
              href="https://www.newzealandlawnaddicts.com/application-guide"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-nzla-external"
              className="hidden sm:inline-block"
            >
              <Button 
                variant="ghost" 
                size="sm"
                className="gap-2"
              >
                <span className="hidden lg:inline">NZLA Guide</span>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
            <ThemeToggle />
            {isAuthenticated && user ? (
              <>
                {location !== "/dashboard" && (
                  <Link href="/dashboard">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="gap-2"
                      data-testid="button-dashboard"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span className="hidden md:inline">Dashboard</span>
                    </Button>
                  </Link>
                )}
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={(user as User).profileImageUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getUserInitials(user as User)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline truncate max-w-[120px]" data-testid="text-user-name">
                    {(user as User).firstName && (user as User).lastName 
                      ? `${(user as User).firstName} ${(user as User).lastName}`
                      : (user as User).email || "User"
                    }
                  </span>
                </div>
                <Avatar className="h-8 w-8 sm:hidden">
                  <AvatarImage src={(user as User).profileImageUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {getUserInitials(user as User)}
                  </AvatarFallback>
                </Avatar>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleLogout}
                  data-testid="button-logout"
                  title="Logout"
                  className="shrink-0"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button 
                variant="default" 
                size="sm"
                onClick={handleLogin}
                data-testid="button-login"
                className="gap-2"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}