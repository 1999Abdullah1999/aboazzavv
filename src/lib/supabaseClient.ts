import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pfwefqmpbaoguvhwvkpv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmd2VmcW1wYmFvZ3V2aHd2a3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzYwOTcsImV4cCI6MjA4OTg1MjA5N30.3lT4ydKrbZkjNpjM45BOUpMxuS-AH1sB4sFOTB8vV5A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
