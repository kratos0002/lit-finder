
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import MyBooksPage from "./pages/MyBooksPage";
import SearchPage from "./pages/SearchPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import CategoryPage from "./pages/CategoryPage";

// Create a client
const queryClient = new QueryClient();

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/my-books" element={<MyBooksPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/category/:categoryId?" element={<CategoryPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
