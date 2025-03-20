import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Text,
  Heading,
  Select,
  Switch,
  useToast,
  Spinner,
  Progress,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Flex,
  SimpleGrid,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';

// Types
interface Recommendation {
  id: string;
  title: string;
  author: string;
  match_score: number;
  summary: string;
  category?: string;
}

interface RecommendationResponse {
  top_book?: Recommendation;
  top_review?: any;
  top_social?: any;
  recommendations: Recommendation[];
  insights?: Record<string, any>;
  literary_analysis?: string;
  error?: string;
}

interface ProgressiveUpdate {
  data: Partial<RecommendationResponse>;
  metadata: {
    timestamp: string;
    final: boolean;
  };
}

enum ServiceTier {
  FAST = 'fast',
  STANDARD = 'standard',
  COMPREHENSIVE = 'comprehensive',
}

// Component
const RecommendationForm: React.FC = () => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [tier, setTier] = useState<ServiceTier>(ServiceTier.STANDARD);
  const [useStreaming, setUseStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [userId] = useLocalStorage('alexandria_user_id', crypto.randomUUID());
  const [error, setError] = useState<string | null>(null);
  
  // Hooks
  const toast = useToast();
  
  // Streaming connection
  let eventSource: EventSource | null = null;
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      toast({
        title: 'Search term required',
        description: 'Please enter a search term to get recommendations',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Reset state
    setError(null);
    setRecommendations(null);
    setProgress(0);
    setIsLoading(true);
    
    try {
      if (useStreaming) {
        // Use streaming API for progressive loading
        await fetchStreamingRecommendations();
      } else {
        // Use standard API
        await fetchRecommendations();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsLoading(false);
    }
  };
  
  // Fetch recommendations using standard API
  const fetchRecommendations = async () => {
    try {
      const start = performance.now();
      
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          search_term: searchTerm,
          tier: tier,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch recommendations');
      }
      
      const data: RecommendationResponse = await response.json();
      setRecommendations(data);
      
      const end = performance.now();
      toast({
        title: 'Recommendations loaded',
        description: `Loaded in ${((end - start) / 1000).toFixed(2)} seconds`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch recommendations using streaming API
  const fetchStreamingRecommendations = async () => {
    // Close any existing connection
    if (eventSource) {
      eventSource.close();
    }
    
    const url = new URL('/api/recommendations/stream', window.location.origin);
    url.searchParams.append('tier', tier);
    
    // Create a new EventSource connection
    eventSource = new EventSource(url.toString());
    
    // Initialize a progress counter
    let progressSteps = 0;
    const maxSteps = tier === ServiceTier.COMPREHENSIVE ? 5 : 3;
    
    // Set up event handlers
    eventSource.onopen = () => {
      console.log('SSE connection opened');
      // Send the request body after connection is established
      fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          search_term: searchTerm,
        }),
      }).catch(err => {
        setError('Failed to send search request');
        eventSource?.close();
      });
    };
    
    eventSource.onmessage = (event) => {
      try {
        const update: ProgressiveUpdate = JSON.parse(event.data);
        
        // Update progress
        progressSteps++;
        setProgress(Math.min(100, (progressSteps / maxSteps) * 100));
        
        // Merge the new data with existing recommendations
        setRecommendations(prev => {
          return {
            ...prev,
            ...update.data,
            recommendations: [
              ...(prev?.recommendations || []),
              ...(update.data.recommendations || [])
            ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i),
          };
        });
        
        // If this is the final update, close the connection
        if (update.metadata.final) {
          setIsLoading(false);
          eventSource?.close();
          eventSource = null;
          
          toast({
            title: 'Recommendations complete',
            description: `All recommendations loaded successfully`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (err) {
        console.error('Error processing SSE message:', err);
      }
    };
    
    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      setError('Error loading recommendations. Please try again.');
      setIsLoading(false);
      eventSource?.close();
      eventSource = null;
    };
    
    // Clean up function
    return () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  }, []);
  
  // Render loading state
  const renderLoading = () => (
    <Box textAlign="center" py={10}>
      <Spinner size="xl" mb={4} />
      <Text>Finding the perfect recommendations for you...</Text>
      {useStreaming && (
        <>
          <Progress 
            value={progress} 
            size="sm" 
            colorScheme="blue" 
            mt={4} 
            mb={2} 
            borderRadius="md"
          />
          <Text fontSize="sm" color="gray.500">
            {progress < 100 ? 'Loading recommendations...' : 'Finalizing results...'}
          </Text>
        </>
      )}
    </Box>
  );
  
  // Render error state
  const renderError = () => (
    <Alert status="error" borderRadius="md" my={4}>
      <AlertIcon />
      <Box flex="1">
        <AlertTitle>Error loading recommendations</AlertTitle>
        <AlertDescription display="block">
          {error}
        </AlertDescription>
      </Box>
    </Alert>
  );
  
  // Render recommendations
  const renderRecommendations = () => {
    if (!recommendations) return null;
    
    return (
      <VStack spacing={6} align="stretch" width="100%" mt={6}>
        {recommendations.top_book && (
          <Card variant="filled" borderRadius="md">
            <CardHeader bg="blue.500" color="white" borderTopRadius="md">
              <Heading size="md">Top Recommendation</Heading>
            </CardHeader>
            <CardBody>
              <Heading size="md" mb={2}>{recommendations.top_book.title}</Heading>
              <Text fontWeight="bold" mb={2}>by {recommendations.top_book.author}</Text>
              <HStack mb={2}>
                <Badge colorScheme="green">
                  {Math.round(recommendations.top_book.match_score * 100)}% Match
                </Badge>
                {recommendations.top_book.category && (
                  <Badge colorScheme="purple">{recommendations.top_book.category}</Badge>
                )}
              </HStack>
              <Text>{recommendations.top_book.summary}</Text>
            </CardBody>
          </Card>
        )}
        
        {recommendations.literary_analysis && (
          <Card borderRadius="md">
            <CardHeader bg="purple.500" color="white" borderTopRadius="md">
              <Heading size="md">Literary Analysis</Heading>
            </CardHeader>
            <CardBody>
              <Text>{recommendations.literary_analysis}</Text>
            </CardBody>
          </Card>
        )}
        
        {recommendations.recommendations && recommendations.recommendations.length > 0 && (
          <Box>
            <Heading size="md" mb={4}>More Recommendations</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {recommendations.recommendations.map(book => (
                <Card key={book.id} size="sm" variant="outline">
                  <CardBody>
                    <Heading size="sm" mb={1}>{book.title}</Heading>
                    <Text fontSize="sm" mb={2}>by {book.author}</Text>
                    <HStack mb={2}>
                      <Badge colorScheme="green" size="sm">
                        {Math.round(book.match_score * 100)}% Match
                      </Badge>
                      {book.category && (
                        <Badge colorScheme="purple" size="sm">{book.category}</Badge>
                      )}
                    </HStack>
                    <Text fontSize="sm" noOfLines={3}>{book.summary}</Text>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </Box>
        )}
        
        {recommendations.insights && Object.keys(recommendations.insights).length > 0 && (
          <Card borderRadius="md">
            <CardHeader bg="teal.500" color="white" borderTopRadius="md">
              <Heading size="md">Insights</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={2}>
                {Object.entries(recommendations.insights).map(([key, value]) => (
                  <Box key={key}>
                    <Text fontWeight="bold">{key}:</Text>
                    <Text>{value as string}</Text>
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    );
  };
  
  return (
    <Box maxW="800px" mx="auto" p={4}>
      <Heading as="h1" size="xl" mb={6} textAlign="center">
        Alexandria Library
      </Heading>
      
      <Card p={6} borderRadius="lg" boxShadow="md">
        <form onSubmit={handleSubmit}>
          <VStack spacing={6} align="stretch">
            <FormControl isRequired>
              <FormLabel>What would you like to read?</FormLabel>
              <Input
                placeholder="E.g., dystopian fiction like 1984"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="lg"
              />
            </FormControl>
            
            <HStack justify="space-between">
              <FormControl maxW="200px">
                <FormLabel fontSize="sm">Service Tier</FormLabel>
                <Select 
                  value={tier} 
                  onChange={(e) => setTier(e.target.value as ServiceTier)}
                  size="sm"
                >
                  <option value={ServiceTier.FAST}>Fast (5s)</option>
                  <option value={ServiceTier.STANDARD}>Standard (15s)</option>
                  <option value={ServiceTier.COMPREHENSIVE}>Comprehensive (40s)</option>
                </Select>
              </FormControl>
              
              <FormControl display="flex" alignItems="center" justifyContent="flex-end">
                <FormLabel htmlFor="streaming-mode" mb="0" fontSize="sm" mr={2}>
                  Progressive Loading
                </FormLabel>
                <Switch 
                  id="streaming-mode" 
                  isChecked={useStreaming} 
                  onChange={() => setUseStreaming(!useStreaming)}
                />
              </FormControl>
            </HStack>
            
            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              leftIcon={<SearchIcon />}
              isLoading={isLoading}
              loadingText="Searching"
            >
              Get Recommendations
            </Button>
          </VStack>
        </form>
      </Card>
      
      <Divider my={6} />
      
      {isLoading && renderLoading()}
      {error && renderError()}
      {!isLoading && !error && renderRecommendations()}
    </Box>
  );
};

export default RecommendationForm; 