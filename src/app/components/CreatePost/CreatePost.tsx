'use client';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import RichTextEditor from '../RichTextEditor/RichTextEditor';
import styles from './CreatePost.module.css';

interface CreatePostProps {
  onClose: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { error: submitError } = await supabase.from('posts').insert([
        {
          title,
          content,
          author_id: (await supabase.auth.getUser()).data.user?.id,
        },
      ]);

      if (submitError) throw submitError;
      onClose();
    } catch (err) {
      setError('Failed to create post. Please try again.');
      console.error('Error creating post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Post Title"
          className={styles.titleInput}
          required
        />

        <RichTextEditor content={content} onChange={setContent} />

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.buttons}>
          <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
            {isSubmitting ? 'Creating...' : 'Create Post'}
          </button>
          <button type="button" onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
