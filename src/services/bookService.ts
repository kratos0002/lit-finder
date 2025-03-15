
import { supabase } from "@/integrations/supabase/client";
import { Book } from "@/types";

export async function getBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*');

  if (error) {
    console.error('Error fetching books:', error);
    return [];
  }

  return data.map(book => ({
    id: book.id,
    title: book.title,
    author: book.author,
    coverImage: book.cover_image || '',
    description: book.description,
    summary: book.summary,
    category: book.category,
    matchScore: book.match_score,
    publicationDate: book.publication_date || '',
    source: book.source as "perplexity" | "openai" | "goodreads"
  }));
}

export async function getBooksByCategory(category: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('category', category);

  if (error) {
    console.error('Error fetching books by category:', error);
    return [];
  }

  return data.map(book => ({
    id: book.id,
    title: book.title,
    author: book.author,
    coverImage: book.cover_image || '',
    description: book.description,
    summary: book.summary,
    category: book.category,
    matchScore: book.match_score,
    publicationDate: book.publication_date || '',
    source: book.source as "perplexity" | "openai" | "goodreads"
  }));
}

export async function searchBooks(query: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .or(`title.ilike.%${query}%,author.ilike.%${query}%,description.ilike.%${query}%,summary.ilike.%${query}%`);

  if (error) {
    console.error('Error searching books:', error);
    return [];
  }

  return data.map(book => ({
    id: book.id,
    title: book.title,
    author: book.author,
    coverImage: book.cover_image || '',
    description: book.description,
    summary: book.summary,
    category: book.category,
    matchScore: book.match_score,
    publicationDate: book.publication_date || '',
    source: book.source as "perplexity" | "openai" | "goodreads"
  }));
}

export async function saveBook(bookId: string, userId: string | undefined): Promise<boolean> {
  if (!userId) return false;
  
  const { error } = await supabase
    .from('saved_books')
    .insert({ book_id: bookId, user_id: userId });

  if (error) {
    console.error('Error saving book:', error);
    return false;
  }

  return true;
}

export async function removeSavedBook(bookId: string, userId: string | undefined): Promise<boolean> {
  if (!userId) return false;
  
  const { error } = await supabase
    .from('saved_books')
    .delete()
    .eq('book_id', bookId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing saved book:', error);
    return false;
  }

  return true;
}

export async function getSavedBooks(userId: string | undefined): Promise<Book[]> {
  if (!userId) return [];
  
  const { data, error } = await supabase
    .from('saved_books')
    .select('book_id, books(*)')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching saved books:', error);
    return [];
  }

  return data.map(item => {
    const book = item.books;
    return {
      id: book.id,
      title: book.title,
      author: book.author,
      coverImage: book.cover_image || '',
      description: book.description,
      summary: book.summary,
      category: book.category,
      matchScore: book.match_score,
      publicationDate: book.publication_date || '',
      source: book.source as "perplexity" | "openai" | "goodreads"
    };
  });
}
