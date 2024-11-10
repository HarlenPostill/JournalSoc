'use client';

import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import styles from './MainContent.module.css';
import { Profile } from '@/app/types/database';
import LoginButton from '../LoginButton/LoginButton';
import UserManagement from '../UserManagement/UserManagement';
import UserProfile from '../UserProfile/UserProfile';

const MainContent = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (!error && data) {
      setProfile(data);
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>JournalSoc</h1>
      {user ? (
        <div className={styles.content}>
          <UserProfile user={user} />
          {profile?.roles.includes('admin') && <UserManagement currentUser={user} />}
        </div>
      ) : (
        <LoginButton />
      )}
    </div>
  );
};

export default MainContent;
