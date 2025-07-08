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
import { Plus, Settings, Edit, Trash2, Clock, Mail, Calendar, TrendingUp } from 'lucide-react';
import { API_URL } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface EmailAutomation {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  triggerType: 'contest_announcement' | 'voting_results' | 'weekly_summary';
  emailTemplate: {
    subject: string;
    htmlContent: string;
    textContent?: string;
  };
  schedule?: {
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    timezone: string;
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
    triggerType: 'contest_announcement' | 'voting_results' | 'weekly_summary';
    emailTemplate: {
      subject: string;
      htmlContent: string;
      textContent: string;
    };
    schedule: {
      time: string;
      dayOfWeek?: number;
      dayOfMonth?: number;
      timezone: string;
    };
  }>({
    name: '',
    description: '',
    triggerType: 'contest_announcement',
    emailTemplate: {
      subject: '',
      htmlContent: '',
      textContent: ''
    },
    schedule: {
      time: '09:00', // Default 9am for contest announcements
      timezone: 'America/New_York'
    }
  });

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      console.log('Fetching automations for user:', user?._id);
      const response = await fetch(API_URL+'/api/email/automations', {
        headers: {
          'user-id': user?._id
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched automations:', data);
        setAutomations(data);
      } else {
        const errorData = await response.json();
        console.error('Fetch failed:', response.status, errorData);
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
      console.log('Submitting automation data:', formData);
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
        const result = await response.json();
        console.log('Automation saved:', result);
        await fetchAutomations();
        setIsCreateDialogOpen(false);
        setEditingAutomation(null);
        resetForm();
      } else {
        const errorData = await response.json();
        console.error('Submit failed:', response.status, errorData);
        alert(`Failed to save automation: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving automation:', error);
      alert('Error saving automation. Check console for details.');
    }
  };

  const handleToggleAutomation = async (automation: EmailAutomation) => {
    try {
      console.log('Toggling automation:', automation._id, 'Currently:', automation.isActive);
      const response = await fetch(API_URL+`/api/email/automations/${automation._id}/toggle`, {
        method: 'PATCH',
        headers: {
          'user-id': user?._id
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Toggle result:', result);
        await fetchAutomations();
      } else {
        const errorData = await response.json();
        console.error('Toggle failed:', response.status, errorData);
        alert(`Failed to toggle automation: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error toggling automation:', error);
      alert('Error toggling automation. Check console for details.');
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
      triggerType: 'contest_announcement',
      emailTemplate: {
        subject: '',
        htmlContent: '',
        textContent: ''
      },
      schedule: {
        time: '09:00', // Default 9am for contest announcements
        dayOfWeek: 0, // Default Sunday for weekly summary
        timezone: 'America/New_York'
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
        time: automation.schedule?.time || (automation.triggerType === 'contest_announcement' ? '09:00' : '10:00'),
        dayOfWeek: automation.schedule?.dayOfWeek || (automation.triggerType === 'weekly_summary' ? 0 : undefined),
        dayOfMonth: automation.schedule?.dayOfMonth,
        timezone: automation.schedule?.timezone || 'America/New_York'
      }
    });
    setEditingAutomation(automation);
    setIsCreateDialogOpen(true);
  };

  const getTriggerTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      contest_announcement: 'Contest Announcements',
      voting_results: 'Voting Results',
      weekly_summary: 'Weekly Summary'
    };
    return labels[type] || type;
  };

  const getTriggerIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      contest_announcement: <Plus className="w-4 h-4" />,
      voting_results: <TrendingUp className="w-4 h-4" />,
      weekly_summary: <Calendar className="w-4 h-4" />
    };
    return icons[type] || <Settings className="w-4 h-4" />;
  };

  const getDefaultTemplate = (triggerType: string) => {
    const templates: Record<string, { subject: string; htmlContent: string }> = {
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
        subject: '🏆 Contest Winner: {{winner_name}} - {{challenge_title}}',
        htmlContent: `<h1>🏆 Contest Results Are In!</h1>
<p>The voting has ended for <strong>{{challenge_title}}</strong>!</p>
<h2>🥇 Winner: {{winner_name}}</h2>
<img src="{{winning_submission}}" alt="Winning submission" style="max-width: 400px;" />
<p><strong>Total votes:</strong> {{total_votes}}</p>
<p>Thank you to everyone who participated and voted!</p>
<a href="{{results_url}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Full Results</a>`
      },
      weekly_summary: {
        subject: '📈 Your Weekly ColorCompete Summary',
        htmlContent: `<h1>📈 Your Week in ColorCompete</h1>
<p>Hi {{user_name}}, here's what happened in your creative journey this week:</p>
<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 16px 0;">
  <h3>Your Stats</h3>
  <p>🎨 <strong>{{user_submissions_count}}</strong> submissions created</p>
  <p>🏆 <strong>{{user_wins_count}}</strong> contests won</p>
  <p>👍 <strong>{{user_total_votes}}</strong> total votes across all your submissions</p>
</div>
<div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 16px 0;">
  <h3>This Week's Community Highlights</h3>
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
    
    // Set default times based on automation type
    let defaultTime = '09:00';
    let defaultDayOfWeek = undefined;
    
    if (value === 'contest_announcement') {
      defaultTime = '09:00'; // 9am for contest announcements
    } else if (value === 'voting_results') {
      defaultTime = '10:00'; // 10am for voting results
    } else if (value === 'weekly_summary') {
      defaultTime = '10:00'; // 10am for weekly summary
      defaultDayOfWeek = 0; // Sunday
    }
    
    setFormData({
      ...formData,
      triggerType: value as any,
      emailTemplate: {
        ...formData.emailTemplate,
        subject: template.subject,
        htmlContent: template.htmlContent
      },
      schedule: {
        ...formData.schedule,
        time: defaultTime,
        dayOfWeek: defaultDayOfWeek
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Automations</h2>
          <p className="text-muted-foreground">
            Automated emails for contest announcements, voting results, and weekly summaries
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
                  Set up automated emails for contest announcements, voting results, and weekly summaries
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Automation Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contest Announcement Automation"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Sends contest announcements to all members when new contests are created"
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
                      <SelectItem value="contest_announcement">Contest Announcements</SelectItem>
                      <SelectItem value="voting_results">Voting Results</SelectItem>
                      <SelectItem value="weekly_summary">Weekly Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Schedule Settings */}
                {(formData.triggerType === 'contest_announcement' || formData.triggerType === 'voting_results' || formData.triggerType === 'weekly_summary') && (
                  <div className="grid gap-4 p-4 border rounded-lg">
                    <h3 className="font-medium">Schedule Settings</h3>
                    <div className="text-sm text-muted-foreground mb-2">
                      {formData.triggerType === 'contest_announcement' && 'Contest announcements will be sent daily at 9am user timezone'}
                      {formData.triggerType === 'voting_results' && 'Voting results will be sent daily at 10am user timezone when winners are announced'}
                      {formData.triggerType === 'weekly_summary' && 'Weekly summaries will be sent every Sunday at 10am user timezone'}
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.schedule.time}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            schedule: { ...formData.schedule, time: e.target.value }
                          });
                        }}
                      />
                    </div>
                    
                    {formData.triggerType === 'weekly_summary' && (
                      <div className="grid gap-2">
                        <Label htmlFor="dayOfWeek">Day of Week</Label>
                        <Select 
                          value={formData.schedule.dayOfWeek?.toString() || '0'}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            schedule: { ...formData.schedule, dayOfWeek: parseInt(value) }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Sunday</SelectItem>
                            <SelectItem value="1">Monday</SelectItem>
                            <SelectItem value="2">Tuesday</SelectItem>
                            <SelectItem value="3">Wednesday</SelectItem>
                            <SelectItem value="4">Thursday</SelectItem>
                            <SelectItem value="5">Friday</SelectItem>
                            <SelectItem value="6">Saturday</SelectItem>
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

                
                <div className="grid gap-2">
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    value={formData.emailTemplate.subject}
                    onChange={(e) => setFormData({
                      ...formData,
                      emailTemplate: { ...formData.emailTemplate, subject: e.target.value }
                    })}
                    placeholder="🎨 New Contest Alert!"
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
                    placeholder="<h1>🎨 New Contest Available!</h1><p>Join the latest ColorCompete challenge: {{challenge_title}}</p>"
                    className="min-h-[200px] font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Available variables: 
                    <br />• Contest: challenge_title, challenge_description, contest_url, end_date, prize_amount
                    <br />• Voting: winner_name, winning_submission, total_votes, results_url
                    <br />• Weekly: user_name, user_submissions_count, user_wins_count, user_total_votes, dashboard_url
                    <br />(use in double curly braces like {`{{variable_name}}`})
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
                  Set up automated emails for contest announcements, voting results, and weekly summaries
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
                        {automation.triggerType === 'weekly_summary'
                          ? `${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][automation.schedule.dayOfWeek || 0]} at ${automation.schedule.time}`
                          : automation.triggerType === 'voting_results'
                          ? `Daily at ${automation.schedule.time} when winners announced`
                          : automation.triggerType === 'contest_announcement'
                          ? `Daily at ${automation.schedule.time} for new contests`
                          : 'Event-triggered'
                        }
                      </span>
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
