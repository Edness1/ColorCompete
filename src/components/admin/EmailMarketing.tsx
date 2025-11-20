import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Plus, Mail, BarChart3, Settings, Send, Users, TrendingUp } from 'lucide-react';
import { EmailCampaignManager } from './EmailCampaignManager';
import { EmailAutomationManager } from './EmailAutomationManager';
import { EmailAnalytics } from './EmailAnalytics';
import { API_URL } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface EmailStats {
  totalSent: number;
  totalDelivered: number;
  totalBounced: number;
  deliveryRate: string;
  bounceRate: string;
}

export function EmailMarketing() {
  const { user } = useAuth();
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchEmailStats();
  }, []);

  const fetchEmailStats = async () => {
    try {
      const response = await fetch(API_URL+'/api/email/analytics', {
        headers: {
          'user-id': user?._id || ''
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, response.statusText, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      if (!responseText) {
        console.warn('Empty response from server');
        return;
      }
      
      try {
        const data = JSON.parse(responseText);
        setStats(data);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response was:', responseText);
        throw new Error('Server returned invalid JSON');
      }
    } catch (error) {
      console.error('Error fetching email stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncStats = async () => {
    setSyncing(true);
    try {
      const response = await fetch(API_URL+'/api/email/analytics/sync', {
        method: 'POST',
        headers: {
          'user-id': user?._id || ''
        }
      });
      
      if (response.ok) {
        // Refresh stats after sync
        await fetchEmailStats();
      }
    } catch (error) {
      console.error('Error syncing stats:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!confirm('This will mark all "sent" emails as "delivered". Continue?')) return;
    setSyncing(true);
    try {
      const response = await fetch(API_URL+'/api/email/analytics/mark-delivered', {
        method: 'POST',
        headers: {
          'user-id': user?._id || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Marked ${data.modified} emails as delivered`);
        // Refresh stats
        await fetchEmailStats();
      }
    } catch (error) {
      console.error('Error marking delivered:', error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Marketing</h1>
          <p className="text-muted-foreground">
            Manage email campaigns and automations for ColorCompete
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleMarkDelivered} 
            disabled={syncing}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
          >
            Mark Delivered
          </Button>
          <Button 
            onClick={handleSyncStats} 
            disabled={syncing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            {syncing ? 'Syncing...' : 'Sync Stats'}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {!loading && stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.deliveryRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalDelivered.toLocaleString()} delivered
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.bounceRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalBounced.toLocaleString()} bounced
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">
            <Mail className="w-4 h-4 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="automations">
            <Settings className="w-4 h-4 mr-2" />
            Automations
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <EmailCampaignManager onStatsUpdate={fetchEmailStats} />
        </TabsContent>

        <TabsContent value="automations" className="space-y-4">
          <EmailAutomationManager />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <EmailAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
