import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://ajkqtxecaxkuzpavvsoq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqa3F0eGVjYXhrdXpwYXZ2c29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNDAyMTQsImV4cCI6MjA3OTcxNjIxNH0.PBNVmu_KRRmOHMHeYXfO9nglo1SAmMlpawWA_4UbLC8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

