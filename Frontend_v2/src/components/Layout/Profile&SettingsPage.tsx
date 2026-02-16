import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Mail, Building2, Briefcase, Bell, Lock, Save, Check, Sun, Moon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { ROLE_LABELS } from '@/types';

export default function ProfileSettingsPage() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notificationsEnabled ?? true);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const handleSaveProfile = async () => {
    setIsProfileSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    updateUser({
      firstName,
      lastName,
      email,
      notificationsEnabled,
    });
    
    toast({
      title: "Profile updated",
      description: "Your profile information has been saved successfully.",
    });
    setIsProfileSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsPasswordSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    toast({
      title: "Password changed",
      description: "Your password has been updated successfully.",
    });
    
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsPasswordSaving(false);
  };

  const handleNotificationToggle = (checked: boolean) => {
    setNotificationsEnabled(checked);
    updateUser({ notificationsEnabled: checked });
    toast({
      title: checked ? "Notifications enabled" : "Notifications disabled",
      description: checked 
        ? "You will receive notifications for syllabus updates."
        : "You will no longer receive notifications.",
    });
  };

  const handleDarkModeToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
    toast({
      title: checked ? "Dark mode enabled" : "Light mode enabled",
      description: `Switched to ${checked ? 'dark' : 'light'} mode.`,
    });
  };

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Render content based on activeTab parameter */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Profile Settings</h2>
              <p className="text-sm text-muted-foreground">Manage your personal information and security</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Personal Information */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      placeholder="Enter email"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-muted-foreground">User ID</Label>
                  <p className="text-sm font-mono bg-muted px-3 py-2 rounded-lg">{user.id}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Role</Label>
                  <p className="text-sm font-medium">{ROLE_LABELS[user.role]}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      College
                    </Label>
                    <p className="text-sm">{user.college}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Department
                    </Label>
                    <p className="text-sm">{user.department}</p>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveProfile} 
                  className="w-full mt-4"
                  disabled={isProfileSaving}
                >
                  {isProfileSaving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Change Password</CardTitle>
                    <CardDescription>Update your account password</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>

                <Button 
                  onClick={handleChangePassword} 
                  variant="secondary"
                  className="w-full"
                  disabled={isPasswordSaving || !currentPassword || !newPassword || !confirmPassword}
                >
                  {isPasswordSaving ? (
                    <>Updating...</>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
              <Sun className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">System Settings</h2>
              <p className="text-sm text-muted-foreground">Customize your app experience</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Notifications */}
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-info/10 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Notifications</CardTitle>
                    <CardDescription>Manage notification preferences</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Enable Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about syllabus reviews and approvals
                    </p>
                  </div>
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={handleNotificationToggle}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dark Mode */}
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-accent/50 flex items-center justify-center">
                    {theme === 'dark' ? (
                      <Moon className="h-5 w-5 text-accent-foreground" />
                    ) : (
                      <Sun className="h-5 w-5 text-accent-foreground" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">Appearance</CardTitle>
                    <CardDescription>Toggle between light and dark mode</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Switch to {theme === 'dark' ? 'light' : 'dark'} theme
                    </p>
                  </div>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={handleDarkModeToggle}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}