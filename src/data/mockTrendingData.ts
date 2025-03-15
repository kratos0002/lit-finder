
import { TrendingItem } from "@/components/TrendingCard";
import { v4 as uuidv4 } from 'uuid';

export const mockTrendingItems: TrendingItem[] = [
  {
    id: uuidv4(),
    title: "'Three-Body Problem' TV Adaptation Breaks Streaming Records",
    source: "Entertainment Weekly",
    date: "2023-10-15",
    summary: "Netflix's adaptation of Liu Cixin's sci-fi masterpiece has become the platform's most-watched series of 2023.",
    url: "https://example.com/three-body-adaptation",
    category: "News"
  },
  {
    id: uuidv4(),
    title: "Margaret Atwood Announces New Dystopian Novel for 2024",
    source: "Literary Hub",
    date: "2023-10-12",
    summary: "The acclaimed author of 'The Handmaid's Tale' reveals her new work will explore climate change themes.",
    url: "https://example.com/atwood-novel",
    category: "News"
  },
  {
    id: uuidv4(),
    title: "'Readers are craving optimistic sci-fi': The rise of hopepunk literature",
    source: "The Guardian",
    date: "2023-10-08",
    summary: "As dystopian fiction sales decline, publishers report growing interest in sci-fi that offers solutions rather than despair.",
    url: "https://example.com/hopepunk-literature",
    category: "Articles"
  },
  {
    id: uuidv4(),
    title: "Book TikTok's latest obsession: Why everyone's reading this forgotten 90s fantasy series",
    source: "X (Twitter)",
    date: "2023-10-05",
    summary: "A 25-year-old fantasy trilogy has found new life after going viral on BookTok, selling out at major retailers.",
    url: "https://example.com/booktok-fantasy",
    category: "Social"
  },
  {
    id: uuidv4(),
    title: "Study Shows Reading Fiction Increases Empathy and Social Connection",
    source: "Psychology Today",
    date: "2023-09-30",
    summary: "New research confirms that regular fiction readers show measurably higher empathy levels and social cognition.",
    url: "https://example.com/reading-empathy",
    category: "Articles"
  },
  {
    id: uuidv4(),
    title: "Independent Bookstores Report Sales Surge as Readers 'Return to Print'",
    source: "Publishers Weekly",
    date: "2023-09-25",
    summary: "Despite digital alternatives, independent bookshops have seen a 15% increase in sales over the past year.",
    url: "https://example.com/bookstore-surge",
    category: "News"
  },
  {
    id: uuidv4(),
    title: "The Surprising Mathematics of 'Project Hail Mary': Author Reveals His Research Process",
    source: "Scientific American",
    date: "2023-09-22",
    summary: "Andy Weir shares how he developed the novel's scientific concepts and consulted with NASA scientists.",
    url: "https://example.com/hail-mary-math",
    category: "Articles"
  },
  {
    id: uuidv4(),
    title: "Book Club Revolution: How online communities are changing how we read",
    source: "Reddit",
    date: "2023-09-18",
    summary: "Virtual book clubs have grown 300% since 2020, creating global communities around shared reading experiences.",
    url: "https://example.com/online-bookclubs",
    category: "Social"
  }
];
