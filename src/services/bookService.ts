
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

  return data.map(formatBook);
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

  return data.map(formatBook);
}

export async function searchBooks(query: string): Promise<Book[]> {
  try {
    console.log('Searching for books with query:', query);
    
    // First check for existing books
    const { data: existingBooks, error: searchError } = await supabase
      .from('books')
      .select('*')
      .or(`title.ilike.%${query}%,author.ilike.%${query}%,description.ilike.%${query}%,summary.ilike.%${query}%`);

    if (searchError) {
      console.error('Error searching existing books:', searchError);
      throw new Error('Error searching books');
    }

    if (existingBooks.length >= 5) {
      console.log('Found sufficient existing books for query:', query);
      return existingBooks.map(formatBook);
    }

    console.log('Getting fresh recommendations for:', query);
    
    // Get new recommendations
    try {
      const recommendations = await getRecommendations(query);
      
      if (recommendations.length > 0) {
        console.log(`Storing ${recommendations.length} new recommendations`);
        await storeRecommendations(recommendations);
      }

      return [...existingBooks.map(formatBook), ...recommendations];
    } catch (recError: any) {
      console.error('Error getting recommendations:', recError);
      // If we fail to get new recommendations, return what we have
      if (existingBooks.length > 0) {
        return existingBooks.map(formatBook);
      }
      throw new Error(recError.message || 'Failed to get book recommendations');
    }
  } catch (error: any) {
    console.error('Error in searchBooks:', error);
    throw error;
  }
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
    return formatBook(book);
  });
}

async function getRecommendations(query: string): Promise<Book[]> {
  try {
    console.log('Calling perplexity-books function with query:', query);
    
    const perplexityResponse = await supabase.functions.invoke('perplexity-books', {
      body: { query }
    });
    
    if (perplexityResponse.error) {
      console.error('Error from Perplexity function:', perplexityResponse.error);
      throw new Error('Failed to get Perplexity recommendations');
    }
    
    const perplexityBooks = perplexityResponse.data?.books || [];
    console.log(`Received ${perplexityBooks.length} recommendations from Perplexity`);
    
    if (perplexityBooks.length === 0) {
      console.log('No books from Perplexity, trying OpenAI');
      const openaiResponse = await supabase.functions.invoke('openai-recommendations', {
        body: { 
          query, 
          existingBooks: [] 
        }
      });
      
      if (openaiResponse.error) {
        console.error('Error from OpenAI function:', openaiResponse.error);
        throw new Error('Failed to get OpenAI recommendations');
      }
      
      const openaiBooks = openaiResponse.data?.books || [];
      console.log(`Received ${openaiBooks.length} recommendations from OpenAI`);
      
      return openaiBooks.map((book: any) => ({
        id: book.id || crypto.randomUUID(),
        title: book.title,
        author: book.author,
        description: book.description,
        summary: book.summary,
        category: book.category,
        matchScore: book.matchScore,
        publicationDate: book.publicationDate || '',
        source: book.source,
        coverImage: `https://source.unsplash.com/400x600/?book,${encodeURIComponent(book.category)}`
      }));
    }
    
    // Process and return Perplexity books
    return perplexityBooks.map((book: any) => ({
      id: book.id || crypto.randomUUID(),
      title: book.title,
      author: book.author,
      description: book.description,
      summary: book.summary,
      category: book.category,
      matchScore: book.matchScore,
      publicationDate: book.publicationDate || '',
      source: book.source,
      coverImage: `https://source.unsplash.com/400x600/?book,${encodeURIComponent(book.category)}`
    }));
  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw error;
  }
}

async function storeRecommendations(books: Book[]): Promise<void> {
  try {
    const booksToInsert = books.map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      description: book.description,
      summary: book.summary,
      category: book.category,
      match_score: book.matchScore,
      publication_date: book.publicationDate || null,
      source: book.source,
      cover_image: book.coverImage
    }));
    
    const { error } = await supabase
      .from('books')
      .upsert(booksToInsert, { onConflict: 'id' });
    
    if (error) {
      console.error('Error storing recommendations:', error);
    } else {
      console.log(`Successfully stored ${booksToInsert.length} recommendations`);
    }
  } catch (error) {
    console.error('Error in storeRecommendations:', error);
  }
}

function formatBook(book: any): Book {
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
}
