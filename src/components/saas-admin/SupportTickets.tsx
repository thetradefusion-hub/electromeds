import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  ArrowUpCircle,
  Bug,
  CreditCard,
  HelpCircle,
  Lightbulb,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { SupportTicket } from '@/hooks/useSaasAdmin';
import { toast } from 'sonner';

interface SupportTicketsProps {
  tickets: SupportTicket[];
  isLoading: boolean;
  onUpdateStatus: (ticketId: string, status: SupportTicket['status']) => Promise<void>;
}

export default function SupportTickets({ tickets, isLoading, onUpdateStatus }: SupportTicketsProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
      ticket.description.toLowerCase().includes(search.toLowerCase()) ||
      ticket.doctor?.profile?.name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      open: { variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
      in_progress: { variant: 'default', icon: <Clock className="h-3 w-3" /> },
      resolved: { variant: 'secondary', icon: <CheckCircle className="h-3 w-3" /> },
      closed: { variant: 'outline', icon: <CheckCircle className="h-3 w-3" /> },
    };
    const { variant, icon } = config[status] || config.open;
    return (
      <Badge variant={variant} className="gap-1">
        {icon}
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-muted text-muted-foreground',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return (
      <Badge className={colors[priority]}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      general: <HelpCircle className="h-4 w-4" />,
      billing: <CreditCard className="h-4 w-4" />,
      technical: <Settings className="h-4 w-4" />,
      feature_request: <Lightbulb className="h-4 w-4" />,
      bug: <Bug className="h-4 w-4" />,
    };
    return icons[category] || icons.general;
  };

  const handleStatusChange = async (ticketId: string, newStatus: SupportTicket['status']) => {
    try {
      await onUpdateStatus(ticketId, newStatus);
      toast.success('Ticket status updated');
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error) {
      toast.error('Failed to update ticket status');
    }
  };

  const stats = {
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    urgent: tickets.filter(t => t.priority === 'urgent' && t.status !== 'closed').length,
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                  {stats.open}
                </p>
                <p className="text-sm text-muted-foreground">Open Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                  {stats.inProgress}
                </p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                  {stats.resolved}
                </p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                <ArrowUpCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                  {stats.urgent}
                </p>
                <p className="text-sm text-muted-foreground">Urgent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-blue-500/5 to-blue-500/5">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            Support Tickets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tickets List */}
          <div className="space-y-3">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tickets found</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <Dialog key={ticket.id}>
                  <DialogTrigger asChild>
                    <div 
                      className="border rounded-lg p-4 hover:bg-secondary/30 cursor-pointer transition-colors"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1 text-muted-foreground">
                            {getCategoryIcon(ticket.category)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{ticket.subject}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-1">{ticket.description}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span>{ticket.doctor?.profile?.name || 'Unknown'}</span>
                              <span>•</span>
                              <span>{format(new Date(ticket.created_at), 'dd MMM yyyy, HH:mm')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        {getCategoryIcon(ticket.category)}
                        {ticket.subject}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                        <Badge variant="outline" className="capitalize">{ticket.category.replace('_', ' ')}</Badge>
                      </div>
                      
                      <div className="bg-secondary/30 rounded-lg p-4">
                        <p className="text-sm font-medium mb-2">From: {ticket.doctor?.profile?.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{ticket.doctor?.profile?.email}</p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
                      </div>

                      <div className="flex gap-2">
                        <Select 
                          value={ticket.status} 
                          onValueChange={(value) => handleStatusChange(ticket.id, value as SupportTicket['status'])}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Change status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Reply</h4>
                        <Textarea 
                          placeholder="Type your reply..."
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          rows={4}
                        />
                        <Button className="mt-2" disabled={!replyMessage.trim()}>
                          Send Reply
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
