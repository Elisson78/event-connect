import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jthzmlxisefyvzlnudsi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0aHptbHhpc2VmeXZ6bG51ZHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyODU1MzQsImV4cCI6MjA2NTg2MTUzNH0.EX5sziSNoKU9KucDWhe4Si0rlJObY778g18-cez8XM8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);