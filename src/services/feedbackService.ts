
import { supabase } from "@/integrations/supabase/client";
import { FeedbackMessage } from "@/types";

export async function submitFeedback(feedback: Omit<FeedbackMessage, 'id' | 'timestamp'>): Promise<boolean> {
  const { error } = await supabase
    .from('user_feedback')
    .insert({
      user_id: feedback.userId,
      type: feedback.type,
      message: feedback.message,
    });

  if (error) {
    console.error('Error submitting feedback:', error);
    return false;
  }

  return true;
}

export async function getFeedbackForUser(userId: string): Promise<FeedbackMessage[]> {
  const { data, error } = await supabase
    .from('user_feedback')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching feedback:', error);
    return [];
  }

  return data.map(item => ({
    id: item.id,
    userId: item.user_id || '',
    type: item.type as "feature" | "issue" | "other",
    message: item.message,
    timestamp: item.timestamp,
  }));
}
