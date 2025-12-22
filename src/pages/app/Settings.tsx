import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  Palette, 
  Bell, 
  Link2, 
  Shield,
  Save,
  User,
  Settings as SettingsIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantTheme } from "@/contexts/TenantThemeContext";

const Settings = () => {
  const { user } = useAuth();
  const { tenantName } = useTenantTheme();
  
  // Notification state management
  const [notifications, setNotifications] = useState({
    email: true,
    jobAssignments: true,
    routeUpdates: true,
    collectionReminders: true,
    certificateAvailability: true,
    esgReports: false,
    clientActivity: true,
  });

  // Password visibility state
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const handleNotificationChange = (key: keyof typeof notifications, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    toast.success(`Notification ${value ? 'enabled' : 'disabled'}`);
  };

  const handleSave = () => {
    // In a real app, this would save to the backend
    toast.success("Settings saved successfully");
  };

  const isAdmin = user?.role === 'admin';
  const isClient = user?.role === 'client';
  const isReseller = user?.role === 'reseller';
  const isDriver = user?.role === 'driver';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground">
          {isAdmin && "Manage platform settings, organisation details, and user access"}
          {isClient && "Manage your organisation details and preferences"}
          {isReseller && "Manage your organisation, branding, and client settings"}
          {isDriver && "Manage your profile and notification preferences"}
        </p>
      </motion.div>

      {/* Profile Settings - For Drivers */}
      {isDriver && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="driverName">Full Name</Label>
                  <Input id="driverName" defaultValue={user?.name || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driverEmail">Email</Label>
                  <Input id="driverEmail" type="email" defaultValue={user?.email || ''} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="driverPhone">Phone Number</Label>
                  <Input id="driverPhone" defaultValue="+44 7700 900123" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleReg">Vehicle Registration</Label>
                  <Input id="vehicleReg" defaultValue="AB12 CDE" className="font-mono" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Organisation Settings - For Admin, Client, Reseller */}
      {(isAdmin || isClient || isReseller) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-5 w-5" />
                Organisation Details
              </CardTitle>
              <CardDescription>
                {isAdmin && "Platform-wide organisation information"}
                {(isClient || isReseller) && "Your company information displayed on reports and certificates"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organisation Name</Label>
                  <Input id="orgName" defaultValue={tenantName || user?.tenantName || ''} />
                </div>
                {(isAdmin || isClient) && (
                  <div className="space-y-2">
                    <Label htmlFor="regNumber">Registration Number</Label>
                    <Input id="regNumber" defaultValue="12345678" />
                  </div>
                )}
              </div>
              {(isAdmin || isClient) && (
                <div className="space-y-2">
                  <Label htmlFor="address">Registered Address</Label>
                  <Input id="address" defaultValue="123 Tech Street, London EC1A 1BB" />
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Primary Email</Label>
                  <Input id="email" type="email" defaultValue={user?.email || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue="+44 20 1234 5678" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* White Label / Branding (for resellers only) */}
      {isReseller && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="h-5 w-5" />
                Branding & White-Label
              </CardTitle>
              <CardDescription>
                Customise the platform appearance for your clients. Changes will apply to all client portals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg bg-foreground/50 flex items-center justify-center text-primary-foreground font-bold text-2xl">
                      {tenantName?.charAt(0) || 'R'}
                    </div>
                    <Button variant="outline" size="sm">Upload Logo</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Recommended: 200x200px, PNG or SVG</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Colour</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-primary border" />
                    <Input id="primaryColor" defaultValue="#0d9488" className="flex-1" />
                  </div>
                  <p className="text-xs text-muted-foreground">Hex color code (e.g., #0d9488)</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-info/10 border border-info/20">
                <p className="text-sm text-foreground">
                  <strong>Note:</strong> Branding changes will apply to all your client portals. Your logo and colors will replace the default platform branding.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Notifications - All roles with functional toggles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: isDriver ? 0.2 : 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how and when you receive updates. Toggle notifications on or off as needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Common notifications - Email */}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex-1">
                <p className="font-medium mb-1">Email notifications</p>
                <p className="text-sm text-muted-foreground">
                  {isDriver && "Receive updates about assigned jobs"}
                  {!isDriver && "Receive updates about job status changes"}
                </p>
              </div>
              <Switch 
                checked={notifications.email}
                onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                className="data-[state=checked]:bg-success"
              />
            </div>
            
            {/* Driver-specific notifications */}
            {isDriver && (
              <>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium mb-1">Job assignments</p>
                    <p className="text-sm text-muted-foreground">Get notified when new jobs are assigned to you</p>
                  </div>
                  <Switch 
                    checked={notifications.jobAssignments}
                    onCheckedChange={(checked) => handleNotificationChange('jobAssignments', checked)}
                    className="data-[state=checked]:bg-success"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium mb-1">Route updates</p>
                    <p className="text-sm text-muted-foreground">Receive updates about route changes or delays</p>
                  </div>
                  <Switch 
                    checked={notifications.routeUpdates}
                    onCheckedChange={(checked) => handleNotificationChange('routeUpdates', checked)}
                    className="data-[state=checked]:bg-success"
                  />
                </div>
              </>
            )}
            
            {/* Client/Reseller/Admin notifications */}
            {!isDriver && (
              <>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium mb-1">Collection reminders</p>
                    <p className="text-sm text-muted-foreground">Get notified 24h before scheduled collections</p>
                  </div>
                  <Switch 
                    checked={notifications.collectionReminders}
                    onCheckedChange={(checked) => handleNotificationChange('collectionReminders', checked)}
                    className="data-[state=checked]:bg-success"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium mb-1">Certificate availability</p>
                    <p className="text-sm text-muted-foreground">Notify when new certificates are ready</p>
                  </div>
                  <Switch 
                    checked={notifications.certificateAvailability}
                    onCheckedChange={(checked) => handleNotificationChange('certificateAvailability', checked)}
                    className="data-[state=checked]:bg-success"
                  />
                </div>
                {(isAdmin || isClient) && (
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium mb-1">ESG report summaries</p>
                      <p className="text-sm text-muted-foreground">Weekly environmental impact digests</p>
                    </div>
                    <Switch 
                      checked={notifications.esgReports}
                      onCheckedChange={(checked) => handleNotificationChange('esgReports', checked)}
                      className="data-[state=checked]:bg-success"
                    />
                  </div>
                )}
                {isReseller && (
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium mb-1">Client activity</p>
                      <p className="text-sm text-muted-foreground">Get notified about your clients' bookings and jobs</p>
                    </div>
                    <Switch 
                      checked={notifications.clientActivity}
                      onCheckedChange={(checked) => handleNotificationChange('clientActivity', checked)}
                      className="data-[state=checked]:bg-success"
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Integrations - Admin only */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="h-5 w-5" />
                Integrations
              </CardTitle>
              <CardDescription>
                Manage platform-wide system integrations with external services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                    <span className="text-lg">📊</span>
                  </div>
                  <div>
                    <p className="font-medium">ERP System</p>
                    <p className="text-sm text-muted-foreground">
                      Platform ERP integration for automated data synchronization
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-success/10 text-success">Connected</Badge>
                  <Button variant="outline" size="sm">
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                    <span className="text-lg">💾</span>
                  </div>
                  <div>
                    <p className="font-medium">Blancco Data Wipe</p>
                    <p className="text-sm text-muted-foreground">
                      Sanitisation system integration for automated certificate generation
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-success/10 text-success">Connected</Badge>
                  <Button variant="outline" size="sm">
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Security - For all roles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: isDriver ? 0.3 : 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5" />
              Security & Password
            </CardTitle>
            <CardDescription>
              Keep your account secure by updating your password regularly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-semibold">
                Current Password
              </Label>
              <div className="relative">
                <Input 
                  id="currentPassword" 
                  type={showPasswords.current ? "text" : "password"} 
                  placeholder="Enter your current password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {/* New Password Section */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold mb-3 block">New Password</Label>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-xs text-muted-foreground">
                      New Password
                    </Label>
                    <div className="relative">
                      <Input 
                        id="newPassword" 
                        type={showPasswords.new ? "text" : "password"} 
                        placeholder="Create a strong password"
                        value={passwordForm.new}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input 
                        id="confirmPassword" 
                        type={showPasswords.confirm ? "text" : "password"} 
                        placeholder="Re-enter your new password"
                        value={passwordForm.confirm}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-2 mb-3">
                  <Shield className="h-4 w-4 text-primary mt-0.5" />
                  <p className="text-sm font-semibold text-foreground">Password Requirements</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {passwordForm.new.length >= 8 ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={passwordForm.new.length >= 8 ? "text-success" : "text-muted-foreground"}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/[A-Z]/.test(passwordForm.new) ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={/[A-Z]/.test(passwordForm.new) ? "text-success" : "text-muted-foreground"}>
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/[a-z]/.test(passwordForm.new) ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={/[a-z]/.test(passwordForm.new) ? "text-success" : "text-muted-foreground"}>
                      One lowercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/\d/.test(passwordForm.new) ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={/\d/.test(passwordForm.new) ? "text-success" : "text-muted-foreground"}>
                      One number
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Warning */}
            {isAdmin && (
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-warning-foreground mb-1">
                    Administrator Account
                  </p>
                  <p className="text-sm text-warning-foreground/80">
                    Password changes affect your platform access. Ensure you have alternative access methods configured before updating.
                  </p>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button 
                variant="header" 
                size="lg"
                onClick={() => {
                  if (!passwordForm.current) {
                    toast.error("Please enter your current password");
                    return;
                  }
                  if (!passwordForm.new) {
                    toast.error("Please enter a new password");
                    return;
                  }
                  if (passwordForm.new !== passwordForm.confirm) {
                    toast.error("Passwords do not match");
                    return;
                  }
                  if (passwordForm.new.length < 8 || !/[A-Z]/.test(passwordForm.new) || !/[a-z]/.test(passwordForm.new) || !/\d/.test(passwordForm.new)) {
                    toast.error("Password does not meet requirements");
                    return;
                  }
                  toast.success("Password updated successfully", {
                    description: "Your password has been changed. Please use your new password for future logins.",
                  });
                  setPasswordForm({ current: '', new: '', confirm: '' });
                }}
                className="min-w-[160px]"
              >
                <Shield className="h-4 w-4 mr-2" />
                Update Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex justify-end"
      >
        <Button variant="default" onClick={handleSave} size="lg">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </motion.div>
    </div>
  );
};

export default Settings;
