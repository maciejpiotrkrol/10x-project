import { Home, User, PlusCircle } from "lucide-react";

interface BottomNavProps {
  currentPath: string;
}

/**
 * BottomNav component - mobile navigation (only visible on mobile)
 * Fixed bottom navigation with icons and labels
 * Visible only on mobile devices (md:hidden)
 */
export function BottomNav({ currentPath }: BottomNavProps) {
  const isActive = (path: string) => currentPath === path;

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
      </div>
    </nav>
  );
}
