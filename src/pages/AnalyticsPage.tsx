
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, ChartPie, BookOpen, Bookmark, Search, Eye, Click, Clock } from "lucide-react";
import { mockBooks } from "@/data/mockData";

export default function AnalyticsPage() {
  // Mock analytics data
  const analyticsMockData = {
    totalBooks: mockBooks.length,
    booksViewed: 24,
    booksSaved: 5,
    searchCount: 15,
    clickThroughRate: 67,
    avgTimeOnPage: "2m 45s",
    topCategories: [
      { name: "Science Fiction", percentage: 43 },
      { name: "Fantasy", percentage: 28 },
      { name: "Mystery", percentage: 17 },
      { name: "Other", percentage: 12 },
    ],
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <section className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your reading habits and recommendation insights.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Book className="w-4 h-4 text-primary" />
                Total Books
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsMockData.totalBooks}</div>
              <p className="text-xs text-muted-foreground">Available in our catalog</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                Books Viewed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsMockData.booksViewed}</div>
              <p className="text-xs text-muted-foreground">In the last 30 days</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-primary" />
                Books Saved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsMockData.booksSaved}</div>
              <p className="text-xs text-muted-foreground">In your collection</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                Searches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsMockData.searchCount}</div>
              <p className="text-xs text-muted-foreground">In the last 30 days</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <ChartPie className="w-5 h-5 text-primary" />
                Category Distribution
              </CardTitle>
              <CardDescription>
                Book categories you've viewed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsMockData.topCategories.map((category) => (
                <div key={category.name} className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-sm text-muted-foreground">{category.percentage}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Engagement Metrics
              </CardTitle>
              <CardDescription>
                How you interact with recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Click className="w-4 h-4 text-muted-foreground" />
                      Click-through Rate
                    </span>
                    <span className="text-sm text-muted-foreground">{analyticsMockData.clickThroughRate}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${analyticsMockData.clickThroughRate}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      Average Time on Page
                    </span>
                    <span className="text-sm text-muted-foreground">{analyticsMockData.avgTimeOnPage}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary"
                      style={{ width: "55%" }}
                    ></div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    Note: This is a demo with mock data. In a real application, these metrics would be calculated from actual user interactions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
