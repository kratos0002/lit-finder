
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    const apiKey = Deno.env.get('PERPLEXITY_API_KEY');

    if (!apiKey) {
      console.error('Perplexity API key not found');
      throw new Error('Perplexity API key not found');
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
            content: 'You are a literary expert who provides detailed book recommendations based on user queries. Your responses should be well-structured, accurate, and formatted exactly as JSON when requested.'
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
      const errorData = await response.text();
      console.error('Perplexity API error:', errorData);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Perplexity response received');
    
    const content = data.choices[0].message.content;
    console.log('Raw content from Perplexity:', content.substring(0, 100) + '...');
    
    // Extract JSON from content (in case it's wrapped in text or markdown)
    let books = [];
    try {
      // First, try to parse the entire content as JSON
      books = JSON.parse(content);
      console.log('Successfully parsed content as JSON');
    } catch (e) {
      console.log('Failed to parse content directly as JSON, trying to extract JSON');
      // If that fails, try to extract JSON from markdown or text
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || 
                        content.match(/\[\s*\{[\s\S]*\}\s*\]/);
      
      if (jsonMatch && jsonMatch[1]) {
        try {
          books = JSON.parse(jsonMatch[1]);
          console.log('Successfully extracted and parsed JSON from content');
        } catch (e2) {
          console.error('Failed to parse JSON from content:', e2);
          books = [];
        }
      } else {
        console.error('No JSON pattern found in content');
      }
    }

    if (books.length === 0) {
      console.error('No books found in the response');
    } else {
      console.log(`Found ${books.length} books`);
    }

    // Add source field to each book
    books = books.map(book => ({
      ...book,
      source: "perplexity"
    }));

    return new Response(JSON.stringify({ books }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in perplexity-books function:', error);
    return new Response(JSON.stringify({ error: error.message, books: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
