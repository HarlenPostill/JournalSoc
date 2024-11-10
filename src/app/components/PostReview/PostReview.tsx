// app/components/PostReview/PostReview.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Post } from '@/app/types/database';
import styles from './PostReview.module.css';

const PostReview = () => {
  const [unreviewedPosts, setUnreviewedPosts] = useState<Post[]>([]);
  const [authors, setAuthors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreviewedPosts = async () => {
    setLoading(true);
    setError(null);

    // Fetch unreviewed posts
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('is_reviewed', false)
      .order('created_at', { ascending: false });

    if (postsError) {
      setError('Failed to fetch unreviewed posts');
      setLoading(false);
      return;
    }

    if (postsData) {
      setUnreviewedPosts(postsData);

      // Get unique author IDs
      const authorIds = [...new Set(postsData.map(post => post.author_id))];

      // Fetch author profiles
      const { data: authorsData, error: authorsError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', authorIds);

      if (!authorsError && authorsData) {
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

    setLoading(false);
  };

  const approvePost = async (postId: string) => {
    try {
      const { error } = await supabase.from('posts').update({ is_reviewed: true }).eq('id', postId);

      if (error) throw error;

      // Remove the approved post from the list
      setUnreviewedPosts(prev => prev.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Error approving post:', err);
      setError('Failed to approve post. Please try again.');
    }
  };

  useEffect(() => {
    fetchUnreviewedPosts();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading unreviewed posts...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (unreviewedPosts.length === 0) {
    return <div className={styles.noContent}>No posts waiting for review</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Posts Waiting for Review</h2>
      <div className={styles.postGrid}>
        {unreviewedPosts.map(post => (
          <article key={post.id} className={styles.postCard}>
            <h3>{post.title}</h3>
            <p className={styles.author}>By: {authors[post.author_id] || 'Unknown Author'}</p>
            <div className={styles.content} dangerouslySetInnerHTML={{ __html: post.content }} />
            <div className={styles.actions}>
              <button onClick={() => approvePost(post.id)} className={styles.approveButton}>
                Approve Post
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default PostReview;
