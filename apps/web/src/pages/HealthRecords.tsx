import { useState, useEffect } from 'react';
import { Search, FileText, Calendar, Download, Trash2, Edit2, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from '@/lib/date-utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  getChatHistory,
  updateChat,
  deleteChat as deleteChatFromFirestore,
} from '@/lib/firestore-services';

interface HealthRecord {
  id: string;
  title?: string;
  query: string;
  response: string;
  sources?: Array<{ uri: string; title: string }>;
  confidence?: number;
  timestamp: Date;
  animalType?: string;
}

export function HealthRecords() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecords, setFilteredRecords] = useState<HealthRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const loadRecords = async () => {
      setIsLoading(true);
      try {
        const chats = await getChatHistory(user.id);
        const parsedRecords = chats.map((r) => ({
          id: r.id,
          title: r.title || r.query?.substring(0, 50) || 'Untitled Chat',
          query: r.query,
          response: r.response,
          sources: r.sources,
          confidence: r.confidence,
          timestamp: r.timestamp instanceof Date ? r.timestamp : new Date(r.timestamp),
        }));
        setRecords(parsedRecords.sort((a: HealthRecord, b: HealthRecord) => 
          b.timestamp.getTime() - a.timestamp.getTime()
        ));
      } catch (error: any) {
        // Don't log errors for permission issues - they're expected until rules are set up
        if (error?.code !== 'permission-denied') {
          console.error('Failed to load health records:', error);
          toast({
            title: 'Error',
            description: 'Failed to load health records',
            variant: 'destructive',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadRecords();
  }, [user?.id, toast]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRecords(records);
      return;
    }

    const query = searchQuery.toLowerCase();
    setFilteredRecords(
      records.filter(
        (record) =>
          (record.title || '').toLowerCase().includes(query) ||
          record.query.toLowerCase().includes(query) ||
          record.response?.toLowerCase().includes(query) ||
          record.animalType?.toLowerCase().includes(query)
      )
    );
  }, [searchQuery, records]);

  const startRename = (record: HealthRecord) => {
    setEditingId(record.id);
    setEditTitle(record.title || record.query.substring(0, 50) || 'Untitled Chat');
  };

  const saveRename = async () => {
    if (!editingId || !user?.id) return;
    
    try {
      await updateChat(user.id, editingId, {
        title: editTitle || records.find((r) => r.id === editingId)?.query.substring(0, 50) || 'Untitled Chat',
      });
      
      const updated = records.map((r) =>
        r.id === editingId ? { ...r, title: editTitle || r.query.substring(0, 50) || 'Untitled Chat' } : r
      );
      setRecords(updated);
      setEditingId(null);
      setEditTitle('');
      
      toast({
        title: 'Success',
        description: 'Record title updated',
      });
    } catch (error: any) {
      console.error('Failed to update record:', error);
      // Only show toast for non-permission errors
      if (error?.code !== 'permission-denied') {
        toast({
          title: 'Error',
          description: 'Failed to update record',
          variant: 'destructive',
        });
      }
    }
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const deleteRecord = async (id: string) => {
    if (!user?.id || !confirm('Are you sure you want to delete this record?')) return;
    
    try {
      await deleteChatFromFirestore(user.id, id);
      const updated = records.filter((r) => r.id !== id);
      setRecords(updated);
      
      toast({
        title: 'Success',
        description: 'Record deleted',
      });
    } catch (error: any) {
      console.error('Failed to delete record:', error);
      // Only show toast for non-permission errors
      if (error?.code !== 'permission-denied') {
        toast({
          title: 'Error',
          description: 'Failed to delete record',
          variant: 'destructive',
        });
      }
    }
  };

  const exportRecord = (record: HealthRecord) => {
    const content = `Health Record\n\nQuery: ${record.query}\n\nResponse: ${record.response}\n\nDate: ${record.timestamp.toLocaleString()}\n\nConfidence: ${record.confidence ? Math.round(record.confidence * 100) + '%' : 'N/A'}\n\nSources:\n${record.sources?.map((s, i) => `${i + 1}. ${s.title}: ${s.uri}`).join('\n') || 'No sources'}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-record-${record.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto chat-scrollbar">
      <div className="p-6 border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-md backdrop-saturate-150 shadow-sm sticky top-0 z-50" style={{ backdropFilter: 'blur(16px) saturate(180%)' }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Chat History
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            View and manage your chat history
          </p>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        {/* Search Bar */}
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, query, response, or animal type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Records List */}
        {filteredRecords.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="pt-12 pb-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery ? 'No records found' : 'No chat history yet'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Start chatting to create chat history'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <Card key={record.id} className="border-0 shadow-md hover:shadow-xl hover:scale-[1.01] transition-all duration-300 cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {editingId === record.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveRename();
                              if (e.key === 'Escape') cancelRename();
                            }}
                            className="text-base font-semibold"
                            autoFocus
                          />
                          <Button size="icon" variant="ghost" onClick={saveRename} className="h-8 w-8">
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={cancelRename} className="h-8 w-8">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <CardTitle className="text-base font-semibold line-clamp-2">
                          {record.title || record.query}
                        </CardTitle>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(record.timestamp)}
                        </div>
                        {record.confidence && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            {Math.round(record.confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {editingId !== record.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startRename(record)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => exportRecord(record)}
                            className="h-8 w-8"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteRecord(record.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground line-clamp-3 mb-3">
                    {record.response}
                  </p>
                  {record.sources && record.sources.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        Sources ({record.sources.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {record.sources.slice(0, 3).map((source, idx) => (
                          <a
                            key={idx}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline px-2 py-1 rounded bg-primary/5"
                          >
                            {source.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

