import { Leaf, Menu, LogOut, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { Link } from "wouter";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, isAuthenticated } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            {onMenuClick && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onMenuClick}
                data-testid="button-menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <Leaf className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold" data-testid="text-app-title">
                  NZLA Lawn Care Assistant
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Professional lawn care application guide
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/schedule">
              <Button 
                variant="ghost" 
                size="sm"
                data-testid="link-schedule"
                className="gap-2"
              >
                Year-Round Schedule
              </Button>
            </Link>
            <a
              href="https://www.newzealandlawnaddicts.com/application-guide"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-nzla-external"
            >
              <Button 
                variant="ghost" 
                size="sm"
                className="gap-2"
              >
                NZLA Guide
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
            <ThemeToggle />
            {isAuthenticated && user && (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={(user as User).profileImageUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getUserInitials(user as User)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline" data-testid="text-user-name">
                    {(user as User).firstName && (user as User).lastName 
                      ? `${(user as User).firstName} ${(user as User).lastName}`
                      : (user as User).email || "User"
                    }
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleLogout}
                  data-testid="button-logout"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}