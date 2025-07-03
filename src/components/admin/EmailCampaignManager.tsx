import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Plus, Send, Edit, Trash2, Users, Calendar, BarChart3, Mail } from 'lucide-react';
import { API_URL } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface EmailCampaign {
  _id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  targetAudience: {
    allMembers: boolean;
    subscriptionTypes: string[];
    userSegments: string[];
    specificUsers: string[];
  };
}

interface EmailCampaignManagerProps {
  onStatsUpdate: () => void;
}

export function EmailCampaignManager({ onStatsUpdate }: EmailCampaignManagerProps) {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const [deletingCampaign, setDeletingCampaign] = useState<EmailCampaign | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    targetAudience: {
      allMembers: true,
      subscriptionTypes: [] as string[],
      userSegments: [] as string[],
      specificUsers: [] as string[]
    }
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(API_URL+'/api/email/campaigns', {
        headers: {
          'user-id': user?._id
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingCampaign 
        ? API_URL+`/api/email/campaigns/${editingCampaign._id}`
        : API_URL+'/api/email/campaigns';
      
      const method = editingCampaign ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'user-id': user?._id
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        await fetchCampaigns();
        setIsCreateDialogOpen(false);
        setEditingCampaign(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
    }
  };

  const handleSendCampaign = async (campaign: EmailCampaign) => {
    try {
      const response = await fetch(API_URL+`/api/email/campaigns/${campaign._id}/send`, {
        method: 'POST',
        headers: {
          'user-id': user?._id
        }
      });
      
      if (response.ok) {
        await fetchCampaigns();
        onStatsUpdate();
      }
    } catch (error) {
      console.error('Error sending campaign:', error);
    }
  };

  const handleDeleteCampaign = async (campaign: EmailCampaign) => {
    try {
      const response = await fetch(API_URL+`/api/email/campaigns/${campaign._id}`, {
        method: 'DELETE',
        headers: {
          'user-id': user?._id
        }
      });
      
      if (response.ok) {
        await fetchCampaigns();
        setDeletingCampaign(null);
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      htmlContent: '',
      textContent: '',
      targetAudience: {
        allMembers: true,
        subscriptionTypes: [],
        userSegments: [],
        specificUsers: []
      }
    });
  };

  const openEditDialog = (campaign: EmailCampaign) => {
    setFormData({
      name: campaign.name,
      subject: campaign.subject,
      htmlContent: campaign.htmlContent,
      textContent: campaign.textContent || '',
      targetAudience: campaign.targetAudience
    });
    setEditingCampaign(campaign);
    setIsCreateDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'outline',
      scheduled: 'secondary',
      sending: 'default',
      sent: 'default',
      failed: 'destructive'
    };
    
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Campaigns</h2>
          <p className="text-muted-foreground">
            Create and manage email blast campaigns
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingCampaign(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
                </DialogTitle>
                <DialogDescription>
                  {editingCampaign 
                    ? 'Update your email campaign details'
                    : 'Create a new email campaign to send to your members'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Monthly Newsletter"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Welcome to ColorCompete!"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="htmlContent">Email Content (HTML)</Label>
                  <Textarea
                    id="htmlContent"
                    value={formData.htmlContent}
                    onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                    placeholder={`<h1>Hello {{first_name}}!</h1>
<p>Welcome to ColorCompete...</p>
<p>Available variables: {{first_name}}, {{last_name}}</p>`}
                    className="min-h-[200px] font-mono text-sm"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="textContent">Plain Text Content (Optional)</Label>
                  <Textarea
                    id="textContent"
                    value={formData.textContent}
                    onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                    placeholder="Plain text version of your email..."
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Target Audience</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="allMembers"
                        checked={formData.targetAudience.allMembers}
                        onChange={(e) => setFormData({
                          ...formData,
                          targetAudience: {
                            ...formData.targetAudience,
                            allMembers: e.target.checked
                          }
                        })}
                      />
                      <Label htmlFor="allMembers">All Members</Label>
                    </div>
                    
                    {!formData.targetAudience.allMembers && (
                      <div className="space-y-2 pl-6">
                        <Select
                          value={formData.targetAudience.subscriptionTypes.join(',')}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            targetAudience: {
                              ...formData.targetAudience,
                              subscriptionTypes: value ? value.split(',') : []
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select subscription types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic Members</SelectItem>
                            <SelectItem value="premium">Premium Members</SelectItem>
                            <SelectItem value="basic,premium">All Subscription Types</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaigns List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first email campaign to reach your members
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => (
            <Card key={campaign._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {campaign.name}
                      {getStatusBadge(campaign.status)}
                    </CardTitle>
                    <CardDescription>{campaign.subject}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {campaign.status === 'draft' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(campaign)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Send className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Send Campaign</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to send "{campaign.name}" to all members? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleSendCampaign(campaign)}>
                                Send Campaign
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingCampaign(campaign)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{campaign.name}"? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteCampaign(campaign)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{campaign.recipientCount} recipients</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-muted-foreground" />
                    <span>{campaign.sentCount} sent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    <span>{campaign.openedCount} opened</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {campaign.sentAt 
                        ? new Date(campaign.sentAt).toLocaleDateString()
                        : new Date(campaign.createdAt).toLocaleDateString()
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
