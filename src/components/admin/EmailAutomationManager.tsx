import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Plus, Settings, Edit, Trash2, Clock, Gift, Mail, Calendar, TrendingUp } from 'lucide-react';
import { API_URL } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface EmailAutomation {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  triggerType: 'daily_winner' | 'monthly_winner' | 'winner_reward' | 'welcome' | 'subscription_expired' | 'contest_announcement' | 'voting_results' | 'comments_feedback' | 'weekly_summary';
  emailTemplate: {
    subject: string;
    htmlContent: string;
    textContent?: string;
  };
  schedule?: {
    time: string;
    dayOfMonth?: number;
    dayOfWeek?: number;
    timezone: string;
  };
  rewardSettings?: {
    giftCardAmount: number;
    giftCardMessage: string;
  };
  totalSent: number;
  lastTriggered?: string;
  createdAt: string;
}

export function EmailAutomationManager() {
  const { user } = useAuth();
  const [automations, setAutomations] = useState<EmailAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<EmailAutomation | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    triggerType: 'daily_winner' | 'monthly_winner' | 'winner_reward' | 'welcome' | 'subscription_expired' | 'contest_announcement' | 'voting_results' | 'comments_feedback' | 'weekly_summary';
    emailTemplate: {
      subject: string;
      htmlContent: string;
      textContent: string;
    };
    schedule: {
      time: string;
      dayOfMonth: number;
      dayOfWeek?: number;
      timezone: string;
    };
    rewardSettings: {
      giftCardAmount: number;
      giftCardMessage: string;
    };
  }>({
    name: '',
    description: '',
    triggerType: 'daily_winner' as 'daily_winner' | 'monthly_winner' | 'winner_reward' | 'welcome' | 'subscription_expired' | 'contest_announcement' | 'voting_results' | 'comments_feedback' | 'weekly_summary',
    emailTemplate: {
      subject: '',
      htmlContent: '',
      textContent: ''
    },
    schedule: {
      time: '09:00',
      dayOfMonth: 1,
      timezone: 'America/New_York'
    },
    rewardSettings: {
      giftCardAmount: 25,
      giftCardMessage: 'Congratulations on winning the ColorCompete contest!'
    }
  });

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      const response = await fetch(API_URL+'/api/email/automations', {
        headers: {
          'user-id': user?._id
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAutomations(data);
      }
    } catch (error) {
      console.error('Error fetching automations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingAutomation 
        ? API_URL+`/api/email/automations/${editingAutomation._id}`
        : API_URL+'/api/email/automations';
      
      const method = editingAutomation ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'user-id': user?._id
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        await fetchAutomations();
        setIsCreateDialogOpen(false);
        setEditingAutomation(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving automation:', error);
    }
  };

  const handleToggleAutomation = async (automation: EmailAutomation) => {
    try {
      const response = await fetch(API_URL+`/api/email/automations/${automation._id}/toggle`, {
        method: 'PATCH',
        headers: {
          'user-id': user?._id
        }
      });
      
      if (response.ok) {
        await fetchAutomations();
      }
    } catch (error) {
      console.error('Error toggling automation:', error);
    }
  };

  const handleDeleteAutomation = async (automation: EmailAutomation) => {
    try {
      const response = await fetch(API_URL+`/api/email/automations/${automation._id}`, {
        method: 'DELETE',
        headers: {
          'user-id': user?._id
        }
      });
      
      if (response.ok) {
        await fetchAutomations();
      }
    } catch (error) {
      console.error('Error deleting automation:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      triggerType: 'daily_winner',
      emailTemplate: {
        subject: '',
        htmlContent: '',
        textContent: ''
      },
      schedule: {
        time: '09:00',
        dayOfMonth: 1,
        dayOfWeek: 1,
        timezone: 'America/New_York'
      },
      rewardSettings: {
        giftCardAmount: 25,
        giftCardMessage: 'Congratulations on winning the ColorCompete contest!'
      }
    });
  };

  const openEditDialog = (automation: EmailAutomation) => {
    setFormData({
      name: automation.name,
      description: automation.description || '',
      triggerType: automation.triggerType,
      emailTemplate: {
        subject: automation.emailTemplate.subject,
        htmlContent: automation.emailTemplate.htmlContent,
        textContent: automation.emailTemplate.textContent || ''
      },
      schedule: {
        time: automation.schedule?.time || '09:00',
        dayOfMonth: automation.schedule?.dayOfMonth || 1,
        dayOfWeek: automation.schedule?.dayOfWeek || 1,
        timezone: automation.schedule?.timezone || 'America/New_York'
      },
      rewardSettings: automation.rewardSettings || {
        giftCardAmount: 25,
        giftCardMessage: 'Congratulations on winning the ColorCompete contest!'
      }
    });
    setEditingAutomation(automation);
    setIsCreateDialogOpen(true);
  };

  const getTriggerTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      daily_winner: 'Daily Winner Announcement',
      monthly_winner: 'Monthly Winner Announcement',
      winner_reward: 'Winner Gift Card Reward',
      welcome: 'Welcome Email',
      subscription_expired: 'Subscription Expired',
      contest_announcement: 'Contest Announcements',
      voting_results: 'Voting Results',
      comments_feedback: 'Comments & Feedback',
      weekly_summary: 'Weekly Summary'
    };
    return labels[type] || type;
  };

  const getTriggerIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      daily_winner: <Calendar className="w-4 h-4" />,
      monthly_winner: <TrendingUp className="w-4 h-4" />,
      winner_reward: <Gift className="w-4 h-4" />,
      welcome: <Mail className="w-4 h-4" />,
      subscription_expired: <Clock className="w-4 h-4" />,
      contest_announcement: <Plus className="w-4 h-4" />,
      voting_results: <TrendingUp className="w-4 h-4" />,
      comments_feedback: <Mail className="w-4 h-4" />,
      weekly_summary: <Calendar className="w-4 h-4" />
    };
    return icons[type] || <Settings className="w-4 h-4" />;
  };

  const getDefaultTemplate = (triggerType: string) => {
    const templates: Record<string, { subject: string; htmlContent: string }> = {
      daily_winner: {
        subject: '🎉 Daily Winner: {{winner_name}} - {{date}}',
        htmlContent: `<h1>🎨 Daily Contest Winner!</h1>
<p>Congratulations to <strong>{{winner_name}}</strong> for winning today's ColorCompete contest!</p>
<h2>{{challenge_title}}</h2>
<img src="{{submission_image}}" alt="Winning submission" style="max-width: 400px;" />
<p>Check out more amazing artwork on ColorCompete!</p>`
      },
      monthly_winner: {
        subject: '🏆 Monthly Champion: {{winner_name}} - {{month}}',
        htmlContent: `<h1>🏆 Monthly Contest Champion!</h1>
<p>We're excited to announce <strong>{{winner_name}}</strong> as our monthly champion for {{month}}!</p>
<h2>{{challenge_title}}</h2>
<img src="{{submission_image}}" alt="Winning submission" style="max-width: 400px;" />
<p>Congratulations on this amazing achievement!</p>`
      },
      winner_reward: {
        subject: '🎁 Your ${"{{reward_amount}}"} Gift Card is Here!',
        htmlContent: `<h1>🎁 Congratulations {{winner_name}}!</h1>
<p>You've won the contest and earned a ${"{{reward_amount}}"} gift card!</p>
<h2>{{challenge_title}}</h2>
<img src="{{submission_image}}" alt="Your winning submission" style="max-width: 400px;" />
<p>Your gift card has been sent to your email. Check your inbox!</p>`
      },
      contest_announcement: {
        subject: '🎨 New Contest Alert: {{challenge_title}}',
        htmlContent: `<h1>🎨 New ColorCompete Contest!</h1>
<p>A fresh contest is now live and waiting for your creativity!</p>
<h2>{{challenge_title}}</h2>
<p>{{challenge_description}}</p>
<p><strong>Contest ends:</strong> {{end_date}}</p>
<p><strong>Prize:</strong> {{prize_amount}}</p>
<a href="{{contest_url}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Join Contest</a>`
      },
      voting_results: {
        subject: '📊 Voting Complete: {{challenge_title}} Results',
        htmlContent: `<h1>📊 Contest Results Are In!</h1>
<p>The voting has ended for <strong>{{challenge_title}}</strong>!</p>
<h2>🥇 Winner: {{winner_name}}</h2>
<img src="{{winning_submission}}" alt="Winning submission" style="max-width: 400px;" />
<p><strong>Total votes:</strong> {{total_votes}}</p>
<p>Thank you to everyone who participated and voted!</p>
<a href="{{results_url}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Full Results</a>`
      },
      comments_feedback: {
        subject: '💬 New Comment on Your Submission: {{challenge_title}}',
        htmlContent: `<h1>💬 You've Got Feedback!</h1>
<p>Someone left a comment on your submission for <strong>{{challenge_title}}</strong>!</p>
<div style="background: #f8f9fa; padding: 16px; border-left: 4px solid #007bff; margin: 16px 0;">
  <p><strong>{{commenter_name}}</strong> said:</p>
  <p style="font-style: italic;">"{{comment_text}}"</p>
</div>
<img src="{{submission_image}}" alt="Your submission" style="max-width: 400px;" />
<a href="{{submission_url}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Submission</a>`
      },
      weekly_summary: {
        subject: '📈 Your Weekly ColorCompete Summary',
        htmlContent: `<h1>📈 Your Week in ColorCompete</h1>
<p>Here's what happened in your creative journey this week:</p>
<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 16px 0;">
  <h3>Your Stats</h3>
  <p>🎨 <strong>{{submissions_count}}</strong> submissions created</p>
  <p>👍 <strong>{{votes_received}}</strong> votes received</p>
  <p>💬 <strong>{{comments_received}}</strong> comments received</p>
  <p>🏆 <strong>{{contests_won}}</strong> contests won</p>
</div>
<div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 16px 0;">
  <h3>This Week's Highlights</h3>
  <p>🎯 <strong>{{active_contests}}</strong> active contests</p>
  <p>👥 <strong>{{new_members}}</strong> new community members</p>
  <p>🎨 <strong>{{total_submissions}}</strong> total submissions this week</p>
</div>
<a href="{{dashboard_url}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Dashboard</a>`
      }
    };
    return templates[triggerType] || { subject: '', htmlContent: '' };
  };

  const handleTriggerTypeChange = (value: string) => {
    const template = getDefaultTemplate(value);
    setFormData({
      ...formData,
      triggerType: value as any,
      emailTemplate: {
        ...formData.emailTemplate,
        subject: template.subject,
        htmlContent: template.htmlContent
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Automations</h2>
          <p className="text-muted-foreground">
            Automated emails for contests, winners, and rewards
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingAutomation(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              New Automation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingAutomation ? 'Edit Automation' : 'Create New Automation'}
                </DialogTitle>
                <DialogDescription>
                  Set up automated emails for contest winners and member engagement
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Automation Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Daily Winner Notification"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Sends daily winner announcements to all members"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="triggerType">Trigger Type</Label>
                  <Select 
                    value={formData.triggerType} 
                    onValueChange={handleTriggerTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily_winner">Daily Winner Announcement</SelectItem>
                      <SelectItem value="monthly_winner">Monthly Winner Announcement</SelectItem>
                      <SelectItem value="winner_reward">Winner Gift Card Reward</SelectItem>
                      <SelectItem value="contest_announcement">Contest Announcements</SelectItem>
                      <SelectItem value="voting_results">Voting Results</SelectItem>
                      <SelectItem value="comments_feedback">Comments & Feedback</SelectItem>
                      <SelectItem value="weekly_summary">Weekly Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Schedule Settings */}
                {(formData.triggerType === 'daily_winner' || formData.triggerType === 'monthly_winner' || formData.triggerType === 'weekly_summary') && (
                  <div className="grid gap-4 p-4 border rounded-lg">
                    <h3 className="font-medium">Schedule Settings</h3>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.schedule.time}
                        onChange={(e) => setFormData({
                          ...formData,
                          schedule: { ...formData.schedule, time: e.target.value }
                        })}
                      />
                    </div>
                    
                    {formData.triggerType === 'monthly_winner' && (
                      <div className="grid gap-2">
                        <Label htmlFor="dayOfMonth">Day of Month</Label>
                        <Input
                          id="dayOfMonth"
                          type="number"
                          min="1"
                          max="31"
                          value={formData.schedule.dayOfMonth}
                          onChange={(e) => setFormData({
                            ...formData,
                            schedule: { ...formData.schedule, dayOfMonth: parseInt(e.target.value) }
                          })}
                        />
                      </div>
                    )}
                    
                    {formData.triggerType === 'weekly_summary' && (
                      <div className="grid gap-2">
                        <Label htmlFor="dayOfWeek">Day of Week</Label>
                        <Select 
                          value={formData.schedule.dayOfWeek?.toString() || '1'}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            schedule: { ...formData.schedule, dayOfWeek: parseInt(value) }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Monday</SelectItem>
                            <SelectItem value="2">Tuesday</SelectItem>
                            <SelectItem value="3">Wednesday</SelectItem>
                            <SelectItem value="4">Thursday</SelectItem>
                            <SelectItem value="5">Friday</SelectItem>
                            <SelectItem value="6">Saturday</SelectItem>
                            <SelectItem value="0">Sunday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="grid gap-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select 
                        value={formData.schedule.timezone}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          schedule: { ...formData.schedule, timezone: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Reward Settings */}
                {formData.triggerType === 'winner_reward' && (
                  <div className="grid gap-4 p-4 border rounded-lg">
                    <h3 className="font-medium">Gift Card Settings</h3>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="giftCardAmount">Gift Card Amount ($)</Label>
                      <Input
                        id="giftCardAmount"
                        type="number"
                        min="1"
                        max="1000"
                        value={formData.rewardSettings.giftCardAmount}
                        onChange={(e) => setFormData({
                          ...formData,
                          rewardSettings: { 
                            ...formData.rewardSettings, 
                            giftCardAmount: parseInt(e.target.value) 
                          }
                        })}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="giftCardMessage">Gift Card Message</Label>
                      <Textarea
                        id="giftCardMessage"
                        value={formData.rewardSettings.giftCardMessage}
                        onChange={(e) => setFormData({
                          ...formData,
                          rewardSettings: { 
                            ...formData.rewardSettings, 
                            giftCardMessage: e.target.value 
                          }
                        })}
                        placeholder="Personal message included with the gift card"
                      />
                    </div>
                  </div>
                )}
                
                <div className="grid gap-2">
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    value={formData.emailTemplate.subject}
                    onChange={(e) => setFormData({
                      ...formData,
                      emailTemplate: { ...formData.emailTemplate, subject: e.target.value }
                    })}
                    placeholder="🎉 Contest Winner Announcement"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="htmlContent">Email Content (HTML)</Label>
                  <Textarea
                    id="htmlContent"
                    value={formData.emailTemplate.htmlContent}
                    onChange={(e) => setFormData({
                      ...formData,
                      emailTemplate: { ...formData.emailTemplate, htmlContent: e.target.value }
                    })}
                    placeholder="<h1>Congratulations {{winner_name}}!</h1>"
                    className="min-h-[200px] font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Available variables: winner_name, winner_username, challenge_title, 
                    submission_image, date, month, reward_amount (use in double curly braces)
                  </p>
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
                  {editingAutomation ? 'Update Automation' : 'Create Automation'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Automations List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">Loading automations...</div>
        ) : automations.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No automations yet</h3>
                <p className="text-muted-foreground mb-4">
                  Set up automated emails for contest winners and member engagement
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Automation
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          automations.map((automation) => (
            <Card key={automation._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTriggerIcon(automation.triggerType)}
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {automation.name}
                        <Badge variant={automation.isActive ? 'default' : 'secondary'}>
                          {automation.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {automation.description || getTriggerTypeLabel(automation.triggerType)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={automation.isActive}
                      onCheckedChange={() => handleToggleAutomation(automation)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(automation)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Automation</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{automation.name}"? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteAutomation(automation)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Sent:</span>
                    <br />
                    <span className="font-medium">{automation.totalSent.toLocaleString()}</span>
                  </div>
                  {automation.schedule && (
                    <div>
                      <span className="text-muted-foreground">Schedule:</span>
                      <br />
                      <span className="font-medium">
                        {automation.triggerType === 'monthly_winner' 
                          ? `${automation.schedule.dayOfMonth}th at ${automation.schedule.time}`
                          : automation.triggerType === 'weekly_summary'
                          ? `${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][automation.schedule.dayOfWeek || 1]} at ${automation.schedule.time}`
                          : `Daily at ${automation.schedule.time}`
                        }
                      </span>
                    </div>
                  )}
                  {automation.rewardSettings && (
                    <div>
                      <span className="text-muted-foreground">Gift Card:</span>
                      <br />
                      <span className="font-medium">${automation.rewardSettings.giftCardAmount}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Last Triggered:</span>
                    <br />
                    <span className="font-medium">
                      {automation.lastTriggered 
                        ? new Date(automation.lastTriggered).toLocaleDateString()
                        : 'Never'
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
