
import { ReactNode, useState } from "react";
import { BookOpen, Home, List, MessageCircle, PieChart, Search, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/SearchBar";

interface MainLayoutProps {
  children: ReactNode;
  onSearch?: (query: string) => void;
}

export function MainLayout({ children, onSearch }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: "Home", icon: Home, href: "/" },
    { name: "Search", icon: Search, href: "/search" },
    { name: "My Books", icon: BookOpen, href: "/my-books" },
    { name: "Analytics", icon: PieChart, href: "/analytics" },
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
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 bg-sidebar",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0 md:static md:w-60"
        )}
      >
        <div className="h-full flex flex-col gap-y-5 overflow-y-auto border-r border-sidebar-border bg-sidebar px-4 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-x-3">
              <BookOpen className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                LiteratureDiscovery
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

          <nav className="flex flex-1 flex-col mt-10">
            <ul className="flex flex-1 flex-col gap-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      "group flex gap-x-3 p-3 text-sm font-medium rounded-md",
                      location.pathname === item.href
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground"
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
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 md:px-6 border-b bg-background/80 backdrop-blur-sm">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="md:hidden mr-2"
          >
            <List className="w-5 h-5" />
          </Button>
          
          <div className="w-full max-w-md mx-auto">
            {onSearch && <SearchBar onSearch={onSearch} />}
          </div>
        </header>

        <main className="flex-1 py-6 px-4 md:px-6">
          {children}
        </main>
      </div>

      {/* Feedback chatbot button */}
      <Button
        onClick={toggleChat}
        className={cn(
          "fixed z-50 bottom-6 right-6 rounded-full w-14 h-14 shadow-lg",
          isChatOpen ? "bg-destructive hover:bg-destructive/90" : "bg-secondary hover:bg-secondary/90"
        )}
      >
        {isChatOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </Button>

      {/* Chat window */}
      {isChatOpen && (
        <div className="fixed z-40 bottom-24 right-6 w-80 md:w-96 h-96 rounded-xl bg-card border border-border shadow-xl animate-fade-in">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-medium">Feedback & Help</h3>
            <Button variant="ghost" size="icon" onClick={toggleChat}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-4 h-[calc(100%-64px)] overflow-y-auto">
            <div className="bg-muted rounded-lg p-3 mb-3 text-sm">
              What would you like to share? A new feature idea, something missing, or an issue?
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
