CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: discover_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discover_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    image_url text,
    author_id uuid NOT NULL,
    published boolean DEFAULT true NOT NULL,
    scheduled_for timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.discover_posts REPLICA IDENTITY FULL;


--
-- Name: generated_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.generated_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    prompt text NOT NULL,
    image_url text NOT NULL,
    image_data text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    image_urls text[],
    CONSTRAINT messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);


--
-- Name: personalities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personalities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tone text DEFAULT 'friendly'::text NOT NULL,
    personality_type text DEFAULT 'assistant'::text NOT NULL,
    custom_instructions text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: discover_posts discover_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discover_posts
    ADD CONSTRAINT discover_posts_pkey PRIMARY KEY (id);


--
-- Name: generated_images generated_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_images
    ADD CONSTRAINT generated_images_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: personalities personalities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personalities
    ADD CONSTRAINT personalities_pkey PRIMARY KEY (id);


--
-- Name: personalities personalities_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personalities
    ADD CONSTRAINT personalities_user_id_key UNIQUE (user_id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_generated_images_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_generated_images_created_at ON public.generated_images USING btree (created_at DESC);


--
-- Name: idx_generated_images_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_generated_images_user_id ON public.generated_images USING btree (user_id);


--
-- Name: conversations update_conversations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: discover_posts update_discover_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_discover_posts_updated_at BEFORE UPDATE ON public.discover_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: personalities update_personalities_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_personalities_updated_at BEFORE UPDATE ON public.personalities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: conversations conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: generated_images generated_images_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_images
    ADD CONSTRAINT generated_images_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles Admins can delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: conversations Admins can view all conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all conversations" ON public.conversations FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: generated_images Admins can view all generated_images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all generated_images" ON public.generated_images FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: messages Admins can view all messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all messages" ON public.messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: discover_posts Anyone can view published posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view published posts" ON public.discover_posts FOR SELECT USING ((published = true));


--
-- Name: discover_posts Authenticated users can create posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create posts" ON public.discover_posts FOR INSERT TO authenticated WITH CHECK ((auth.uid() = author_id));


--
-- Name: profiles Block anonymous access to profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Block anonymous access to profiles" ON public.profiles FOR SELECT TO anon USING (false);


--
-- Name: messages Users can create messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create messages in their conversations" ON public.messages FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = messages.conversation_id) AND (conversations.user_id = auth.uid())))));


--
-- Name: conversations Users can create their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own conversations" ON public.conversations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: personalities Users can create their own personality; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own personality" ON public.personalities FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: messages Users can delete messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete messages in their conversations" ON public.messages FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = messages.conversation_id) AND (conversations.user_id = auth.uid())))));


--
-- Name: discover_posts Users can delete own posts or admins can delete any; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own posts or admins can delete any" ON public.discover_posts FOR DELETE USING (((auth.uid() = author_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: conversations Users can delete their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own conversations" ON public.conversations FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: generated_images Users can delete their own images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own images" ON public.generated_images FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: personalities Users can delete their own personality; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own personality" ON public.personalities FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can delete their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE USING ((auth.uid() = id));


--
-- Name: generated_images Users can insert their own images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own images" ON public.generated_images FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: messages Users can update messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update messages in their conversations" ON public.messages FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = messages.conversation_id) AND (conversations.user_id = auth.uid())))));


--
-- Name: discover_posts Users can update own posts or admins can update any; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own posts or admins can update any" ON public.discover_posts FOR UPDATE USING (((auth.uid() = author_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: conversations Users can update their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own conversations" ON public.conversations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: personalities Users can update their own personality; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own personality" ON public.personalities FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: messages Users can view messages from their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages from their conversations" ON public.messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = messages.conversation_id) AND (conversations.user_id = auth.uid())))));


--
-- Name: conversations Users can view their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own conversations" ON public.conversations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: generated_images Users can view their own images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own images" ON public.generated_images FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: personalities Users can view their own personality; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own personality" ON public.personalities FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));


--
-- Name: conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: discover_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.discover_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: generated_images; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: personalities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.personalities ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


