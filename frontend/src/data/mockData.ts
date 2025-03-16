/**
 * Mock data for development and testing
 */

/**
 * Mock book reviews
 */
export const mockReviews = [
  {
    id: '1',
    title: 'A Brilliant Analysis',
    author: 'Literary Critic',
    source: 'Book Review Magazine',
    date: new Date().toISOString().split('T')[0],
    summary: 'This book is a masterpiece of modern literature, combining deep character development with intricate plotting.',
    url: 'https://example.com/review1',
    match_score: 0.9
  },
  {
    id: '2',
    title: 'Mixed Feelings About This Work',
    author: 'Reader Review',
    source: 'Goodreads',
    date: new Date().toISOString().split('T')[0],
    summary: 'While the prose is elegant, the pacing drags in the middle sections. Overall worth reading but be prepared for slow parts.',
    url: 'https://example.com/review2',
    match_score: 0.7
  },
  {
    id: '3',
    title: 'A Modern Classic',
    author: 'Academic Review',
    source: 'Literary Journal',
    date: new Date().toISOString().split('T')[0],
    summary: 'This book will likely be studied in literature courses for years to come. A profound exploration of human nature.',
    url: 'https://example.com/review3',
    match_score: 0.85
  }
];

/**
 * Mock social media posts
 */
export const mockSocialPosts = [
  {
    id: '1',
    title: 'Why Everyone Should Read This Book',
    author: 'BookInfluencer',
    source: 'X (Twitter)',
    date: new Date().toISOString().split('T')[0],
    summary: 'Just finished this amazing book! The way the author explores themes of identity is revolutionary. #MustRead',
    url: 'https://example.com/tweet1',
    match_score: 0.8
  },
  {
    id: '2',
    title: 'Book Club Discussion Thread',
    author: 'LiteraryCircle',
    source: 'Reddit',
    date: new Date().toISOString().split('T')[0],
    summary: 'Our monthly book club selection has sparked the most engaging discussion we\'ve had all year. Join the conversation!',
    url: 'https://example.com/reddit1',
    match_score: 0.75
  },
  {
    id: '3',
    title: 'The Book That Changed My Perspective',
    author: 'DeepReader',
    source: 'Medium',
    date: new Date().toISOString().split('T')[0],
    summary: 'An in-depth analysis of how this book challenged my worldview and opened my eyes to new possibilities.',
    url: 'https://example.com/medium1',
    match_score: 0.85
  }
]; 