drop table if exists public.deck_tag cascade;
drop table if exists public.card cascade;
drop table if exists public.study_session cascade;
drop table if exists public.deck cascade;

-- ============================================================
-- 1) ตาราง
-- ============================================================

-- Deck (ชุดการ์ดคำถาม)
create table if not exists public.deck (
  deck_id      text primary key,
  deck_name    text not null,
  created_date date not null default current_date,
  user_id      uuid references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Deck Tag (แท็กของชุดการ์ด — ความสัมพันธ์แบบ M:N ไว้สำรอง)
create table if not exists public.deck_tag (
  deck_id  text not null references public.deck (deck_id) on delete cascade,
  tag_name text not null,
  user_id  uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (deck_id, tag_name)
);

-- Card (การ์ดคำถาม-เฉลย, คีย์รวม = deck_id + card_no)
create table if not exists public.card (
  deck_id       text not null references public.deck (deck_id) on delete cascade,
  card_no       int  not null,
  question_text text not null,
  answer_text   text not null,
  user_id       uuid references auth.users (id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  primary key (deck_id, card_no)
);

-- Study Session (ประวัติการทบทวนของแต่ละชุดการ์ด)
-- remaining_cards  = ยังจำไม่ได้ (red), cards_to_review = จำได้ (green)
create table if not exists public.study_session (
  session_id     text primary key,
  deck_id        text not null references public.deck (deck_id) on delete cascade,
  user_id        uuid references auth.users (id) on delete cascade,
  session_date   timestamptz not null default now(),
  total_cards    int not null default 0,
  remaining_cards int not null default 0,
  cards_to_review int not null default 0,
  created_at     timestamptz not null default now()
);

-- อัปเดต updated_at อัตโนมัติ เมื่อมีการแก้ไข
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Trigger 
drop trigger if exists trg_deck_updated on public.deck;
create trigger trg_deck_updated
  before update on public.deck
  for each row execute function public.set_updated_at();

drop trigger if exists trg_card_updated on public.card;
create trigger trg_card_updated
  before update on public.card
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3) Index (เพิ่มความเร็วการค้นหา)
-- ============================================================
create index if not exists idx_deck_tag_deck      on public.deck_tag (deck_id);
create index if not exists idx_card_deck          on public.card (deck_id);
create index if not exists idx_study_session_deck on public.study_session (deck_id);
create index if not exists idx_study_session_user on public.study_session (user_id);

-- ============================================================
-- 4) Row Level Security (RLS) — แบบ Owner-scoped
-- ------------------------------------------------------------
-- หลักการ:
--   * READ  : เห็นข้อมูลของตัวเอง (user_id = auth.uid())
--             + ข้อมูลส่วนกลาง/ตัวอย่าง (user_id IS NULL) แบบอ่านได้
--   * WRITE : เพิ่ม/แก้/ลบ ได้เฉพาะแถวที่เป็นของตัวเองเท่านั้น
--   * เด็คส่วนกลาง (user_id = NULL) จึงแก้ไม่ได้ ต้อง "คัดลอกเป็นของฉัน"
--     ผ่านฟังก์ชัน func_duplicate_deck() ก่อน
-- ============================================================
alter table public.deck          enable row level security;
alter table public.deck_tag      enable row level security;
alter table public.card           enable row level security;
alter table public.study_session  enable row level security;

-- ลบ policy แบบเดิม (ที่เคยเปิดให้ทุกคนทำได้ทั้งหมด)
drop policy if exists deck_all            on public.deck;
drop policy if exists deck_tag_all        on public.deck_tag;
drop policy if exists card_all            on public.card;
drop policy if exists study_session_all   on public.study_session;

-- ลบ policy แบบใหม่ (เผื่อรันซ้ำ)
drop policy if exists deck_select         on public.deck;
drop policy if exists deck_write          on public.deck;
drop policy if exists deck_tag_select     on public.deck_tag;
drop policy if exists deck_tag_write      on public.deck_tag;
drop policy if exists card_select         on public.card;
drop policy if exists card_write          on public.card;
drop policy if exists study_session_select on public.study_session;
drop policy if exists study_session_write  on public.study_session;

-- deck
create policy deck_select
  on public.deck for select to authenticated
  using (user_id = auth.uid() or user_id is null);
create policy deck_write
  on public.deck for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- deck_tag
create policy deck_tag_select
  on public.deck_tag for select to authenticated
  using (user_id = auth.uid() or user_id is null);
create policy deck_tag_write
  on public.deck_tag for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- card
create policy card_select
  on public.card for select to authenticated
  using (user_id = auth.uid() or user_id is null);
create policy card_write
  on public.card for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- study_session
create policy study_session_select
  on public.study_session for select to authenticated
  using (user_id = auth.uid() or user_id is null);
