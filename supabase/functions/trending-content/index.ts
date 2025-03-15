
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supabase Function to fetch trending content related to books and literature
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!apiKey) {
      throw new Error('Perplexity API key not found');
    }

    const requestData = await req.json();
    const { searchHistory = [] } = requestData;
    console.log("Search history for trending content:", searchHistory);

    // Create a prompt based on search history or use default
    let prompt = "Find the latest trending articles, news, and social media posts related to books and literature. ";
    
    if (searchHistory && searchHistory.length > 0) {
      // Use the most recent searches to personalize content
      prompt += `Focus on content related to: ${searchHistory.slice(0, 3).join(", ")}.`;
    } else {
      prompt += "Include diverse content from book reviews, publishing news, author interviews, and literary discussions.";
    }
    
    prompt += " Return exactly 8 items formatted as a JSON array with these fields: id (a unique UUID), title, source (like 'The Guardian', 'Goodreads', 'Twitter', etc.), date (ISO format), summary (1-2 sentences), url (full URL to the content), and category (one of: 'News', 'Articles', 'Social', 'Reviews').";

    console.log("Sending prompt to Perplexity:", prompt);

    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
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
            content: 'You are a literary expert who provides information about trending content in the book and literature world. Your responses should be well-structured, accurate, and formatted exactly as JSON when requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
        top_p: 0.9,
        frequency_penalty: 0.0,
        presence_penalty: 0.0
      }),
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error('Perplexity API error status:', perplexityResponse.status);
      console.error('Perplexity API error response:', errorText);
      throw new Error(`Perplexity API error: ${perplexityResponse.status}`);
    }

    console.log("Received response from Perplexity API");
    const data = await perplexityResponse.json();
    const content = data.choices[0].message.content;
    console.log('Content from Perplexity:', content);
    
    // Extract JSON from the response
    let trendingItems = [];
    try {
      // First try direct JSON parsing
      trendingItems = JSON.parse(content);
      console.log('Successfully parsed content as JSON');
    } catch (e) {
      console.log('Failed direct JSON parsing, trying to extract JSON from text');
      
      try {
        // Try to match JSON within markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch && jsonMatch[1]) {
          const jsonContent = jsonMatch[1].trim();
          trendingItems = JSON.parse(jsonContent);
          console.log('Extracted JSON from code block');
        } 
        // Try to match array pattern
        else if (content.includes('[') && content.includes(']')) {
          const arrayMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (arrayMatch) {
            trendingItems = JSON.parse(arrayMatch[0]);
            console.log('Extracted JSON using array pattern match');
          }
        }
        
        if (!trendingItems || trendingItems.length === 0) {
          console.error('Could not extract valid JSON data');
          throw new Error('Failed to extract valid JSON from API response');
        }
      } catch (extractError) {
        console.error('All JSON extraction attempts failed:', extractError.message);
        throw new Error('Failed to extract valid JSON from API response');
      }
    }

    // Ensure we have valid data
    if (!Array.isArray(trendingItems) || trendingItems.length === 0) {
      throw new Error('Invalid or empty data received from Perplexity');
    }

    console.log(`Found ${trendingItems.length} trending items`);
    return new Response(JSON.stringify({ items: trendingItems, success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in trending-content function:', error);
    return new Response(JSON.stringify({ 
      error: error.message, 
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
