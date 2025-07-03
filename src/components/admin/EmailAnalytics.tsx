import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { BarChart3, TrendingUp, Mail, Users, MousePointer, XCircle } from 'lucide-react';
import { API_URL } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsData {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  deliveryRate: string;
  openRate: string;
  clickRate: string;
  bounceRate: string;
}

interface CampaignAnalytics {
  _id: string;
  name: string;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  status: string;
  sentAt?: string;
}

export function EmailAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignAnalytics[]>([]);
  const [timeframe, setTimeframe] = useState('30');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // Assuming you have a useAuth hook to get the current user

  useEffect(() => {
    fetchAnalytics();
    fetchCampaigns();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(API_URL+`/api/email/analytics?timeframe=${timeframe}`, {
        headers: {
          'user-id': user?._id
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(API_URL+'/api/email/campaigns', {
        headers: {
          'user-id': user?._id
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.filter((c: CampaignAnalytics) => c.status === 'sent'));
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 25) return 'text-green-600';
    if (rate >= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (rate: number, type: 'open' | 'click' | 'bounce') => {
    let threshold: { good: number; fair: number };
    
    switch (type) {
      case 'open':
        threshold = { good: 20, fair: 15 };
        break;
      case 'click':
        threshold = { good: 3, fair: 2 };
        break;
      case 'bounce':
        threshold = { good: 2, fair: 5 };
        return rate <= threshold.good ? 'default' : rate <= threshold.fair ? 'secondary' : 'destructive';
      default:
        threshold = { good: 20, fair: 15 };
    }
    
    return rate >= threshold.good ? 'default' : rate >= threshold.fair ? 'secondary' : 'destructive';
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Analytics</h2>
          <p className="text-muted-foreground">
            Track performance of your email campaigns and automations
          </p>
        </div>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overall Statistics */}
      {analytics && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalSent.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.totalDelivered.toLocaleString()} delivered ({analytics.deliveryRate}%)
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getPerformanceColor(parseFloat(analytics.openRate))}`}>
                  {analytics.openRate}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.totalOpened.toLocaleString()} opens
                </p>
                <Badge 
                  variant={getPerformanceBadge(parseFloat(analytics.openRate), 'open')}
                  className="text-xs mt-1"
                >
                  {parseFloat(analytics.openRate) >= 20 ? 'Excellent' : 
                   parseFloat(analytics.openRate) >= 15 ? 'Good' : 'Needs Improvement'}
                </Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getPerformanceColor(parseFloat(analytics.clickRate))}`}>
                  {analytics.clickRate}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.totalClicked.toLocaleString()} clicks
                </p>
                <Badge 
                  variant={getPerformanceBadge(parseFloat(analytics.clickRate), 'click')}
                  className="text-xs mt-1"
                >
                  {parseFloat(analytics.clickRate) >= 3 ? 'Excellent' : 
                   parseFloat(analytics.clickRate) >= 2 ? 'Good' : 'Needs Improvement'}
                </Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  parseFloat(analytics.bounceRate) <= 2 ? 'text-green-600' :
                  parseFloat(analytics.bounceRate) <= 5 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {analytics.bounceRate}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.totalBounced.toLocaleString()} bounces
                </p>
                <Badge 
                  variant={getPerformanceBadge(parseFloat(analytics.bounceRate), 'bounce')}
                  className="text-xs mt-1"
                >
                  {parseFloat(analytics.bounceRate) <= 2 ? 'Excellent' : 
                   parseFloat(analytics.bounceRate) <= 5 ? 'Good' : 'High'}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance Insights
              </CardTitle>
              <CardDescription>
                Tips to improve your email marketing performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {parseFloat(analytics.openRate) < 15 && (
                <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-800">Improve Open Rates</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Your open rate is below average. Try more compelling subject lines, 
                    send at optimal times, and segment your audience better.
                  </p>
                </div>
              )}
              
              {parseFloat(analytics.clickRate) < 2 && (
                <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800">Increase Engagement</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Add clear call-to-action buttons, personalize content, 
                    and make sure your emails are mobile-friendly.
                  </p>
                </div>
              )}
              
              {parseFloat(analytics.bounceRate) > 5 && (
                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-800">Clean Your Email List</h4>
                  <p className="text-sm text-red-700 mt-1">
                    High bounce rate detected. Remove invalid email addresses 
                    and use double opt-in for new subscribers.
                  </p>
                </div>
              )}
              
              {parseFloat(analytics.openRate) >= 20 && parseFloat(analytics.clickRate) >= 3 && (
                <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800">Great Performance!</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Your emails are performing well. Keep up the good work with 
                    relevant content and consistent sending schedule.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Campaign Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Campaign Performance
          </CardTitle>
          <CardDescription>
            Performance metrics for your recent campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sent campaigns found for the selected timeframe
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => {
                const openRate = campaign.sentCount > 0 
                  ? ((campaign.openedCount / campaign.sentCount) * 100).toFixed(1)
                  : '0';
                const clickRate = campaign.openedCount > 0 
                  ? ((campaign.clickedCount / campaign.openedCount) * 100).toFixed(1)
                  : '0';
                
                return (
                  <div key={campaign._id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{campaign.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Sent {campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {campaign.sentCount.toLocaleString()} sent
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Delivered:</span>
                        <br />
                        <span className="font-medium">
                          {campaign.deliveredCount.toLocaleString()} 
                          ({campaign.sentCount > 0 ? ((campaign.deliveredCount / campaign.sentCount) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Opened:</span>
                        <br />
                        <span className={`font-medium ${getPerformanceColor(parseFloat(openRate))}`}>
                          {campaign.openedCount.toLocaleString()} ({openRate}%)
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Clicked:</span>
                        <br />
                        <span className={`font-medium ${getPerformanceColor(parseFloat(clickRate))}`}>
                          {campaign.clickedCount.toLocaleString()} ({clickRate}%)
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Bounced:</span>
                        <br />
                        <span className="font-medium">
                          {campaign.bouncedCount?.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