create policy study_session_write
  on public.study_session for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- สิทธิ์ระดับตาราง: anon ถูกจำกัดด้วย RLS (อ่านได้เฉพาะที่ policy อนุญาต)
-- ส่วน authenticated จัดการข้อมูลได้ แต่ถูก RLS จำกัดให้แตะเฉพาะแถวของตัวเอง
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon;
grant all on all tables in schema public to authenticated;

-- ============================================================
-- 5) ข้อมูลตัวอย่าง (ตรงกับ mock เดิม: 4 เด็ค / 12 การ์ด / 3 เซสชัน)
-- ------------------------------------------------------------
-- หมายเหตุ: user_id เป็น NULL (ข้อมูลสาธิต) และ RLS แบบ owner-scoped
-- อนุญาตให้ authenticated ทุกคน "อ่านได้" (แต่แก้ไขไม่ได้)
-- ============================================================

-- ----- Deck -----
insert into public.deck (deck_id, deck_name, created_date) values
  ('D001', 'ประวัติศาสตร์สากล: ยุคสงครามเย็น',   '2026-08-20'),
  ('D002', 'ชีววิทยาระดับเซลล์ (Cellular Biology)', '2026-08-22'),
  ('D003', 'ไวยากรณ์และโครงสร้างภาษาอังกฤษขั้นสูง', '2026-08-24'),
  ('D004', 'ประวัติศาสตร์และวรรณกรรมสากล',        '2026-08-25')
on conflict (deck_id) do nothing;

-- ----- Deck Tag -----
insert into public.deck_tag (deck_id, tag_name) values
  ('D001', 'History'), ('D001', 'Cold War'),
  ('D002', 'Science'), ('D002', 'Biology'),
  ('D003', 'English'), ('D003', 'Grammar'),
  ('D004', 'History'), ('D004', 'Literature')
on conflict (deck_id, tag_name) do nothing;

