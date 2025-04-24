import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { usePrompts } from '@/lib/prompts';
import { useRouter } from 'next/router';

const NewPromptPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createPrompt, error, clearError } = usePrompts();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const tagsArray = tags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      const prompt = await createPrompt({
        title,
        content,
        description,
        tags: tagsArray,
        is_public: isPublic
      });
      
      router.push(`/prompts/${prompt.id}`);
    } catch (err) {
      console.error('Error creating prompt:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout requireAuth>
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text-primary">Create New Prompt</h1>
          <p className="text-text-secondary mt-2">
            Create a reusable prompt template for your AI agents.
          </p>
        </div>

        {error && (
          <div className="bg-error/20 border border-error text-text-primary p-4 rounded-md mb-6">
            {error}
            <button 
              onClick={clearError}
              className="float-right text-text-secondary hover:text-text-primary"
            >
              &times;
            </button>
          </div>
        )}

        <div className="bg-surface rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="title" className="block text-text-primary font-medium mb-2">
                Prompt Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-surface bg-background text-text-primary rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="e.g., Creative Story Generator"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="description" className="block text-text-primary font-medium mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-surface bg-background text-text-primary rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Describe what this prompt does..."
              />
            </div>

            <div className="mb-6">
              <label htmlFor="content" className="block text-text-primary font-medium mb-2">
                Prompt Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={8}
                className="w-full px-3 py-2 border border-surface bg-background text-text-primary rounded-md focus:outline-none focus:ring-primary focus:border-primary font-mono"
                placeholder="Write your prompt template here..."
              />
              <p className="mt-2 text-sm text-text-secondary">
                You can use variables like {"{input}"} that will be replaced when the prompt is used.
              </p>
            </div>

            <div className="mb-6">
              <label htmlFor="tags" className="block text-text-primary font-medium mb-2">
                Tags
              </label>
              <input
                id="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 border border-surface bg-background text-text-primary rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="creative, story, fiction (comma separated)"
              />
              <p className="mt-2 text-sm text-text-secondary">
                Add tags to help organize and find your prompts later.
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-center">
                <input
                  id="isPublic"
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-surface rounded bg-background"
                />
                <label htmlFor="isPublic" className="ml-2 block text-text-primary">
                  Make this prompt public
                </label>
              </div>
              <p className="mt-1 text-sm text-text-secondary ml-6">
                Public prompts can be used by other users in their agents.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="mr-4 px-4 py-2 border border-surface text-text-secondary rounded-md hover:bg-surface"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Prompt'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default NewPromptPage;
