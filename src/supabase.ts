import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || 'https://zuhmwnnfqlbqsjovwype.supabase.co',
  process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1aG13bm5mcWxicXNqb3Z3eXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NzcyODIsImV4cCI6MjA4ODE1MzI4Mn0.AHpP3W15HaIrno_bpGE4O2m4kpkeDu1zuKCt6NeUy0o'
);

export default supabase;
