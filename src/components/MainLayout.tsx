
import { ReactNode, useState } from "react";
import { BookOpen, Home, List, MessageCircle, PieChart, Scroll, X, BookText, LibraryBig } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/SearchBar";
import { UserProfile } from "@/components/UserProfile";

interface MainLayoutProps {
  children: ReactNode;
  onSearch?: (query: string) => void;
}

export function MainLayout({ children, onSearch }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: "Discover", icon: Home, href: "/" },
    { name: "My Scrolls", icon: Scroll, href: "/my-books" },
    { name: "Categories", icon: BookText, href: "/category" },
    { name: "Librarian's Ledger", icon: PieChart, href: "/analytics" },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 bg-sidebar/95 backdrop-blur-sm",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0 md:static md:w-60"
        )}
      >
        <div className="h-full flex flex-col gap-y-5 overflow-y-auto border-r border-sidebar-border/50 bg-sidebar/95 px-4 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-x-2.5">
              <LibraryBig className="w-7 h-7 text-primary" />
              <span className="text-xl font-serif font-semibold text-gradient">
                Alexandria
              </span>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
              className="md:hidden"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* User Profile */}
          <div className="mt-3">
            <UserProfile />
          </div>

          <nav className="flex flex-1 flex-col mt-6">
            <ul className="flex flex-1 flex-col gap-y-1.5">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      "group flex gap-x-3 p-2.5 text-sm font-medium rounded-md transition-colors",
                      location.pathname === item.href
                        ? "bg-sidebar-accent/90 text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 md:px-6 border-b border-border/30 bg-background/80 backdrop-blur-sm">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="md:hidden mr-2"
          >
            <List className="w-5 h-5" />
          </Button>
          
          <div className="w-full max-w-md mx-auto">
            {onSearch && <SearchBar onSearch={onSearch} placeholder="What literary treasure would you seek in Alexandria?" />}
          </div>
        </header>

        <main className="flex-1 py-8 px-4 md:px-6 bg-[#f5e8c7]/5">
          {children}
        </main>
      </div>

      {/* Scribe's Counsel chat button */}
      <Button
        onClick={toggleChat}
        className={cn(
          "fixed z-50 bottom-6 right-6 rounded-full w-12 h-12 shadow-lg hover-lift",
          isChatOpen ? "bg-destructive hover:bg-destructive/90" : "bg-secondary hover:bg-secondary/90"
        )}
      >
        {isChatOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </Button>

      {/* Chat window */}
      {isChatOpen && (
        <div className="fixed z-40 bottom-24 right-6 w-80 md:w-96 h-96 rounded-xl bg-card/95 backdrop-blur-sm border border-border/50 shadow-xl animate-fade-in">
          <div className="flex items-center justify-between p-4 border-b border-border/30">
            <h3 className="font-serif font-medium">Scribe's Counsel</h3>
            <Button variant="ghost" size="icon" onClick={toggleChat}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-4 h-[calc(100%-64px)] overflow-y-auto">
            <div className="bg-muted/50 rounded-lg p-3 mb-3 text-sm">
              Share your wisdom on these treasures. What would you like to discuss?
            </div>
            {/* We'll add chat functionality later */}
            <p className="text-sm text-muted-foreground text-center mt-6">
              This is a placeholder for the chat interface. We'll implement this functionality once we connect to Supabase.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
