import { createClient } from "./client";

export async function getArticleWithAuthor(articleId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('articles')
    .select(`
      *,
      author:user_id (
        id,
        email,
        user_metadata
      )
    `)
    .eq('id', articleId)
    .single();

  if (error) throw error;
  return data;
}

export async function getArticlesWithAuthors() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('articles')
    .select(`
      *,
      author:user_id (
        id,
        email,
        user_metadata
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
} 