import { Home, User, PlusCircle, LogOut } from "lucide-react";
import { useState } from "react";

interface BottomNavProps {
  currentPath: string;
}

/**
 * BottomNav component - mobile navigation (only visible on mobile)
 * Fixed bottom navigation with icons and labels
 * Visible only on mobile devices (md:hidden)
 */
export function BottomNav({ currentPath }: BottomNavProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isActive = (path: string) => currentPath === path;

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      const response = await fetch("/api/auth/signout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Success - redirect to login page
        window.location.href = "/auth/login";
      } else {
        // Error
        console.error("Logout failed:", response.status);
        alert("Wystąpił błąd podczas wylogowywania. Spróbuj ponownie.");
        setIsLoggingOut(false);
      }
    } catch (error) {
      // Network error
      console.error("Logout error:", error);
      alert("Wystąpił błąd podczas wylogowywania. Sprawdź połączenie internetowe.");
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    {
      href: "/dashboard",
      icon: Home,
      label: "Dashboard",
      active: isActive("/dashboard"),
    },
    {
      href: "/profile",
      icon: User,
      label: "Profil",
      active: isActive("/profile"),
    },
    {
      href: "/survey",
      icon: PlusCircle,
      label: "Nowy Plan",
      active: isActive("/survey"),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
                item.active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-current={item.active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </a>
          );
        })}

        {/* Logout button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex flex-col items-center justify-center gap-1 w-full h-full transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
          aria-label="Wyloguj się"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-xs font-medium">{isLoggingOut ? "Wyloguj..." : "Wyloguj"}</span>
        </button>
      </div>
    </nav>
  );
}
