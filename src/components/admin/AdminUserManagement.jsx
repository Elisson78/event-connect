import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Shield, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

const UserListCard = ({ title, description, users, onEditUser, onUserDelete, currentUserId }) => {
  const { t } = useTranslation('common');
  return (
  <Card className="shadow-lg">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4 max-h-64 overflow-y-auto">
        {users.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            {t('no_user_found', { type: title.toLowerCase().replace(/s$/, '') })}
          </p>
        ) : (
          users.map((user) => (
            <div key={user.id} className={`flex justify-between items-center p-3 border rounded-lg ${user.role === 'admin' ? 'bg-blue-50 border-blue-200' : ''}`}>
              <div className="flex items-center space-x-3">
                {user.role === 'admin' && <Shield className="h-5 w-5 text-blue-600" />}
                <div>
                  <p className="font-medium">{user.name || user.email}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="icon" onClick={() => onEditUser(user)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                {user.id !== currentUserId && (
                 <Button
                    onClick={() => onUserDelete(user.id, user.name || user.email)}
                    size="icon"
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </CardContent>
  </Card>
  );
};

const AdminUserManagement = ({ usersData, onUserDelete, currentUserId, onUserUpdate }) => {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [availableRoles, setAvailableRoles] = useState([]);

  const fetchRoles = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('roles').select('*');
      if (error) throw error;
      setAvailableRoles(data || []);
    } catch (error) {
      toast({ title: t('error_fetching_roles'), description: error.message, variant: 'destructive' });
    }
  }, [toast]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleEditUser = (user) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setIsEditDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsEditDialogOpen(false);
    setEditingUser(null);
    setSelectedRole('');
  };

  const handleSaveChanges = async () => {
    if (!editingUser || !selectedRole) return;
    try {
      await onUserUpdate(editingUser.id, { role: selectedRole });
      handleCloseDialog();
    } catch (error) {
       toast({ title: t('error_updating_user_role'), description: error.message, variant: 'destructive' });
    }
  };

  const groupedUsers = availableRoles.map(role => ({
    ...role,
    users: usersData.all.filter(user => user.role === role.name)
  }));


  return (
    <>
      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
        {groupedUsers.map(group => (
          <UserListCard 
            key={group.name}
            title={group.display_name + 's'}
            description={t('manage_users_with_role', { role: group.display_name })}
            users={group.users}
            onEditUser={handleEditUser}
            onUserDelete={onUserDelete}
            currentUserId={currentUserId}
          />
        ))}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('edit_user')}</DialogTitle>
            <DialogDescription>
              {t('change_role_of_user', { name: editingUser?.name || editingUser?.email })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="role-select">{t('user_role')}</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role-select">
                  <SelectValue placeholder={t('select_a_role')} />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map(role => (
                    <SelectItem key={role.name} value={role.name}>
                      {role.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>{t('cancel')}</Button>
            <Button onClick={handleSaveChanges}>{t('save_changes')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminUserManagement;