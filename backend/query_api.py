#!/usr/bin/env python3
import requests
import json
import sys
from pprint import pprint

def query_book_api(search_term):
    """Query the book recommendation API with a search term."""
    url = "http://localhost:8000/api/recommendations"
    
    # Prepare the request payload
    payload = {
        "user_id": "test_user_123",  # Dummy user ID
        "search_term": search_term,
        "history": [],  # No search history
        "feedback": []  # No feedback
    }
    
    print(f"\n🔍 Querying for: '{search_term}'")
    print("-" * 50)
    
    try:
        # Make the API request
        response = requests.post(url, json=payload, timeout=60)
        
        # Check if the request was successful
        if response.status_code == 200:
            data = response.json()
            
            # Print top recommendations
            print("\n✅ Recommendations received!")
            print("\n📚 TOP BOOK:")
            if data.get("top_book"):
                book = data["top_book"]
                print(f"Title: {book.get('title')}")
                print(f"Author: {book.get('author')}")
                print(f"Match Score: {book.get('match_score')}")
                print(f"Summary: {book.get('summary')}")
            else:
                print("No top book found")
                
            # Print reviews
            print("\n📝 TOP REVIEW:")
            if data.get("top_review"):
                review = data["top_review"]
                print(f"Title: {review.get('title')}")
                print(f"Source: {review.get('source')}")
                print(f"Summary: {review.get('summary')}")
            else:
                print("No top review found")
                
            # Print social content
            print("\n📱 TOP SOCIAL:")
            if data.get("top_social"):
                social = data["top_social"]
                print(f"Title: {social.get('title')}")
                print(f"Source: {social.get('source')}")
                print(f"Summary: {social.get('summary')}")
            else:
                print("No top social content found")
                
            # Print all recommendations
            print("\n📚 ALL RECOMMENDATIONS:")
            for i, book in enumerate(data.get("recommendations", []), 1):
                print(f"{i}. {book.get('title')} by {book.get('author')} (Score: {book.get('match_score')})")
                
            # Print metadata
            print("\n🔍 METADATA:")
            if data.get("metadata"):
                metadata = data["metadata"]
                print(f"Total Results: {metadata.get('total_results')}")
                print(f"Processing Time: {metadata.get('processing_time_ms')} ms")
                print(f"Timestamp: {metadata.get('timestamp')}")
            else:
                print("No metadata found")
            
            # Save the full response to a file
            with open(f"{search_term.replace(' ', '_')}_response.json", "w") as f:
                json.dump(data, f, indent=2)
            print(f"\nFull response saved to {search_term.replace(' ', '_')}_response.json")
            
        else:
            print(f"❌ Error: Received status code {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    # Use command line argument or default to "Crime and Punishment"
    search_term = sys.argv[1] if len(sys.argv) > 1 else "Crime and Punishment"
    query_book_api(search_term) 