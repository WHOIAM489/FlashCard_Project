const MockStorage = (() => {
  const STORAGE_KEY = "braindeck_mock";

  function _generateId(prefix) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = prefix;
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  function _getData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
      return _initMockData();
    } catch {
      return _initMockData();
    }
  }

  function _saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function _initMockData() {
    const data = {
      decks: [
        {
          deck_id: "D001",
          deck_name: "ประวัติศาสตร์สากล: ยุคสงครามเย็น",
          created_date: "2026-08-20",
          tags: ["History", "Cold War"],
          cards: [
            {
              card_no: 1,
              question_text: "นโยบายเปเรสตรอยกา (Perestroika) และกลัสนอสต์ (Glasnost) ของมีฮาอิล กอร์บาชอฟ มีจุดประสงค์หลักเพื่ออะไร?",
              answer_text: "เปเรสตรอยกา (Perestroika) คือการปรับโครงสร้างเศรษฐกิจให้มีความเป็นทุนนิยมมากขึ้น ส่วนกลัสนอสต์ (Glasnost) คือการเปิดกว้างทางการเมืองและเสรีภาพในการแสดงความคิดเห็น เพื่อปฏิรูปและแก้ปัญหาความชะงักงันของสหภาพโซเวียต"
            },
            {
              card_no: 2,
              question_text: "ทฤษฎีโดมิโน (Domino Theory) มีอิทธิพลต่อนโยบายต่างประเทศของสหรัฐอเมริกาในช่วงสงครามเย็นอย่างไร?",
              answer_text: "ทำให้สหรัฐฯ เชื่อว่าหากประเทศหนึ่งตกอยู่ภายใต้การปกครองระบอบคอมมิวนิสต์ ประเทศเพื่อนบ้านก็จะล้มตามไปด้วย นำไปสู่การเข้าแทรกแซงทางทหารในหลายภูมิภาค เช่น สงครามเวียดนาม"
            },
            {
              card_no: 3,
              question_text: "วิกฤตการณ์ขีปนาวุธคิวบา (Cuban Missile Crisis) ปี 1962 ส่งผลกระทบเชิงบวกต่อความสัมพันธ์ระหว่างมหาอำนาจอย่างไร?",
              answer_text: "แม้จะเป็นจุดที่โลกเข้าใกล้สงครามนิวเคลียร์มากที่สุด แต่ผลลัพธ์ทำให้เกิดการจัดตั้ง 'สายด่วน' (Hotline) ระหว่างทำเนียบขาวและทำเนียบเครมลิน เพื่อให้ผู้นำทั้งสองฝ่ายสื่อสารกันได้โดยตรงและป้องกันความเข้าใจผิดในอนาคต"
            }
          ]
        },
        {
          deck_id: "D002",
          deck_name: "ชีววิทยาระดับเซลล์ (Cellular Biology)",
          created_date: "2026-08-22",
          tags: ["Science", "Biology"],
          cards: [
            {
              card_no: 1,
              question_text: "หลักการ Central Dogma of Molecular Biology อธิบายการถ่ายทอดข้อมูลทางพันธุกรรมไว้อย่างไร?",
              answer_text: "อธิบายทิศทางการถ่ายทอดข้อมูลจาก DNA ถูกคัดลอกเป็น RNA (Transcription) และ RNA ถูกแปลรหัสกลายเป็นโปรตีน (Translation) เพื่อกำหนดลักษณะทางพันธุกรรม"
            },
            {
              card_no: 2,
              question_text: "ในกระบวนการหายใจระดับเซลล์ (Cellular Respiration) วัฏจักรเครบส์ (Krebs cycle) เกิดขึ้นที่บริเวณใดของเซลล์?",
              answer_text: "เกิดขึ้นที่เมทริกซ์ (Matrix) ซึ่งเป็นของเหลวที่อยู่ภายในออร์แกเนลล์ไมโทคอนเดรีย (Mitochondria)"
            },
            {
              card_no: 3,
              question_text: "ความแตกต่างหลักระหว่างกระบวนการ Mitosis และ Meiosis คืออะไร?",
              answer_text: "Mitosis เป็นการแบ่งเซลล์ร่างกายเพื่อให้ได้เซลล์ใหม่ 2 เซลล์ที่มีโครโมโซมเท่าเดิม (2n) ส่วน Meiosis เป็นการแบ่งเซลล์สืบพันธุ์เพื่อให้ได้เซลล์ใหม่ 4 เซลล์ที่มีโครโมโซมลดลงครึ่งหนึ่ง (n)"
            },
            {
              card_no: 4,
              question_text: "กระบวนการ Apoptosis ในทางชีววิทยาระดับเซลล์คืออะไร และมีความสำคัญอย่างไรต่อสิ่งมีชีวิต?",
              answer_text: "คือกระบวนการ 'การตายของเซลล์ที่ถูกโปรแกรมไว้' (Programmed Cell Death) เป็นกลไกธรรมชาติที่เซลล์ทำลายตัวเองอย่างเป็นระเบียบ เพื่อกำจัดเซลล์ที่หมดอายุ เสียหาย หรือเซลล์ที่อาจกลายพันธุ์เป็นมะเร็ง ถือเป็นการรักษาสมดุลของเนื้อเยื่อ"
            }
          ]
        },
        {
          deck_id: "D003",
          deck_name: "ไวยากรณ์และโครงสร้างภาษาอังกฤษขั้นสูง",
          created_date: "2026-08-24",
          tags: ["English", "Grammar"],
          cards: [
            {
              card_no: 1,
              question_text: "โครงสร้างประโยคเงื่อนไขแบบ Third Conditional ใช้ในสถานการณ์ใด พร้อมยกตัวอย่างโครงสร้าง?",
              answer_text: "ใช้สมมติเหตุการณ์ในอดีตที่ตรงข้ามกับความเป็นจริง (สิ่งที่แก้ไขไม่ได้แล้ว) โครงสร้างคือ: If + Past Perfect, Subject + would have + V.3 (เช่น If I had studied harder, I would have passed the exam.)"
            },
            {
              card_no: 2,
              question_text: "จงอธิบายความแตกต่างระหว่าง Gerund และ Present Participle แม้ว่าทั้งคู่จะอยู่ในรูป V.ing?",
              answer_text: "Gerund ทำหน้าที่เป็น 'คำนาม' ในประโยค (เช่น Swimming is good.) ส่วน Present Participle ทำหน้าที่เป็น 'คำคุณศัพท์' ขยายคำนาม หรือใช้ประกอบใน Continuous Tense (เช่น The crying baby needs milk.)"
            },
            {
              card_no: 3,
              question_text: "การใช้ Inversion (การสลับที่ประธานกับกริยา) มักใช้ในงานเขียนเพื่อเน้นความรู้สึกให้ดูทรงพลัง จงยกตัวอย่างโครงสร้างเมื่อขึ้นต้นประโยคด้วย 'Scarcely'",
              answer_text: "โครงสร้างคือ: Scarcely + had + Subject + V.3 + when + Past Simple\nตัวอย่าง: 'Scarcely had the blue lightning struck the blade when the warrior launched his fierce counterattack.'"
            }
          ]
        },
        {
          deck_id: "D004",
          deck_name: "ประวัติศาสตร์และวรรณกรรมสากล",
          created_date: "2026-08-25",
          tags: ["History", "Literature"],
          cards: [
            {
              card_no: 1,
              question_text: "ในประวัติศาสตร์ญี่ปุ่นช่วงปลายยุคเอโดะ นากาคุระ ชินปาจิ (Nagakura Shinpachi) มีความสำคัญอย่างไร และเขาเป็นผู้เชี่ยวชาญวิชาดาบสายใด?",
              answer_text: "เขาเป็นหัวหน้าหน่วยที่ 2 ของกองกำลังชินเซ็นงุมิ (Shinsengumi) และได้รับการยกย่องว่าเป็นหนึ่งในนักดาบที่เก่งกาจที่สุดของกลุ่ม โดยเป็นผู้สืบทอดและเชี่ยวชาญวิชาดาบสายชินโตมุเน็นริว (Shintō Munen-ryū)"
            },
            {
              card_no: 2,
              question_text: "ในตำนานรอบินสเตอร์ (Ulster Cycle) ของชาวเคลต์ (Celtic Mythology) วีรบุรุษคูชูเลนน์ (Cú Chulainn) มีอาวุธคู่กายที่โดดเด่นคืออะไร?",
              answer_text: "อาวุธคู่กายคือหอก 'เก-บอล์ก' (Gáe Bulg) เป็นหอกแห่งความตายที่เมื่อแทงเข้าสู่ร่างกายศัตรู ปลายหอกจะแตกแขนงออกเป็นหนามแหลมทำลายอวัยวะภายในจนสร้างความเสียหายอย่างรุนแรงและยากที่จะดึงออกได้"
            }
          ]
        }
      ],
      sessions: [
        { session_id: "S1001", deck_id: "D001", session_date: "2026-08-21T14:30:00", total_cards: 3, remaining_cards: 1, cards_to_review: 0 },
        { session_id: "S1002", deck_id: "D002", session_date: "2026-08-23T09:15:00", total_cards: 4, remaining_cards: 2, cards_to_review: 1 },
        { session_id: "S1003", deck_id: "D003", session_date: "2026-08-24T20:00:00", total_cards: 3, remaining_cards: 3, cards_to_review: 0 }
      ]
    };
    _saveData(data);
    return data;
  }

  async function getAllDecks() {
    return _getData().decks;
  }

  async function getDeck(deckId) {
    return _getData().decks.find((d) => d.deck_id === deckId) || null;
  }

  async function getDeckTags(deckId) {
    const deck = _getData().decks.find((d) => d.deck_id === deckId);
    return deck ? deck.tags || [] : [];
  }

  async function createDeck(name, tags = []) {
    const data = _getData();
    const deckId = _generateId("D");
    data.decks.unshift({
      deck_id: deckId,
      deck_name: name,
      created_date: new Date().toISOString().split("T")[0],
      tags: tags,
      cards: [],
    });
    _saveData(data);
    return deckId;
  }

  async function updateDeck(deckId, name) {
    const data = _getData();
    const deck = data.decks.find((d) => d.deck_id === deckId);
    if (deck) { deck.deck_name = name; _saveData(data); }
  }

  async function updateDeckTags(deckId, tags) {
    const data = _getData();
    const deck = data.decks.find((d) => d.deck_id === deckId);
    if (deck) { deck.tags = tags; _saveData(data); }
  }

  async function deleteDeck(deckId) {
    const data = _getData();
    data.decks = data.decks.filter((d) => d.deck_id !== deckId);
    data.sessions = data.sessions.filter((s) => s.deck_id !== deckId);
    _saveData(data);
  }

  async function getCards(deckId) {
    const deck = _getData().decks.find((d) => d.deck_id === deckId);
    if (!deck) return [];
    return deck.cards.map((c) => ({ ...c, deck_id: deckId })).sort((a, b) => a.card_no - b.card_no);
  }

  async function createCard(deckId, question, answer) {
    const data = _getData();
    const deck = data.decks.find((d) => d.deck_id === deckId);
    if (!deck) return;
    const maxNo = deck.cards.length > 0 ? Math.max(...deck.cards.map((c) => c.card_no)) : 0;
    deck.cards.push({ card_no: maxNo + 1, question_text: question, answer_text: answer });
    _saveData(data);
  }

  async function updateCard(deckId, cardNo, question, answer) {
    const data = _getData();
    const deck = data.decks.find((d) => d.deck_id === deckId);
    if (!deck) return;
    const card = deck.cards.find((c) => c.card_no === cardNo);
    if (card) { card.question_text = question; card.answer_text = answer; _saveData(data); }
  }

  async function deleteCard(deckId, cardNo) {
    const data = _getData();
    const deck = data.decks.find((d) => d.deck_id === deckId);
    if (!deck) return;
    deck.cards = deck.cards.filter((c) => c.card_no !== cardNo);
    _saveData(data);
  }

  async function createStudySession(deckId, total, remaining, toReview) {
    const data = _getData();
    const sessionId = _generateId("S");
    data.sessions.unshift({
      session_id: sessionId,
      deck_id: deckId,
      session_date: new Date().toISOString(),
      total_cards: total,
      remaining_cards: remaining,
      cards_to_review: toReview,
    });
    _saveData(data);
    return sessionId;
  }

  async function getStudySessions(deckId) {
    return _getData().sessions.filter((s) => s.deck_id === deckId).sort((a, b) => new Date(b.session_date) - new Date(a.session_date));
  }

  function resetData() {
    localStorage.removeItem(STORAGE_KEY);
  }

  return {
    KEY: STORAGE_KEY,
    _initMockData,
    getAllDecks,
    getDeck,
    getDeckTags,
    createDeck,
    updateDeck,
    updateDeckTags,
    deleteDeck,
    getCards,
    createCard,
    updateCard,
    deleteCard,
    createStudySession,
    getStudySessions,
    resetData,
  };
})();
