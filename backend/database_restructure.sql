-- ===========================
-- DROP EXISTING TABLES
-- ===========================
drop table if exists chats cascade;
drop table if exists chat_sessions cascade;
drop table if exists documents cascade;
drop table if exists chatbot_visitors cascade;
drop table if exists chatbots cascade;

-- ===========================
-- USERS TABLE (Managed by Supabase Auth)
-- ===========================
-- No need to create manually. Supabase handles this with 'auth.users'

-- ===========================
-- CHATBOTS TABLE
-- ===========================
create table chatbots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null, -- owner
  name text not null,
  description text not null,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- ===========================
-- DOCUMENTS TABLE
-- ===========================
create table documents (
  id uuid primary key default gen_random_uuid(),
  chatbot_id uuid references chatbots(id) on delete cascade not null, -- chatbot linkage
  file_name text not null, -- original filename
  file_type text not null, -- e.g., pdf, txt
  is_processed boolean default false,
  bucket_path text not null,
  created_at timestamp default now()
);

-- ===========================
-- CHAT SESSIONS TABLE (Group chats)
-- ===========================
create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  chatbot_id uuid references chatbots(id) on delete cascade not null,
  created_at timestamp default now(),
  ended_at timestamp, -- nullable, optional
  session_name text, -- optional title for session
  visitor_id uuid -- optional, linked to visitors
);

-- ===========================
-- CHATS TABLE (Chat history)
-- ===========================
create table chats (
  id uuid primary key default gen_random_uuid(),
  chatbot_id uuid references chatbots(id) on delete cascade not null, -- redundancy for faster queries
  session_id uuid references chat_sessions(id) on delete cascade not null, -- groups chat messages
  user_type text check (user_type in ('user', 'bot')) not null, -- 'user' or 'bot'
  message text not null,
  created_at timestamp default now()
);

-- ===========================
-- CHATBOT VISITORS TABLE (Optional, to track public usage)
-- ===========================
create table chatbot_visitors (
  id uuid primary key default gen_random_uuid(),
  chatbot_id uuid references chatbots(id) on delete cascade not null, -- which chatbot visited
  ip_address text, -- optional, store IP for analytics
  user_agent text, -- optional, store browser/device info
  created_at timestamp default now()
);

-- ===========================
-- INDEXES (Important for performance)
-- ===========================
create index idx_chatbots_user_id on chatbots (user_id);
create index idx_documents_chatbot_id on documents (chatbot_id);
create index idx_chat_sessions_chatbot_id on chat_sessions (chatbot_id);
create index idx_chats_session_id on chats (session_id);
create index idx_chatbot_visitors_chatbot_id on chatbot_visitors (chatbot_id);

-- ===========================
-- ENABLE RLS
-- ===========================
alter table chatbots enable row level security;
alter table documents enable row level security;
alter table chat_sessions enable row level security;
alter table chats enable row level security;

-- ===========================
-- POLICIES FOR RLS TABLES
-- ===========================
-- Chatbots: manage only own
create policy "Allow authenticated users to manage own chatbots"
on chatbots
for all
to authenticated
using (user_id = auth.uid());

-- Documents: manage only linked to own chatbots
create policy "Allow authenticated users to manage own documents"
on documents
for all
to authenticated
using (
  chatbot_id in (select id from chatbots where user_id = auth.uid())
);

-- Chat sessions: manage only linked to own chatbots
create policy "Allow authenticated users to manage own chat sessions"
on chat_sessions
for all
to authenticated
using (
  chatbot_id in (select id from chatbots where user_id = auth.uid())
);

-- Chats: manage only linked to own chatbots
create policy "Allow authenticated users to manage own chats"
on chats
for all
to authenticated
using (
  chatbot_id in (select id from chatbots where user_id = auth.uid())
);

-- ===========================
-- GRANT USAGE + PRIVILEGES TO AUTHENTICATED
-- ===========================
grant usage on schema public to authenticated;

grant select, insert, update, delete on chatbots to authenticated;
grant select, insert, update, delete on documents to authenticated;
grant select, insert, update, delete on chat_sessions to authenticated;
grant select, insert, update, delete on chats to authenticated;

-- =================== POLICIES ===================

-- CHATBOTS
create policy "Allow service role to read chatbots"
on chatbots
for select
to service_role
using (true);

-- DOCUMENTS
create policy "Allow service role to read documents"
on documents
for select
to service_role
using (true);

-- CHAT_SESSIONS
create policy "Allow service role to read chat_sessions"
on chat_sessions
for select
to service_role
using (true);

-- CHATS
create policy "Allow service role to read chats"
on chats
for select
to service_role
using (true);


-- =================== GRANTS ===================

grant select on chatbots to service_role;
grant select on documents to service_role;
grant select on chat_sessions to service_role;
grant select on chats to service_role;

-- ===========================
-- OPTIONAL: PUBLIC ACCESS FOR EMBEDDED CHATBOT VISITORS (NO RLS)
-- ===========================
-- Disable RLS for chatbot_visitors if public (optional)
alter table chatbot_visitors disable row level security;

SELECT current_role;
