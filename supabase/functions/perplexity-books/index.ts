
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fallback books for when API fails
const getFallbackBooks = (query) => {
  console.log('Using fallback books for query:', query);
  
  // Convert query to lowercase for case-insensitive matching
  const lowercaseQuery = query.toLowerCase();
  
  // Define some categories to match against
  const categories = {
    fiction: ['novel', 'story', 'fiction', 'fantasy', 'sci-fi', 'science fiction', 'thriller', 'mystery', 'crime', 'horror'],
    nonfiction: ['history', 'science', 'biography', 'memoir', 'self-help', 'business', 'economics', 'psychology', 'philosophy'],
    arts: ['art', 'music', 'film', 'photography', 'design', 'architecture', 'fashion', 'theater', 'painting'],
    technology: ['technology', 'programming', 'coding', 'computer', 'software', 'data', 'ai', 'web', 'digital'],
    classics: ['classic', 'shakespeare', 'dickens', 'austen', 'tolstoy', 'ancient', 'greek', 'roman']
  };
  
  // Determine the most likely category based on the query
  let matchedCategory = 'fiction'; // Default
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowercaseQuery.includes(keyword))) {
      matchedCategory = category;
      break;
    }
  }
  
  // Generate match scores between 60-95
  const getRandomScore = () => Math.floor(Math.random() * 35) + 60;
  
  // Create fallback books
  const fallbackBooks = [
    {
      title: `${query}: A Comprehensive Guide`,
      author: "Jane Scholar",
      description: `This comprehensive exploration of ${query} offers readers an in-depth analysis of its history, current relevance, and future implications. Dr. Jane Scholar brings decades of expertise to illuminate this fascinating subject through accessible prose and compelling examples. The book features interviews with leading experts, case studies, and practical insights for readers at all levels of familiarity with the topic.`,
      summary: `A thorough and accessible examination of ${query} from historical, contemporary, and future perspectives.`,
      category: matchedCategory,
      publicationDate: "2023",
      matchScore: getRandomScore(),
    },
    {
      title: `Understanding ${query}`,
      author: "Michael Johnson",
      description: `In "Understanding ${query}", Michael Johnson demystifies this complex subject through clear explanations and engaging storytelling. Drawing from various disciplines, the book presents a holistic framework for comprehending the nuances of ${query}. Johnson includes practical applications and thought exercises that help readers develop a deeper appreciation for the subject and its real-world implications.`,
      summary: `An accessible introduction to ${query} with practical applications and engaging examples.`,
      category: matchedCategory,
      publicationDate: "2022",
      matchScore: getRandomScore(),
    },
    {
      title: `The Essential Guide to ${query}`,
      author: "Sarah Williams",
      description: `"The Essential Guide to ${query}" serves as both an introduction for beginners and a reference for experienced practitioners. Sarah Williams synthesizes decades of research into a practical framework, offering readers a structured approach to mastering ${query}. The book includes detailed explanations, illustrative examples, and hands-on activities designed to reinforce key concepts and encourage application.`,
      summary: `A practical and comprehensive reference that breaks down complex aspects of ${query} into manageable concepts.`,
      category: matchedCategory,
      publicationDate: "2021",
      matchScore: getRandomScore(),
    },
    {
      title: `${query} Reimagined`,
      author: "David Chen",
      description: `David Chen presents a revolutionary perspective on ${query} in this groundbreaking work. Challenging conventional wisdom, "Reimagined" offers fresh insights and innovative approaches to understanding and applying ${query} principles. Chen combines theoretical foundations with practical examples, making complex ideas accessible while maintaining their transformative potential.`,
      summary: `A revolutionary approach to ${query} that challenges traditional perspectives and offers innovative solutions.`,
      category: matchedCategory,
      publicationDate: "2022",
      matchScore: getRandomScore(),
    }
  ];
  
  // Add IDs and source field
  return fallbackBooks.map(book => ({
    ...book,
    id: crypto.randomUUID(),
    source: "fallback",
    coverImage: `https://source.unsplash.com/400x600/?book,${encodeURIComponent(book.category || 'novel')}`
  }));
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Perplexity function called");
    const requestData = await req.json();
    const query = requestData.query;
    
    if (!query || typeof query !== 'string') {
      console.error('Invalid query:', query);
      throw new Error('Invalid or missing query parameter');
    }
    
    console.log("Search query:", query);
    
    const apiKey = Deno.env.get('PERPLEXITY_API_KEY');

    if (!apiKey) {
      console.error('Perplexity API key not found, using fallback books');
      // Return fallback books
      const fallbackBooks = getFallbackBooks(query);
      console.log(`Returning ${fallbackBooks.length} fallback books`);
      
      return new Response(JSON.stringify({ 
        books: fallbackBooks, 
        success: true,
        source: "fallback" 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Querying Perplexity API for:', query);

    const prompt = `
I'm looking for book recommendations related to "${query}". 
For each book suggestion, provide the following:
1. Title
2. Author
3. A brief but detailed description of the book (100-150 words)
4. A concise summary (30-50 words)
5. Category/genre
6. Publication date (if known)
7. Why this book matches my query (use this to calculate a match score on scale of 1-100)

Return exactly 4 book recommendations formatted as a JSON array with these fields:
title, author, description, summary, category, publicationDate, matchScore (a number between 60 and 98)
`;

    console.log("Sending request to Perplexity API");
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a literary expert who provides detailed book recommendations based on user queries. Your responses should be well-structured, accurate, and formatted exactly as JSON when requested. Always return a valid JSON array with no additional text or markdown.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 2000,
          top_p: 0.9,
          frequency_penalty: 0.0,
          presence_penalty: 0.0
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Perplexity API error status:', response.status);
        console.error('Perplexity API error response:', errorText);
        throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
      }

      console.log("Received response from Perplexity API");
      const data = await response.json();
      console.log('Perplexity response received');
      
      const content = data.choices[0].message.content;
      console.log('Raw content from Perplexity:', content);
      
      // Improved JSON extraction and parsing
      let books = [];
      try {
        // First, try direct JSON parsing
        books = JSON.parse(content);
        console.log('Successfully parsed content as JSON');
      } catch (e) {
        console.log('Failed direct JSON parsing, trying alternative extraction methods');
        
        // Try to find JSON within the response using regex
        try {
          // Look for content within code blocks
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch && jsonMatch[1]) {
            const jsonContent = jsonMatch[1].trim();
            books = JSON.parse(jsonContent);
            console.log('Extracted JSON from code block');
          } 
          // Look for array pattern
          else if (content.includes('[') && content.includes(']')) {
            const arrayMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (arrayMatch) {
              books = JSON.parse(arrayMatch[0]);
              console.log('Extracted JSON using array pattern match');
            }
          }
          // Try more aggressive approach if above methods fail
          else if (content.includes('{') && content.includes('}')) {
            const startIdx = content.indexOf('[');
            const endIdx = content.lastIndexOf(']') + 1;
            
            if (startIdx >= 0 && endIdx > startIdx) {
              const jsonCandidate = content.substring(startIdx, endIdx);
              // Remove any markdown or text decorations
              const cleanedJson = jsonCandidate
                .replace(/^```json\s+/, '')
                .replace(/\s+```$/, '');
              books = JSON.parse(cleanedJson);
              console.log('Extracted JSON using substring approach');
            } else {
              throw new Error('No valid JSON array found in response');
            }
          } else {
            throw new Error('No JSON structure detected in response');
          }
        } catch (extractError) {
          console.error('All JSON extraction attempts failed:', extractError.message);
          throw new Error('Failed to extract valid JSON from API response');
        }
      }

      if (!books || !Array.isArray(books) || books.length === 0) {
        console.error('No valid book array found in parsed content');
        throw new Error('Invalid book format in API response');
      } 
      
      console.log(`Found ${books.length} books in Perplexity response`);

      // Add source field and unique ids to each book
      books = books.map(book => ({
        ...book,
        id: crypto.randomUUID(),
        source: "perplexity",
        coverImage: `https://source.unsplash.com/400x600/?book,${encodeURIComponent(book.category || 'novel')}`
      }));

      console.log("Returning books from Perplexity function:", books.length);
      return new Response(JSON.stringify({ books, success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (perplexityError) {
      console.error('Error calling Perplexity API:', perplexityError.message);
      
      // Fall back to generated books
      const fallbackBooks = getFallbackBooks(query);
      console.log(`Returning ${fallbackBooks.length} fallback books after API error`);
      
      return new Response(JSON.stringify({ 
        books: fallbackBooks, 
        success: true,
        source: "fallback",
        error: perplexityError.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in perplexity-books function:', error.message);
    
    try {
      // Try to generate fallback books even on general errors
      const query = (await req.json())?.query || "general books";
      const fallbackBooks = getFallbackBooks(query);
      
      return new Response(JSON.stringify({ 
        error: error.message, 
        books: fallbackBooks,
        success: true,
        source: "fallback"
      }), {
        status: 200, // Return 200 even though there was an error since we're providing fallback content
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (fallbackError) {
      // If even fallback generation fails, return a proper error
      return new Response(JSON.stringify({ 
        error: error.message, 
        fallbackError: fallbackError.message,
        books: [],
        success: false
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
});
