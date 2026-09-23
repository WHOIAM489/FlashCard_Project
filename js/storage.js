const SupabaseStorage = (() => {
  function _generateId(prefix) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = prefix;
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  async function _uid() {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session ? data.session.user.id : null;
    } catch {
      return null;
    }
  }

  async function getAllDecks() {
    const { data, error } = await supabase
      .from("deck")
      .select("*")
      .order("created_date", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function getDeck(deckId) {
    const { data, error } = await supabase
      .from("deck")
      .select("*")
      .eq("deck_id", deckId)
      .single();
    if (error) throw error;
    return data;
  }

  async function getDeckTags(deckId) {
    const { data, error } = await supabase
      .from("deck_tag")
      .select("tag_name")
      .eq("deck_id", deckId);
    if (error) throw error;
    return (data || []).map((r) => r.tag_name);
  }

  async function createDeck(name, tags = []) {
    const deckId = _generateId("D");
    const userId = await _uid();
    const { error: e1 } = await supabase.from("deck").insert({
      deck_id: deckId,
      deck_name: name,
      created_date: new Date().toISOString().split("T")[0],
      user_id: userId,
    });
    if (e1) throw e1;

    if (tags.length > 0) {
      const rows = tags.map((t) => ({ deck_id: deckId, tag_name: t, user_id: userId }));
      const { error: e2 } = await supabase.from("deck_tag").insert(rows);
      if (e2) throw e2;
    }

    return deckId;
  }

  async function updateDeck(deckId, name) {
    const { error } = await supabase
      .from("deck")
      .update({ deck_name: name })
      .eq("deck_id", deckId);
    if (error) throw error;
  }

  async function updateDeckTags(deckId, tags) {
    const userId = await _uid();
    await supabase.from("deck_tag").delete().eq("deck_id", deckId);
    if (tags.length > 0) {
      const rows = tags.map((t) => ({ deck_id: deckId, tag_name: t, user_id: userId }));
      const { error } = await supabase.from("deck_tag").insert(rows);
      if (error) throw error;
    }
  }

  async function deleteDeck(deckId) {
    const { error } = await supabase.from("deck").delete().eq("deck_id", deckId);
    if (error) throw error;
  }

  async function getCards(deckId) {
    const { data, error } = await supabase
      .from("card")
      .select("*")
      .eq("deck_id", deckId)
      .order("card_no", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function createCard(deckId, question, answer) {
    const cards = await getCards(deckId);
    const maxNo = cards.length > 0 ? Math.max(...cards.map((c) => c.card_no)) : 0;
    const { error } = await supabase.from("card").insert({
      deck_id: deckId,
      card_no: maxNo + 1,
      question_text: question,
      answer_text: answer,
      user_id: await _uid(),
    });
    if (error) throw error;
  }

  async function updateCard(deckId, cardNo, question, answer) {
    const { error } = await supabase
      .from("card")
      .update({ question_text: question, answer_text: answer })
      .eq("deck_id", deckId)
      .eq("card_no", cardNo);
    if (error) throw error;
  }

  async function deleteCard(deckId, cardNo) {
    const { error } = await supabase
      .from("card")
      .delete()
      .eq("deck_id", deckId)
      .eq("card_no", cardNo);
    if (error) throw error;
  }

  async function createStudySession(deckId, total, remaining, toReview) {
    const sessionId = _generateId("S");
    const { error } = await supabase.from("study_session").insert({
      session_id: sessionId,
      deck_id: deckId,
      session_date: new Date().toISOString(),
      total_cards: total,
      remaining_cards: remaining,
      cards_to_review: toReview,
      user_id: await _uid(),
    });
    if (error) throw error;
    return sessionId;
  }

  async function getStudySessions(deckId) {
    const { data, error } = await supabase
      .from("study_session")
      .select("*")
      .eq("deck_id", deckId)
      .order("session_date", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  return {
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
  };
})();
