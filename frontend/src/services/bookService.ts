/**
 * Book service for searching and managing books
 */

/**
 * Search for books based on a term
 * @param searchTerm - The term to search for
 * @returns An array of book objects
 */
export const searchBooks = async (searchTerm: string) => {
  // This is a simple implementation that returns mock data
  // In a real app, this would connect to a book API or database
  console.log(`Searching for books with term: ${searchTerm}`);
  
  // Return some mock books for now
  return [
    {
      id: '1',
      title: `Book about ${searchTerm}`,
      author: 'Example Author',
      summary: `A fascinating book related to ${searchTerm}.`,
      category: 'Fiction',
      match_score: 0.95
    },
    {
      id: '2',
      title: `Another ${searchTerm} Book`,
      author: 'Another Author',
      summary: `An interesting perspective on ${searchTerm}.`,
      category: 'Non-fiction',
      match_score: 0.85
    },
    {
      id: '3',
      title: `${searchTerm}: A History`,
      author: 'History Writer',
      summary: `The complete history of ${searchTerm} from ancient times to present day.`,
      category: 'History',
      match_score: 0.75
    }
  ];
}; 