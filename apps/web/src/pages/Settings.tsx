import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sun, Moon, Monitor, Trash2, Download, User, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { storage } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  getChatHistory,
  getFeedOptimizations,
  getIngredients,
  deleteDocument,
} from '@/lib/firestore-services';

export function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update displayName when user changes
  useEffect(() => {
    setDisplayName(user?.displayName || '');
  }, [user?.displayName]);

  const exportAllData = async () => {
    if (!user?.id) return;

    try {
      const [chats, feeds, ingredients] = await Promise.all([
        getChatHistory(user.id),
        getFeedOptimizations(user.id),
        getIngredients(user.id),
      ]);

      const data = {
        exportDate: new Date().toISOString(),
        user: user,
        chats,
        feeds,
        ingredients,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `istock-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: 'Data exported successfully',
      });
    } catch (error: any) {
      console.error('Failed to export data:', error);
      // Only show toast for non-permission errors
      if (error?.code !== 'permission-denied') {
        toast({
          title: 'Error',
          description: 'Failed to export data',
          variant: 'destructive',
        });
      }
    }
  };

  const clearChatHistory = async () => {
    if (!user?.id || !confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      return;
    }

    try {
      const chats = await getChatHistory(user.id);
      await Promise.all(chats.map((chat) => deleteDocument('chats', chat.id)));
      
      toast({
        title: 'Success',
        description: 'Chat history cleared successfully',
      });
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to clear chat history:', error);
      // Only show toast for non-permission errors
      if (error?.code !== 'permission-denied') {
        toast({
          title: 'Error',
          description: 'Failed to clear chat history',
          variant: 'destructive',
        });
      }
    }
  };

  const clearFeedHistory = async () => {
    if (!user?.id || !confirm('Are you sure you want to clear all feed optimization history? This action cannot be undone.')) {
      return;
    }

    try {
      const feeds = await getFeedOptimizations(user.id);
      await Promise.all(feeds.map((feed) => deleteDocument('feedOptimizations', feed.id)));
      
      toast({
        title: 'Success',
        description: 'Feed history cleared successfully',
      });
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to clear feed history:', error);
      // Only show toast for non-permission errors
      if (error?.code !== 'permission-denied') {
        toast({
          title: 'Error',
          description: 'Failed to clear feed history',
          variant: 'destructive',
        });
      }
    }
  };

  const clearIngredients = async () => {
    if (!user?.id || !confirm('Are you sure you want to clear all saved ingredients? This action cannot be undone.')) {
      return;
    }

    try {
      const ingredients = await getIngredients(user.id);
      await Promise.all(ingredients.map((ing) => deleteDocument('ingredients', ing.id)));
      
      toast({
        title: 'Success',
        description: 'Ingredients cleared successfully',
      });
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to clear ingredients:', error);
      // Only show toast for non-permission errors
      if (error?.code !== 'permission-denied') {
        toast({
          title: 'Error',
          description: 'Failed to clear ingredients',
          variant: 'destructive',
        });
      }
    }
  };

  const handleProfileUpdate = async () => {
    if (!user || !auth.currentUser) {
      toast({
        title: 'Error',
        description: 'You must be logged in to update your profile',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdatingProfile(true);

    try {
      let photoURL = user.photoURL || null;

      // Upload profile picture if a new file was selected
      if (profilePictureFile) {
        const storageRef = ref(storage, `profilePictures/${user.uid}`);
        await uploadBytes(storageRef, profilePictureFile);
        photoURL = await getDownloadURL(storageRef);
      }

      // Update profile
      const updateData: { displayName?: string; photoURL?: string } = {};
      if (displayName.trim() !== user.displayName) {
        updateData.displayName = displayName.trim() || null;
      }
      if (photoURL && photoURL !== user.photoURL) {
        updateData.photoURL = photoURL;
      }

      if (Object.keys(updateData).length > 0) {
        await updateProfile(auth.currentUser, updateData);
      }

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });

      // Reset file input
      setProfilePictureFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Reload to show updated profile
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto chat-scrollbar">
      <div className="p-6 border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-md backdrop-saturate-150 shadow-sm sticky top-0 z-50" style={{ backdropFilter: 'blur(16px) saturate(180%)' }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            Manage your account and preferences
          </p>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        {/* Profile Settings */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your account information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <div className="flex items-center gap-4">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Profile'}
                    className="h-16 w-16 rounded-full object-cover border-2 border-primary/20"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                    {user?.displayName ? (
                      <span className="text-lg font-semibold text-primary">
                        {user.displayName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                    ) : (
                      <User className="h-8 w-8 text-primary" />
                    )}
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setProfilePictureFile(file);
                      }
                    }}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {profilePictureFile
                      ? `Selected: ${profilePictureFile.name}`
                      : 'Upload a new profile picture'}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="px-3 py-2 rounded-md border bg-muted text-sm font-medium">
                {user?.email}
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <Button
              onClick={handleProfileUpdate}
              disabled={isUpdatingProfile}
              className="w-full"
            >
              {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sun className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the theme and appearance</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      <span>Light</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      <span>Dark</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <span>System</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose your preferred theme. System will match your device settings.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Export or clear your data</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div>
                  <Label className="font-semibold">Export All Data</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Download all your data as JSON
                  </p>
                </div>
                <Button onClick={exportAllData} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-semibold text-destructive">Clear Chat History</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Delete all health consultation records
                  </p>
                </div>
                <Button onClick={clearChatHistory} variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-semibold text-destructive">Clear Feed History</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Delete all feed optimization records
                  </p>
                </div>
                <Button onClick={clearFeedHistory} variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-semibold text-destructive">Clear Ingredients</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Delete all saved ingredients
                  </p>
                </div>
                <Button onClick={clearIngredients} variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>About iStock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">iStock</strong> - Precision Livestock Platform
              </p>
              <p>Version 1.0.0</p>
              <p className="pt-2">
                An AI-powered livestock health and nutrition application that provides farmers
                with immediate, citable diagnostic and treatment advice.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

