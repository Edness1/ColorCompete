import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Calendar, Search, Filter, RefreshCw } from 'lucide-react';
import { API_URL } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdDate: string;
  subscription: {
    type: 'free' | 'lite' | 'pro' | 'champ';
  };
  emailPreferences: {
    marketingEmails: boolean;
    contestNotifications: boolean;
    winnerAnnouncements: boolean;
    rewardNotifications: boolean;
  };
}

interface SubscriberStats {
  totalUsers: number;
  freeUsers: number;
  liteUsers: number;
  proUsers: number;
  champUsers: number;
  recentUsers: User[];
  marketingOptIn: number;
  contestOptIn: number;
}

export function SubscriberManagement() {
  const [stats, setStats] = useState<SubscriberStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const { user } = useAuth();

  useEffect(() => {
    fetchSubscriberStats();
    fetchAllUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, tierFilter]);

  const fetchSubscriberStats = async () => {
    try {
      setError(null);
      console.log('Fetching subscriber stats for user:', user?._id, 'isAdmin:', user?.isAdmin);
      
      // First try the optimized admin endpoint
      let response = await fetch(`${API_URL}/api/users/admin/subscriber-stats`, {
        headers: {
          'user-id': user?._id || ''
        }
      });

      console.log('Admin endpoint response status:', response.status);
      
      if (!response.ok) {
        console.log('Admin endpoint failed, falling back to regular users endpoint');
        // Fallback to regular users endpoint and calculate stats client-side
        response = await fetch(`${API_URL}/api/users`, {
          headers: {
            'user-id': user?._id || ''
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const allUsers = await response.json();
        
        // Calculate stats client-side
        const totalUsers = allUsers.length;
        const freeUsers = allUsers.filter((u: User) => !u.subscription?.type || u.subscription.type === 'free').length;
        const liteUsers = allUsers.filter((u: User) => u.subscription?.type === 'lite').length;
        const proUsers = allUsers.filter((u: User) => u.subscription?.type === 'pro').length;
        const champUsers = allUsers.filter((u: User) => u.subscription?.type === 'champ').length;
        
        // Get recent users (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentUsers = allUsers
          .filter((u: User) => new Date(u.createdDate) > thirtyDaysAgo)
          .sort((a: User, b: User) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
          .slice(0, 10);

        const marketingOptIn = allUsers.filter((u: User) => u.emailPreferences?.marketingEmails).length;
        const contestOptIn = allUsers.filter((u: User) => u.emailPreferences?.contestNotifications).length;

        const calculatedStats = {
          totalUsers,
          freeUsers,
          liteUsers,
          proUsers,
          champUsers,
          recentUsers,
          marketingOptIn,
          contestOptIn
        };

        setStats(calculatedStats);
      } else {
        // Use the optimized endpoint response
        const stats = await response.json();
        setStats(stats);
      }
    } catch (error) {
      console.error('Error fetching subscriber stats:', error);
      setError(error instanceof Error ? error.message : 'Failed to load subscriber statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          'user-id': user?._id || ''
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const allUsers = await response.json();
      const sortedUsers = allUsers.sort((a: User, b: User) => 
        new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
      );
      
      setUsers(sortedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load user list');
    } finally {
      setUsersLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(user => {
        const userTier = user.subscription?.type || 'free';
        return userTier === tierFilter;
      });
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'champ': return 'default';
      case 'pro': return 'secondary';
      case 'lite': return 'outline';
      default: return 'outline';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'champ': return 'text-yellow-600';
      case 'pro': return 'text-purple-600';
      case 'lite': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading subscriber data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-2">Error loading data</div>
          <div className="text-sm text-muted-foreground">{error}</div>
          <Button 
            onClick={() => {
              fetchSubscriberStats();
              fetchAllUsers();
            }} 
            className="mt-4"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Subscribers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Subscribers (Last 30 Days)
          </CardTitle>
          <CardDescription>Newest users who joined the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.recentUsers && stats.recentUsers.length > 0 ? (
            <div className="space-y-3">
              {stats.recentUsers.map((user) => (
                <div key={user._id} className="flex items-center justify-between py-2 px-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div>
                      <div className="font-medium">{user.firstName} {user.lastName}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getTierBadgeVariant(user.subscription?.type || 'free')}>
                      {(user.subscription?.type || 'free').toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(user.createdDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No new subscribers in the last 30 days
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Subscribers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Subscribers</CardTitle>
              <CardDescription>Manage and view all registered users</CardDescription>
            </div>
            <Button
              onClick={() => {
                fetchSubscriberStats();
                fetchAllUsers();
              }}
              variant="outline"
              size="sm"
              disabled={loading || usersLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(loading || usersLoading) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="lite">Lite</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="champ">Champ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Email Preferences</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Loading users...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : currentUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {filteredUsers.length === 0 && users.length > 0 
                        ? 'No users match your filters' 
                        : 'No users found'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  currentUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={getTierBadgeVariant(user.subscription?.type || 'free')}
                          className={getTierColor(user.subscription?.type || 'free')}
                        >
                          {(user.subscription?.type || 'free').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.createdDate)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-2 text-xs">
                            <span className={`w-2 h-2 rounded-full ${user.emailPreferences?.marketingEmails ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span>Marketing</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs">
                            <span className={`w-2 h-2 rounded-full ${user.emailPreferences?.contestNotifications ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span>Contests</span>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}