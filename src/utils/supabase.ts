import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lilbmxqbsahrnjhegqew.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpbGJteHFic2Focm5qaGVncWV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ2NDg4ODAsImV4cCI6MjExMDIyNDg4MH0.ThKnPsBG-p-D5i-81Vs7ebiIiR6nHTWN3vU1KQYNW24';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

