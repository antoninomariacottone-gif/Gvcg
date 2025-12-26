import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dpecpwirvmztlmcoccxm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwZWNwd2lydm16dGxtY29jY3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNTQxMjUsImV4cCI6MjA4MTgzMDEyNX0.ViJmKxs-GPA_J0n-dzZpktOVli-eBa8jkP88DiaNhv0'

export const supabase = createClient(supabaseUrl, supabaseKey)