-- ----- Card -----
insert into public.card (deck_id, card_no, question_text, answer_text) values
  ('D001', 1,
    'นโยบายเปเรสตรอยกา (Perestroika) และกลัสนอสต์ (Glasnost) ของมีฮาอิล กอร์บาชอฟ มีจุดประสงค์หลักเพื่ออะไร?',
    'เปเรสตรอยกา (Perestroika) คือการปรับโครงสร้างเศรษฐกิจให้มีความเป็นทุนนิยมมากขึ้น ส่วนกลัสนอสต์ (Glasnost) คือการเปิดกว้างทางการเมืองและเสรีภาพในการแสดงความคิดเห็น เพื่อปฏิรูปและแก้ปัญหาความชะงักงันของสหภาพโซเวียต'),
  ('D001', 2,
    'ทฤษฎีโดมิโน (Domino Theory) มีอิทธิพลต่อนโยบายต่างประเทศของสหรัฐอเมริกาในช่วงสงครามเย็นอย่างไร?',
    'ทำให้สหรัฐฯ เชื่อว่าหากประเทศหนึ่งตกอยู่ภายใต้การปกครองระบอบคอมมิวนิสต์ ประเทศเพื่อนบ้านก็จะล้มตามไปด้วย นำไปสู่การเข้าแทรกแซงทางทหารในหลายภูมิภาค เช่น สงครามเวียดนาม'),
  ('D001', 3,
    'วิกฤตการณ์ขีปนาวุธคิวบา (Cuban Missile Crisis) ปี 1962 ส่งผลกระทบเชิงบวกต่อความสัมพันธ์ระหว่างมหาอำนาจอย่างไร?',
    'แม้จะเป็นจุดที่โลกเข้าใกล้สงครามนิวเคลียร์มากที่สุด แต่ผลลัพธ์ทำให้เกิดการจัดตั้ง ''สายด่วน'' (Hotline) ระหว่างทำเนียบขาวและทำเนียบเครมลิน เพื่อให้ผู้นำทั้งสองฝ่ายสื่อสารกันได้โดยตรงและป้องกันความเข้าใจผิดในอนาคต'),

  ('D002', 1,
    'หลักการ Central Dogma of Molecular Biology อธิบายการถ่ายทอดข้อมูลทางพันธุกรรมไว้อย่างไร?',
    'อธิบายทิศทางการถ่ายทอดข้อมูลจาก DNA ถูกคัดลอกเป็น RNA (Transcription) และ RNA ถูกแปลรหัสกลายเป็นโปรตีน (Translation) เพื่อกำหนดลักษณะทางพันธุกรรม'),
  ('D002', 2,
    'ในกระบวนการหายใจระดับเซลล์ (Cellular Respiration) วัฏจักรเครบส์ (Krebs cycle) เกิดขึ้นที่บริเวณใดของเซลล์?',
    'เกิดขึ้นที่เมทริกซ์ (Matrix) ซึ่งเป็นของเหลวที่อยู่ภายในออร์แกเนลล์ไมโทคอนเดรีย (Mitochondria)'),
  ('D002', 3,
    'ความแตกต่างหลักระหว่างกระบวนการ Mitosis และ Meiosis คืออะไร?',
    'Mitosis เป็นการแบ่งเซลล์ร่างกายเพื่อให้ได้เซลล์ใหม่ 2 เซลล์ที่มีโครโมโซมเท่าเดิม (2n) ส่วน Meiosis เป็นการแบ่งเซลล์สืบพันธุ์เพื่อให้ได้เซลล์ใหม่ 4 เซลล์ที่มีโครโมโซมลดลงครึ่งหนึ่ง (n)'),
  ('D002', 4,
    'กระบวนการ Apoptosis ในทางชีววิทยาระดับเซลล์คืออะไร และมีความสำคัญอย่างไรต่อสิ่งมีชีวิต?',
    'คือกระบวนการ ''การตายของเซลล์ที่ถูกโปรแกรมไว้'' (Programmed Cell Death) เป็นกลไกธรรมชาติที่เซลล์ทำลายตัวเองอย่างเป็นระเบียบ เพื่อกำจัดเซลล์ที่หมดอายุ เสียหาย หรือเซลล์ที่อาจกลายพันธุ์เป็นมะเร็ง ถือเป็นการรักษาสมดุลของเนื้อเยื่อ'),

  ('D003', 1,
    'โครงสร้างประโยคเงื่อนไขแบบ Third Conditional ใช้ในสถานการณ์ใด พร้อมยกตัวอย่างโครงสร้าง?',
    'ใช้สมมติเหตุการณ์ในอดีตที่ตรงข้ามกับความเป็นจริง (สิ่งที่แก้ไขไม่ได้แล้ว) โครงสร้างคือ: If + Past Perfect, Subject + would have + V.3 (เช่น If I had studied harder, I would have passed the exam.)'),
  ('D003', 2,
    'จงอธิบายความแตกต่างระหว่าง Gerund และ Present Participle แม้ว่าทั้งคู่จะอยู่ในรูป V.ing?',
    'Gerund ทำหน้าที่เป็น ''คำนาม'' ในประโยค (เช่น Swimming is good.) ส่วน Present Participle ทำหน้าที่เป็น ''คำคุณศัพท์'' ขยายคำนาม หรือใช้ประกอบใน Continuous Tense (เช่น The crying baby needs milk.)'),
  ('D003', 3,
    'การใช้ Inversion (การสลับที่ประธานกับกริยา) มักใช้ในงานเขียนเพื่อเน้นความรู้สึกให้ดูทรงพลัง จงยกตัวอย่างโครงสร้างเมื่อขึ้นต้นประโยคด้วย ''Scarcely''',
    'โครงสร้างคือ: Scarcely + had + Subject + V.3 + when + Past Simple' || E'\n' ||
    'ตัวอย่าง: ''Scarcely had the blue lightning struck the blade when the warrior launched his fierce counterattack.'''),

  ('D004', 1,
    'ในประวัติศาสตร์ญี่ปุ่นช่วงปลายยุคเอโดะ นากาคุระ ชินปาจิ (Nagakura Shinpachi) มีความสำคัญอย่างไร และเขาเป็นผู้เชี่ยวชาญวิชาดาบสายใด?',
    'เขาเป็นหัวหน้าหน่วยที่ 2 ของกองกำลังชินเซ็นงุมิ (Shinsengumi) และได้รับการยกย่องว่าเป็นหนึ่งในนักดาบที่เก่งกาจที่สุดของกลุ่ม โดยเป็นผู้สืบทอดและเชี่ยวชาญวิชาดาบสายชินโตมุเน็นริว (Shintō Munen-ryū)'),
  ('D004', 2,
    'ในตำนานรอบินสเตอร์ (Ulster Cycle) ของชาวเคลต์ (Celtic Mythology) วีรบุรุษคูชูเลนน์ (Cú Chulainn) มีอาวุธคู่กายที่โดดเด่นคืออะไร?',
    'อาวุธคู่กายคือหอก ''เก-บอล์ก'' (Gáe Bulg) เป็นหอกแห่งความตายที่เมื่อแทงเข้าสู่ร่างกายศัตรู ปลายหอกจะแตกแขนงออกเป็นหนามแหลมทำลายอวัยวะภายในจนสร้างความเสียหายอย่างรุนแรงและยากที่จะดึงออกได้')
on conflict (deck_id, card_no) do nothing;

