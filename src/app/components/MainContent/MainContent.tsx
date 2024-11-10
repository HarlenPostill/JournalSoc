'use client';
import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import styles from './MainContent.module.css';
import { Profile, Post } from '@/app/types/database';
import LoginButton from '../LoginButton/LoginButton';
import UserManagement from '../UserManagement/UserManagement';
import UserProfile from '../UserProfile/UserProfile';
import CreatePost from '../CreatePost/CreatePost';

const MainContent = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [authors, setAuthors] = useState<Record<string, string>>({});

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!error && data) {
      setProfile(data);
    }
  };

  const fetchPosts = async () => {
    // First fetch all posts
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('is_reviewed', true)
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return;
    }

    if (postsData) {
      setPosts(postsData);

      // Get unique author IDs
      const authorIds = [...new Set(postsData.map(post => post.author_id))];

      // Fetch author profiles
      const { data: authorsData, error: authorsError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', authorIds);

      if (!authorsError && authorsData) {
        // Create a map of author IDs to emails
        const authorMap = authorsData.reduce(
          (acc, author) => ({
            ...acc,
            [author.id]: author.email,
          }),
          {} as Record<string, string>
        );

        setAuthors(authorMap);
      }
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
        await fetchPosts();
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
      await fetchPosts();
    });

    return () => subscription.unsubscribe();
  }, []);

  const canWrite = profile?.roles.includes('writer') || profile?.roles.includes('admin');

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
          {canWrite && (
            <button onClick={() => setShowCreatePost(true)} className={styles.writeButton}>
              Write Post
            </button>
          )}
        </div>
      ) : (
        <LoginButton />
      )}

      {showCreatePost && (
        <div className={styles.modal}>
          <CreatePost
            onClose={() => {
              setShowCreatePost(false);
              fetchPosts(); // Refresh posts after creating a new one
            }}
          />
        </div>
      )}

      <div className={styles.posts}>
        {posts.map(post => (
          <article key={post.id} className={styles.post}>
            <h2>{post.title}</h2>
            <p>By: {authors[post.author_id] || 'Unknown Author'}</p>
            <div
              dangerouslySetInnerHTML={{ __html: post.content }}
              className={styles.postContent}
            />
          </article>
        ))}
      </div>
    </div>
  );
};

export default MainContent;
