
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@supabase/supabase-js";
import { LogOut, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({
        title: "Sign out failed",
        description: error.message || "An error occurred during sign out.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="py-2 px-3 rounded-md animate-pulse flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-muted"></div>
        <div className="h-4 bg-muted rounded w-24"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Link to="/auth">
        <Button variant="outline" className="w-full justify-start">
          <UserCircle className="mr-2 h-4 w-4" />
          Sign In
        </Button>
      </Link>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-md bg-sidebar-accent/30">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8 border border-border">
          <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
          <AvatarImage src={user.user_metadata.avatar_url} />
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium truncate max-w-[120px]">
            {user.email}
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSignOut}
        className="h-8 w-8"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