-- ----- Study Session (ตัวอย่าง) -----
insert into public.study_session
  (session_id, deck_id, session_date, total_cards, remaining_cards, cards_to_review) values
  ('S1001', 'D001', '2026-08-21T14:30:00+07', 3, 1, 0),
  ('S1002', 'D002', '2026-08-23T09:15:00+07', 4, 2, 1),
  ('S1003', 'D003', '2026-08-24T20:00:00+07', 3, 3, 0)
on conflict (session_id) do nothing;

-- ============================================================
-- 6) Stored Procedure: ล้างข้อมูลเฉพาะบัญชีของตัวเอง (ผู้ใช้)
-- ------------------------------------------------------------
-- เรียกใช้:      call public.proc_reset_my_data();
-- ภาษาที่ใช้:    plpgsql
-- หลักการ:       ทำงานใน Transaction เดียว ลบ study_session / deck_tag /
--                card / deck เฉพาะแถวที่ user_id = ผู้ที่ login (auth.uid())
-- หมายเหตุ:      ข้อมูลตัวอย่าง (user_id = NULL) จะไม่ถูกลบ
-- ============================================================
create or replace procedure public.proc_reset_my_data()
language plpgsql
security invoker
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'กรุณาเข้าสู่ระบบก่อน (auth.uid() เป็นค่าว่าง)';
  end if;

  delete from public.study_session where user_id = v_uid;
  delete from public.card           where user_id = v_uid;
  delete from public.deck_tag       where user_id = v_uid;
  delete from public.deck           where user_id = v_uid;
end;
$$;

-- ตัวอย่างการทดสอบ (รันใน SQL Editor):
-- call public.proc_reset_my_data();
-- select count(*) as remaining_decks from public.deck where user_id = auth.uid();

-- ============================================================
-- 7) Stored Function: คัดลอกเด็คเป็นของตัวเอง (คัดลอก-deck)
-- ------------------------------------------------------------
-- เรียกใช้จากแอป:  supabase.rpc('func_duplicate_deck', {
--                    p_source_deck_id: '<deck_id>', p_new_name: null })
-- ภาษาที่ใช้:     plpgsql
-- หลักการ:        อ่านเด็คต้นฉบับ + การ์ด + แท็ก แล้วสร้างเป็นเด็คใหม่
--                 ที่มี user_id = ผู้ที่ login (auth.uid()) เสมอ
--                 ทำงานใน Transaction เดียว (atomic) — ถ้าพลาดกลางทาง
--                 จะ rollback ทั้งชุด ไม่เกิดเด็คใหม่ครึ่ง ๆ กลาง ๆ
-- หมายเหตุ:       เด็คส่วนกลาง (user_id = NULL) ถูกคัดลอกได้ และ
--                 ได้สำเนาที่แก้ไขได้เฉพาะเจ้าของ
-- ============================================================
create or replace function public.func_duplicate_deck(
  p_source_deck_id text,
  p_new_name       text default null
)
returns text
language plpgsql
security invoker
as $$
declare
  v_uid    uuid := auth.uid();
  v_src    public.deck%rowtype;
  v_new_id text;
begin
  if v_uid is null then
    raise exception 'กรุณาเข้าสู่ระบบก่อน (auth.uid() เป็นค่าว่าง)';
  end if;

  select * into v_src
  from public.deck
  where deck_id = p_source_deck_id;

  if not found then
    raise exception 'ไม่พบ deck ต้นฉบับ หรือไม่มีสิทธิ์เข้าถึง (deck_id=%)', p_source_deck_id;
  end if;

  -- สร้างรหัสเด็คใหม่ให้ไม่ซ้ำ
  v_new_id := 'D' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
  while exists (select 1 from public.deck where deck_id = v_new_id) loop
    v_new_id := 'D' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
  end loop;

  insert into public.deck (deck_id, deck_name, created_date, user_id)
  values (
    v_new_id,
    coalesce(nullif(p_new_name, ''), v_src.deck_name || ' (สำเนา)'),
    current_date,
    v_uid
  );

  insert into public.card (deck_id, card_no, question_text, answer_text, user_id)
  select v_new_id, card_no, question_text, answer_text, v_uid
  from public.card
  where deck_id = p_source_deck_id;

  insert into public.deck_tag (deck_id, tag_name, user_id)
  select v_new_id, tag_name, v_uid
  from public.deck_tag
  where deck_id = p_source_deck_id;

  return v_new_id;
end;
$$;

grant execute on function public.func_duplicate_deck(text, text) to authenticated;

-- ตัวอย่างการทดสอบในแอป:
--   const { data } = await supabase.rpc('func_duplicate_deck',
--     { p_source_deck_id: 'D001', p_new_name: null });
--   // data = deck_id ของสำเนาใหม่