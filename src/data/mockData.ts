
import { Book, Review, SocialPost } from "@/types";

export const mockBooks: Book[] = [
  {
    id: "1",
    title: "Three Body Problem",
    author: "Cixin Liu",
    coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop",
    description: "Set against the backdrop of China's Cultural Revolution, a secret military project sends signals into space to establish contact with aliens. An alien civilization on the brink of destruction captures the signal and plans to invade Earth.",
    summary: "A groundbreaking sci-fi novel exploring first contact, cosmic sociology, and humanity's place in the universe.",
    category: "Novel",
    matchScore: 98,
    publicationDate: "2008-01-01",
    source: "perplexity"
  },
  {
    id: "2",
    title: "Project Hail Mary",
    author: "Andy Weir",
    coverImage: "https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?q=80&w=800&auto=format&fit=crop",
    description: "Ryland Grace is the sole survivor on a desperate, last-chance mission—and if he fails, humanity and the Earth itself will perish. Except that right now, he doesn't know that.",
    summary: "An inventive space adventure featuring unexpected alien cooperation and creative scientific problem-solving.",
    category: "Novel",
    matchScore: 89,
    publicationDate: "2021-05-04",
    source: "openai"
  },
  {
    id: "3",
    title: "Contact",
    author: "Carl Sagan",
    coverImage: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=800&auto=format&fit=crop",
    description: "The story of a radio astronomer who receives the first extraterrestrial radio signal, proving the existence of intelligent alien life.",
    summary: "A philosophical exploration of the tension between science and faith through the lens of first contact.",
    category: "Novel",
    matchScore: 87,
    publicationDate: "1985-09-01",
    source: "goodreads"
  },
  {
    id: "4",
    title: "Roadside Picnic",
    author: "Arkady and Boris Strugatsky",
    coverImage: "https://images.unsplash.com/photo-1511108690759-009324a90311?q=80&w=800&auto=format&fit=crop",
    description: "The novel is set in the aftermath of an alien visitation, focusing on the 'zones' containing alien artifacts and phenomena that are dangerous and incomprehensible.",
    summary: "A Soviet-era masterpiece that inspired the film 'Stalker', exploring humans scavenging alien artifacts.",
    category: "Novel",
    matchScore: 85,
    publicationDate: "1972-01-01",
    source: "perplexity"
  },
  {
    id: "5",
    title: "Blindsight",
    author: "Peter Watts",
    coverImage: "https://images.unsplash.com/photo-1610882648335-eda13a0fcd85?q=80&w=800&auto=format&fit=crop",
    description: "In the late 21st century, a vessel is dispatched to the edge of the solar system to investigate a massive alien artifact.",
    summary: "A hard sci-fi exploration of consciousness, intelligence, and the nature of extraterrestrial life.",
    category: "Novel",
    matchScore: 83,
    publicationDate: "2006-10-03",
    source: "openai"
  },
  {
    id: "6",
    title: "The Forever War",
    author: "Joe Haldeman",
    coverImage: "https://images.unsplash.com/photo-1518281361980-b26bfd556770?q=80&w=800&auto=format&fit=crop",
    description: "The Earth's leaders have drawn a line in the interstellar sand—despite the fact that the fierce alien enemy they would oppose is inscrutable, unconquerable, and very far away.",
    summary: "A military sci-fi classic exploring the psychological effects of time dilation on interstellar combat.",
    category: "Novel",
    matchScore: 81,
    publicationDate: "1974-01-01",
    source: "goodreads"
  },
];

export const mockReviews: Review[] = [
  {
    id: "1",
    title: "The Three-Body Problem and the Evolution of Chinese Science Fiction",
    source: "Literary Journal",
    date: "2023-05-15",
    summary: "An in-depth analysis of how Liu's novel revolutionized Chinese science fiction and brought it to global prominence.",
    link: "#"
  },
  {
    id: "2",
    title: "Cosmic Horror and Scientific Realism in Modern Sci-Fi",
    source: "Sci-Fi Review",
    date: "2023-04-22",
    summary: "Examining how recent works like Three Body Problem blend cosmic horror with hard science concepts.",
    link: "#"
  },
  {
    id: "3",
    title: "First Contact Narratives Through History",
    source: "Book Analysis",
    date: "2023-03-10",
    summary: "A comprehensive look at how alien contact stories have evolved from Wells to Liu.",
    link: "#"
  }
];

export const mockSocialPosts: SocialPost[] = [
  {
    id: "1",
    title: "Three Body Problem's Fermi Paradox Solution Explained",
    source: "Reddit r/scifi",
    date: "2023-05-20",
    summary: "A detailed thread analyzing Liu's unique approach to solving the Fermi Paradox through the 'dark forest' theory.",
    link: "#"
  },
  {
    id: "2",
    title: "How Three Body Problem Changed My View of Physics",
    source: "Twitter Thread",
    date: "2023-05-18",
    summary: "A viral thread by a physicist explaining how the novel's concepts relate to actual physics principles.",
    link: "#"
  },
  {
    id: "3",
    title: "Netflix Adaptation: What to Expect",
    source: "Facebook Group",
    date: "2023-05-12",
    summary: "A discussion about the upcoming Netflix adaptation and how it might handle the novel's complex ideas.",
    link: "#"
  }
];
