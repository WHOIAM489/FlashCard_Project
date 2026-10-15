const SUPABASE_URL = "https://tgapvddgojkeibrxnakr.supabase.co/rest/v1/";
let supabaseBaseUrl;
try {
  supabaseBaseUrl = new URL(SUPABASE_URL).origin;
} catch (e) {
  supabaseBaseUrl = SUPABASE_URL.trim().split("/").slice(0, 3).join("/");
}
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnYXB2ZGRnb2prZWlicnhuYWtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTkzNTIsImV4cCI6MjEwNTA3NTM1Mn0.XFVnLSNE_qIJtMfWEshcmLSGtif7GE2wjrBKjt7R0g8";

if (window.supabase && window.supabase.createClient) {
  window.supabase = window.supabase.createClient(supabaseBaseUrl, SUPABASE_ANON_KEY);
} else {
  console.error("ไม่พบ window.supabase — ตรวจสอบว่าโหลด <script src='@supabase/supabase-js@2'> ก่อนหน้านี้แล้วหรือไม่");
}