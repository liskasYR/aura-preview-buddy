-- Allow reading profiles of users who have posts (for displaying author info)
CREATE POLICY "Anyone can view profiles of post authors"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.discover_posts 
    WHERE discover_posts.author_id = profiles.id 
    AND discover_posts.published = true
  )
);