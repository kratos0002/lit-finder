import React, { ReactNode, useState } from "react";
import { HomeIcon, ListIcon, XIcon, BookIcon, LibraryIcon } from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
  onSearch?: (query: string) => void;
}

// Import the necessary components or define simple versions
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export function MainLayout({ children, onSearch }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Get current path for navigation highlighting
  const currentPath = window.location.pathname;

  const navigation = [
    { name: "Discover", icon: HomeIcon, href: "/" },
    { name: "My Scrolls", icon: BookIcon, href: "/my-books" },
    { name: "Categories", icon: BookIcon, href: "/category" },
    { name: "Librarian's Ledger", icon: LibraryIcon, href: "/analytics" },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen flex relative bg-[#1d1e20]">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 bg-[#2b2b2b] backdrop-blur-sm",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0 md:static md:w-60"
        )}
      >
        <div className="h-full flex flex-col gap-y-5 overflow-y-auto border-r border-gray-800/50 bg-[#2b2b2b] px-4 py-6">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-x-2.5">
              <LibraryIcon className="w-7 h-7 text-[#d4af37]" />
              <span className="text-xl font-serif font-semibold text-gradient text-[#d4af37]">
                Alexandria
              </span>
            </a>
            <button 
              className="md:hidden text-white p-2"
              onClick={toggleSidebar}
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Sign In */}
          <div className="mt-3">
            <button className="flex items-center gap-2 text-white/80 hover:text-white px-3 py-2 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Sign In
            </button>
          </div>

          <nav className="flex flex-1 flex-col mt-6">
            <ul className="flex flex-1 flex-col gap-y-1.5">
              {navigation.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className={cn(
                      "group flex gap-x-3 p-2.5 text-sm font-medium rounded-md transition-colors",
                      currentPath === item.href
                        ? "bg-[#3a3a3a] text-white"
                        : "text-white/80 hover:bg-[#3a3a3a]/20 hover:text-white"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 md:px-6 border-b border-gray-800/30 bg-[#2b2b2b]/80 backdrop-blur-sm">
          <button 
            className="md:hidden mr-2 text-white p-2"
            onClick={toggleSidebar}
          >
            <ListIcon className="w-5 h-5" />
          </button>
          
          <div className="w-full max-w-md mx-auto">
            {onSearch && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="What literary treasure would you seek in Alexandria?"
                  className="w-full bg-[#3a3a3a] text-white border-none rounded-full px-4 py-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && onSearch) {
                      onSearch((e.target as HTMLInputElement).value);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 py-8 px-4 md:px-6 bg-[#1d1e20] text-white">
          {children}
        </main>
      </div>
    </div>
  );
} 