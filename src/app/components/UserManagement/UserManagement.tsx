import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import styles from './UserManagement.module.css';
import { Profile, UserRole } from '@/app/types/database';

const UserManagement = ({ currentUser }: { currentUser: User }) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(profiles || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRoles: UserRole[]) => {
    setUpdateLoading(userId);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          roles: newRoles,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user => (user.id === userId && data ? { ...user, ...data } : user))
      );
    } catch (err) {
      console.error('Error updating role:', err);
      setError(err instanceof Error ? err.message : 'Failed to update role');
      // Refresh users list to ensure UI is in sync with database
      await fetchUsers();
    } finally {
      setUpdateLoading(null);
    }
  };

  const toggleRole = async (userId: string, role: UserRole, currentRoles: UserRole[]) => {
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];

    // Ensure 'user' role is always present
    if (!newRoles.includes('user')) {
      newRoles.push('user');
    }

    await updateUserRole(userId, newRoles);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <div className={styles.loading}>Loading users...</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>User Management</h2>
      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={() => setError(null)} className={styles.dismissError}>
            ✕
          </button>
        </div>
      )}
      <div className={styles.userList}>
        {users.map(user => (
          <div key={user.id} className={styles.userCard}>
            <div className={styles.userInfo}>
              <span className={styles.email}>{user.email}</span>
              <div className={styles.roles}>
                {['admin', 'writer'].map(role => (
                  <label
                    key={role}
                    className={`${styles.roleLabel} ${
                      updateLoading === user.id ? styles.updating : ''
                    }`}>
                    <input
                      type="checkbox"
                      checked={user.roles.includes(role as UserRole)}
                      onChange={() => toggleRole(user.id, role as UserRole, user.roles)}
                      disabled={
                        user.id === currentUser.id || // Can't modify own roles
                        updateLoading === user.id // Disabled while updating
                      }
                    />
                    {role}
                    {updateLoading === user.id && <span className={styles.spinner}>●</span>}
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;
