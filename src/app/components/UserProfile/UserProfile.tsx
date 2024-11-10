import React from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import styles from './UserProfile.module.css';

type UserProfileProps = {
  user: User;
};

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const router = useRouter();
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User';
  const email = user.email || 'No email provided';

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.refresh();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className={styles.profile}>
      <div className={styles.info}>
        <h2 className={styles.name}>{displayName}</h2>
        <p className={styles.email}>{email}</p>
      </div>
      <button onClick={handleLogout} className={styles.logoutButton}>
        Sign Out
      </button>
    </div>
  );
};

export default UserProfile;
