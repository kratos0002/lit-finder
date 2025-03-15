
export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  description: string;
  rating: number;
  categories: string[];
  year: number;
  pages: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export const categories: Category[] = [
  {
    id: "fiction",
    name: "Fiction",
    description: "Immerse yourself in imagined worlds and stories",
  },
  {
    id: "non-fiction",
    name: "Non-Fiction",
    description: "Discover real-world knowledge and insights",
  },
  {
    id: "science-fiction",
    name: "Science Fiction",
    description: "Explore futuristic concepts and technologies",
  },
  {
    id: "fantasy",
    name: "Fantasy",
    description: "Journey through magical realms and epic adventures",
  },
  {
    id: "mystery",
    name: "Mystery",
    description: "Unravel puzzling plots and suspenseful stories",
  },
  {
    id: "biography",
    name: "Biography",
    description: "Learn about remarkable lives and experiences",
  },
  {
    id: "history",
    name: "History",
    description: "Dive into events and stories from the past",
  },
  {
    id: "self-help",
    name: "Self-Help",
    description: "Find guidance for personal growth and improvement",
  },
];

export const books: Book[] = [
  {
    id: "1",
    title: "The Design of Everyday Things",
    author: "Don Norman",
    coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop",
    description: "A powerful primer on how—and why—some products satisfy customers while others only frustrate them.",
    rating: 4.5,
    categories: ["non-fiction", "design"],
    year: 2013,
    pages: 368,
  },
  {
    id: "2",
    title: "Project Hail Mary",
    author: "Andy Weir",
    coverImage: "https://images.unsplash.com/photo-1465929639680-64ee080eb3ed?q=80&w=800&auto=format&fit=crop",
    description: "A lone astronaut must save the earth from disaster in this incredible new science-based thriller.",
    rating: 4.8,
    categories: ["fiction", "science-fiction"],
    year: 2021,
    pages: 496,
  },
  {
    id: "3",
    title: "Atomic Habits",
    author: "James Clear",
    coverImage: "https://images.unsplash.com/photo-1535398089889-dd807df1dfaa?q=80&w=800&auto=format&fit=crop",
    description: "A revolutionary system to get 1 percent better every day.",
    rating: 4.7,
    categories: ["non-fiction", "self-help"],
    year: 2018,
    pages: 320,
  },
  {
    id: "4",
    title: "Dune",
    author: "Frank Herbert",
    coverImage: "https://images.unsplash.com/photo-1589409514187-c21d14df0d04?q=80&w=800&auto=format&fit=crop",
    description: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world.",
    rating: 4.6,
    categories: ["fiction", "science-fiction", "fantasy"],
    year: 1965,
    pages: 688,
  },
  {
    id: "5",
    title: "Educated",
    author: "Tara Westover",
    coverImage: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=800&auto=format&fit=crop",
    description: "A memoir about a young girl who, kept out of school, leaves her survivalist family and goes on to earn a PhD from Cambridge University.",
    rating: 4.5,
    categories: ["non-fiction", "biography", "memoir"],
    year: 2018,
    pages: 352,
  },
  {
    id: "6",
    title: "The Midnight Library",
    author: "Matt Haig",
    coverImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop",
    description: "Between life and death there is a library filled with books containing different versions of the life you could have lived.",
    rating: 4.2,
    categories: ["fiction", "fantasy"],
    year: 2020,
    pages: 304,
  },
  {
    id: "7",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    coverImage: "https://images.unsplash.com/photo-1584448097764-374f81551427?q=80&w=800&auto=format&fit=crop",
    description: "A brief history of humankind, exploring the ways in which biology and history have defined us.",
    rating: 4.6,
    categories: ["non-fiction", "history", "science"],
    year: 2015,
    pages: 464,
  },
  {
    id: "8",
    title: "The Silent Patient",
    author: "Alex Michaelides",
    coverImage: "https://images.unsplash.com/photo-1594312915251-48db9280c8f1?q=80&w=800&auto=format&fit=crop",
    description: "A woman shoots her husband five times and then never speaks another word.",
    rating: 4.3,
    categories: ["fiction", "mystery", "thriller"],
    year: 2019,
    pages: 336,
  },
];

export const getBooksByCategory = (categoryId: string): Book[] => {
  return books.filter(book => book.categories.includes(categoryId));
};

export const searchBooks = (query: string): Book[] => {
  const lowerCaseQuery = query.toLowerCase();
  return books.filter(book => 
    book.title.toLowerCase().includes(lowerCaseQuery) || 
    book.author.toLowerCase().includes(lowerCaseQuery) ||
    book.description.toLowerCase().includes(lowerCaseQuery)
  );
};
