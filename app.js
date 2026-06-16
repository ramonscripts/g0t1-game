// ============================================================
// G0T1 — lógica principal
// Segurança: sanitização de todo input do jogador (escapeHTML),
// validação de nome, zero requisições de rede, proteção try/catch.
// ============================================================

"use strict";

(function () {

  // ---------- helpers seguros ----------
  function $(s) { return document.querySelector(s); }
  function $all(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }

  // Escapa qualquer texto vindo do jogador antes de ir pro DOM via innerHTML.
  function escapeHTML(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Remove caracteres de controle sem usar literais de controle no código.
  function stripControl(v) {
    var out = "";
    for (var i = 0; i < v.length; i++) { var c = v.charCodeAt(i); if (c > 31 && c !== 127) out += v.charAt(i); }
    return out;
  }

  // Valida e limpa o nome do jogo. Retorna {ok, value, error}.
  function sanitizeTitle(raw) {
    let v = String(raw == null ? "" : raw);
    v = stripControl(v);                 // remove caracteres de controle
    v = v.replace(/\s+/g, " ").trim();   // colapsa espaços
    if (v.length === 0) return { ok: false, error: "Dê um nome ao seu jogo." };
    if (v.length > 40) v = v.slice(0, 40);
    if (!/[\p{L}\p{N}]/u.test(v)) return { ok: false, error: "O nome precisa ter ao menos uma letra ou número." };
    return { ok: true, value: v };
  }

  function sanitizeTagline(raw) {
    let v = String(raw == null ? "" : raw);
    v = stripControl(v).replace(/\s+/g, " ").trim();
    return v.slice(0, 60);
  }

  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function randInt(lo, hi) { return Math.floor(Math.random() * (hi - lo + 1)) + lo; }
  function show(id) { $all(".screen").forEach(s => s.classList.remove("active")); const el = $(id); if (el) el.classList.add("active"); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function tier(o) { if (o >= 88) return "elite"; if (o >= 70) return "good"; if (o >= 50) return "mid"; return "bad"; }
  function barColor(o) { if (o >= 88) return "var(--gold)"; if (o >= 70) return "var(--cyan)"; if (o >= 50) return "var(--text-2)"; return "var(--red)"; }
  function isIndie(g) { return (g.tags || []).indexOf("indie") >= 0; }

  // ---------- estado ----------
  const state = {
    mode: GAME_MODES[0],
    pool: GAMES,
    activeCats: [],
    filled: {},      // catKey -> { game, score }
    round: 0,        // quantos atributos já preenchidos
    currentGame: null,
    rerollsLeft: 0,
    armed: null,     // { cat, score } — atributo selecionado para posicionar
    locked: false,   // trava após posicionar até "Próximo jogo"
    theme: null,
    title: "",
    tagline: ""
  };

  function remainingCats() { return state.activeCats.filter(c => !state.filled[c.key]); }

  // ---------- sinergias (baseadas em tags/notas das escolhas) ----------
  function computeSynergies() {
    const results = [];
    const entries = Object.keys(state.filled).map(k => state.filled[k]);
    if (entries.length < 2) return results;

    const tagCount = {};
    entries.forEach(e => (e.game.tags || []).forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; }));
    for (const t in tagCount) {
      if (tagCount[t] >= 4) results.push({ bonus: 6, msg: 'Identidade coesa: ' + tagCount[t] + ' elementos "' + t + '" — o jogo tem alma. +6' });
      else if (tagCount[t] === 3) results.push({ bonus: 3, msg: 'Boa coesão: 3 elementos "' + t + '" combinam. +3' });
    }
    const elite = entries.filter(e => e.score >= 90).length;
    if (elite >= 4) results.push({ bonus: 7, msg: 'Obra-prima: ' + elite + ' atributos de elite. +7' });
    else if (elite === 3) results.push({ bonus: 4, msg: elite + ' atributos de elite — forte candidato. +4' });

    const trash = entries.filter(e => e.score < 35).length;
    if (trash >= 2) results.push({ bonus: -7, msg: trash + ' pontos fracos graves arrastam o jogo pra baixo. -7' });
    else if (trash === 1) results.push({ bonus: -3, msg: 'Um ponto fraco grave compromete o conjunto. -3' });

    const g = state.filled.graficos, j = state.filled.jogabilidade;
    if (g && j && g.score >= 85 && j.score < 50) results.push({ bonus: -4, msg: 'Lindo mas injogável: gráficos altos, jogabilidade fraca. -4' });

    return results;
  }
  function synergyTotal(list) { return list.reduce((s, x) => s + x.bonus, 0); }

  // ---------- afinidade temática ----------
  function computeAffinity(theme) {
    if (!theme) return { score: 0, hits: [], misses: [] };
    const entries = Object.keys(state.filled).map(k => state.filled[k]);
    let score = 0; const hits = [], misses = [];
    entries.forEach(e => (e.game.tags || []).forEach(t => {
      if (theme.likes.indexOf(t) >= 0) { score += 2; if (hits.indexOf(t) < 0) hits.push(t); }
      if (theme.dislikes.indexOf(t) >= 0) { score -= 2; if (misses.indexOf(t) < 0) misses.push(t); }
    }));
    return { score: clamp(score, -10, 12), hits: hits, misses: misses };
  }

  // ---------- menu ----------
  function buildModeCards() {
    const wrap = $("#mode-options"); if (!wrap) return;
    wrap.innerHTML = "";
    GAME_MODES.forEach((m, i) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "mode-card" + (i === 0 ? " active" : "");
      card.innerHTML = '<i class="ti ' + escapeHTML(m.icon) + '"></i><span class="mode-title">' + escapeHTML(m.label) + '</span><span class="mode-desc">' + escapeHTML(m.desc) + '</span>';
      card.addEventListener("click", () => { $all(".mode-card").forEach(c => c.classList.remove("active")); card.classList.add("active"); state.mode = m; });
      wrap.appendChild(card);
    });
  }

  // ---------- draft ----------
  function startDraft() {
    state.filled = {};
    state.round = 0;
    state.theme = null;
    state.armed = null;
    state.locked = false;
    state.rerollsLeft = state.mode.rerolls; // total para a partida inteira
    state.activeCats = CATEGORIES.slice(0, state.mode.categories);
    state.pool = state.mode.indieOnly ? GAMES.filter(isIndie) : GAMES;
    $("#draft-mode-badge").textContent = state.mode.label;
    buildDots();
    renderBuilt();
    show("#screen-draft");
    rollGame();
  }

  function buildDots() {
    const d = $("#progress-dots"); d.innerHTML = "";
    state.activeCats.forEach(() => { const e = document.createElement("div"); e.className = "dot"; d.appendChild(e); });
  }
  function updateProgress() {
    const total = state.activeCats.length;
    $("#progress-fill").style.width = (state.round / total * 100) + "%";
    $all("#progress-dots .dot").forEach((d, i) => { d.classList.remove("done", "current"); if (i < state.round) d.classList.add("done"); else if (i === state.round) d.classList.add("current"); });
  }

  function rollGame() {
    state.armed = null;
    state.locked = false;
    state.currentGame = pick(state.pool);
    $("#next-bar").classList.add("hidden");
    $("#rolled-prompt").textContent = "1. Selecione o atributo que quer herdar:";
    $("#draft-eyebrow").textContent = "Rodada " + (state.round + 1) + " de " + state.activeCats.length;
    renderRolled();
    renderBuilt();
    renderRerollBtn();
    renderSynergyBanner();
    updateProgress();
    updateHudHint();
  }

  function renderRolled() {
    const g = state.currentGame;
    const yr = g.year ? ' <span class="rolled-year">(' + g.year + ')</span>' : '';
    $("#rolled-name").innerHTML = escapeHTML(g.name) + yr;
    $("#rolled-desc").textContent = g.desc;
    $("#rolled-tags").innerHTML = (g.tags || []).map(t => '<span class="opt-tag">' + escapeHTML(t) + '</span>').join("");

    const grid = $("#attr-grid"); grid.innerHTML = "";
    state.activeCats.forEach(cat => {
      const score = g.stats[cat.key] != null ? g.stats[cat.key] : 45;
      const taken = !!state.filled[cat.key];
      const armed = state.armed && state.armed.cat.key === cat.key;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "attr-btn" + (armed ? " armed" : "");
      btn.disabled = taken || state.locked;

      let scoreHtml;
      if (taken) scoreHtml = '<span class="attr-taken">já preenchido</span>';
      else if (state.mode.showStats) scoreHtml = '<span class="attr-score tier-' + tier(score) + '">' + score + '</span>';
      else scoreHtml = '<span class="attr-score hidden-score">? ? ?</span>';

      btn.innerHTML = '<span class="attr-label"><i class="ti ' + escapeHTML(cat.icon) + '"></i>' + escapeHTML(cat.label) + '</span>' + scoreHtml +
        (armed ? '<span class="attr-armed-tag"><i class="ti ti-hand-finger"></i> selecionado — clique na vaga</span>' : '');
      if (!taken && !state.locked) btn.addEventListener("click", () => selectAttr(cat, score));
      grid.appendChild(btn);
    });
  }

  function renderRerollBtn() {
    const btn = $("#btn-reroll"), txt = $("#reroll-text");
    if (state.mode.rerolls <= 0) { btn.disabled = true; txt.textContent = "Sem giros neste modo"; return; }
    if (state.rerollsLeft > 0 && !state.locked) { btn.disabled = false; txt.textContent = "Girar de novo (" + state.rerollsLeft + " no total)"; }
    else { btn.disabled = true; txt.textContent = state.rerollsLeft > 0 ? "Girar de novo (" + state.rerollsLeft + ")" : "Giros esgotados"; }
  }

  // HUD de posicionamento — a "escalação" do seu jogo
  function renderBuilt() {
    const grid = $("#built-grid"); grid.innerHTML = "";
    state.activeCats.forEach(cat => {
      const f = state.filled[cat.key];
      const isTarget = !f && state.armed && state.armed.cat.key === cat.key && !state.locked;
      const slot = document.createElement(f ? "div" : "button");
      if (!f) { slot.type = "button"; }
      slot.className = "built-slot" + (f ? " filled" : " empty") + (isTarget ? " target" : "");
      if (f) {
        slot.innerHTML = '<div class="bs-cat"><i class="ti ' + escapeHTML(cat.icon) + '"></i>' + escapeHTML(cat.label) + '</div>' +
          '<div class="bs-game">' + escapeHTML(f.game.name) + '</div>' +
          (state.mode.showStats ? '<div class="bs-score tier-' + tier(f.score) + '">' + f.score + '</div>' : '<div class="bs-score">✓</div>');
      } else {
        slot.innerHTML = '<div class="bs-cat"><i class="ti ' + escapeHTML(cat.icon) + '"></i>' + escapeHTML(cat.label) + '</div>' +
          '<div class="bs-empty">' + (isTarget ? '<i class="ti ti-arrow-down"></i> encaixar aqui' : 'vaga livre') + '</div>';
        if (!state.locked) slot.addEventListener("click", () => placeArmed(cat));
      }
      grid.appendChild(slot);
    });
  }

  function updateHudHint() {
    const h = $("#hud-hint"); if (!h) return;
    if (state.locked) { h.innerHTML = '<i class="ti ti-circle-check"></i> Atributo posicionado! Avance para o próximo jogo.'; h.className = "hud-hint ok"; return; }
    if (state.armed) {
      h.innerHTML = '<i class="ti ti-hand-finger"></i> <strong>' + escapeHTML(state.armed.cat.label) + '</strong> selecionado — clique na vaga piscando para encaixar.';
      h.className = "hud-hint active";
    } else {
      h.textContent = "Selecione um atributo acima; a vaga compatível vai piscar — clique nela para encaixar.";
      h.className = "hud-hint";
    }
  }
  function flashHint(msg) {
    const h = $("#hud-hint"); if (!h) return;
    h.innerHTML = '<i class="ti ti-alert-triangle"></i> ' + escapeHTML(msg);
    h.className = "hud-hint warn";
  }

  function selectAttr(cat, score) {
    if (state.filled[cat.key] || state.locked) return;
    state.armed = { cat: cat, score: score };
    renderRolled();
    renderBuilt();
    updateHudHint();
  }

  function placeArmed(cat) {
    if (state.locked) return;
    if (!state.armed) { flashHint("Selecione primeiro um atributo do jogo sorteado."); return; }
    if (state.armed.cat.key !== cat.key) {
      flashHint('Esse atributo é de "' + state.armed.cat.label + '". Clique na vaga de ' + state.armed.cat.label + '.');
      return;
    }
    if (state.filled[cat.key]) return;
    confirmPlacement(state.armed.cat, state.armed.score);
  }

  function confirmPlacement(cat, score) {
    state.filled[cat.key] = { game: state.currentGame, score: score };
    state.round++;
    state.armed = null;
    state.locked = true;
    renderBuilt();
    renderRolled();
    updateHudHint();

    $("#btn-reroll").disabled = true;
    $("#rolled-prompt").textContent = "Atributo posicionado!";
    const bar = $("#next-bar");
    const last = remainingCats().length === 0;
    $("#next-confirm").innerHTML = '<i class="ti ti-circle-check-filled"></i>' + escapeHTML(cat.label) + ' de ' + escapeHTML(state.currentGame.name) + ' escalado.';
    $("#btn-next").innerHTML = last
      ? 'Finalizar e nomear <i class="ti ti-arrow-right"></i>'
      : 'Próximo jogo <i class="ti ti-player-track-next"></i>';
    bar.classList.remove("hidden");
    updateProgress();
  }

  function onNext() {
    $("#next-bar").classList.add("hidden");
    if (remainingCats().length === 0) goToIdentity();
    else rollGame();
  }

  function onReroll() {
    if (state.rerollsLeft <= 0 || state.locked) return;
    state.rerollsLeft--;
    let next = pick(state.pool);
    let guard = 0;
    while (next === state.currentGame && guard++ < 12) next = pick(state.pool);
    state.currentGame = next;
    state.armed = null;
    renderRolled();
    renderBuilt();
    renderRerollBtn();
    updateHudHint();
  }

  function renderSynergyBanner() {
    const list = computeSynergies();
    const banner = $("#synergy-banner");
    if (!list.length) { banner.classList.add("hidden"); return; }
    const top = list.slice().sort((a, b) => Math.abs(b.bonus) - Math.abs(a.bonus))[0];
    banner.className = "synergy-banner " + (top.bonus >= 0 ? "bonus" : "malus");
    banner.innerHTML = '<i class="ti ' + (top.bonus >= 0 ? "ti-bolt" : "ti-alert-triangle") + '"></i>' + escapeHTML(top.msg);
    banner.classList.remove("hidden");
  }

  // ---------- overall ----------
  function computeOverall() {
    const weights = state.mode.weights || {};
    let ws = 0, wt = 0;
    state.activeCats.forEach(cat => {
      const w = weights[cat.key] != null ? weights[cat.key] : 1;
      ws += state.filled[cat.key].score * w; wt += w;
    });
    const base = ws / wt;
    const synergies = computeSynergies();
    const synBonus = synergyTotal(synergies);
    const aff = computeAffinity(state.theme);
    const final = clamp(Math.round(base + synBonus + aff.score), 10, 99);
    return { final: final, base: Math.round(base), synBonus: synBonus, synergies: synergies, affinity: aff };
  }

  // ---------- identidade ----------
  function goToIdentity() {
    state.theme = null;
    $("#input-title").value = "";
    $("#input-tagline").value = "";
    $("#title-error").textContent = "";
    buildThemeGrid();
    updateAffinityUI();
    show("#screen-identity");
  }

  function buildThemeGrid() {
    const grid = $("#theme-grid"); grid.innerHTML = "";
    THEMES.forEach(t => {
      const aff = computeAffinity(t);
      const cls = aff.score > 0 ? "pos" : aff.score < 0 ? "neg" : "neu";
      const sign = aff.score > 0 ? "+" + aff.score : "" + aff.score;
      const card = document.createElement("button");
      card.type = "button"; card.className = "theme-card";
      card.innerHTML = '<i class="ti ' + escapeHTML(t.icon) + '"></i>' + escapeHTML(t.label) + '<span class="theme-aff ' + cls + '">' + (aff.score === 0 ? "neutro" : sign) + '</span>';
      card.addEventListener("click", () => { $all(".theme-card").forEach(c => c.classList.remove("active")); card.classList.add("active"); state.theme = t; updateAffinityUI(); });
      grid.appendChild(card);
    });
  }

  function updateAffinityUI() {
    const readout = $("#affinity-readout"), detail = $("#affinity-detail");
    if (!state.theme) { readout.textContent = ""; detail.textContent = "Escolha uma temática. Os números mostram a afinidade com suas escolhas."; return; }
    const aff = computeAffinity(state.theme);
    if (aff.score > 0) readout.innerHTML = '<span style="color:var(--green)">afinidade +' + aff.score + '</span>';
    else if (aff.score < 0) readout.innerHTML = '<span style="color:var(--red)">afinidade ' + aff.score + '</span>';
    else readout.innerHTML = '<span style="color:var(--text-3)">neutro</span>';
    let html = "";
    if (aff.hits.length) html += '<span class="pos">Combina com: ' + escapeHTML(aff.hits.join(", ")) + '.</span> ';
    if (aff.misses.length) html += '<span class="neg">Destoa de: ' + escapeHTML(aff.misses.join(", ")) + '.</span>';
    detail.innerHTML = html || "Suas escolhas não puxam fortemente para esta temática.";
  }

  // gerador de nomes mais variado
  function suggestTitle() {
    const P = TITLE_PARTS;
    const used = [];
    function uniqCore() { let c, g = 0; do { c = pick(P.core); } while (used.indexOf(c) >= 0 && g++ < 12); used.push(c); return c; }
    const helpers = {
      prefix: () => pick(P.prefix), core: uniqCore, coreB: uniqCore,
      suffix: () => pick(P.suffix), adjective: () => pick(P.adjective),
      noun: () => pick(P.noun), subtitle: () => pick(P.subtitle), numeral: () => pick(P.numeral)
    };
    let name = "";
    for (let attempt = 0; attempt < 8; attempt++) {
      used.length = 0;
      name = pick(P.patterns)(helpers).replace(/\s+/g, " ").trim();
      if (name.length >= 3 && name.length <= 40) break;
    }
    return name.slice(0, 40);
  }

  // ---------- Jornada ao GOTY + Cerimônia (premiação por categorias) ----------
  const SPEEDS = { slow: 1.7, normal: 1, fast: 0.45 };
  const ceremony = { speed: "normal", timers: [], skipped: false, dotIv: null, result: null, safeTitle: "" };

  function ms(base) { return Math.round(base * SPEEDS[ceremony.speed]); }
  function later(fn, delay) { const t = setTimeout(fn, delay); ceremony.timers.push(t); return t; }
  function stopDots() { if (ceremony.dotIv) { clearInterval(ceremony.dotIv); ceremony.dotIv = null; } }
  function clearCeremonyTimers() { ceremony.timers.forEach(t => { if (t && t._iv) clearInterval(t._iv); else clearTimeout(t); }); ceremony.timers = []; stopDots(); }
  function startDots() {
    stopDots(); let d = 0;
    const iv = setInterval(() => { const e = $("#dots"); if (!e) { clearInterval(iv); return; } d = (d % 5) + 1; e.textContent = ".".repeat(d); }, ms(260));
    ceremony.dotIv = iv; ceremony.timers.push({ _iv: iv });
  }

  function goalFor() {
    const n = state.activeCats.length;
    return { points: Math.round(n * 4.5), wins: Math.max(2, Math.round(n / 3)) };
  }

  // monta o pódio de uma categoria: jogador vs rivais
  function buildCategoryAward(cat) {
    const playerScore = state.filled[cat.key].score;
    const rivals = shuffle(RIVALS).slice(0, NOMINEES_PER_CATEGORY).map(r => {
      const base = (r.power - 6) + state.mode.rivalBias;
      return { name: r.name, trait: r.trait, score: clamp(Math.round(base + randInt(-12, 12)), 45, 98), you: false };
    });
    const nominees = rivals.concat([{ name: state.title, trait: "seu jogo", score: playerScore, you: true }]);
    nominees.sort((a, b) => (b.score - a.score) || (a.you ? 1 : b.you ? -1 : 0)); // empate: rival na frente (mais difícil)
    const place = nominees.findIndex(n => n.you) + 1;
    const points = place === 1 ? AWARD_POINTS.first : place === 2 ? AWARD_POINTS.second : place === 3 ? AWARD_POINTS.third : 0;
    return { cat: cat, nominees: nominees, place: place, points: points };
  }

  // prêmio de Jogo Indie do Ano (modo indie) — precisa ser 1º para avançar
  function buildIndieAward(overall) {
    const rivals = shuffle(INDIE_RIVALS).slice(0, 3).map(r => ({
      name: r.name, trait: r.trait, score: clamp(Math.round((r.power - 9) + state.mode.rivalBias + randInt(-12, 12)), 45, 98), you: false
    }));
    const nominees = rivals.concat([{ name: state.title, trait: "seu indie", score: overall, you: true }]);
    nominees.sort((a, b) => (b.score - a.score) || (a.you ? 1 : b.you ? -1 : 0));
    const place = nominees.findIndex(n => n.you) + 1;
    return { nominees: nominees, place: place, won: place === 1 };
  }

  function buildResult(overall) {
    const goal = goalFor();
    const indie = state.mode.indieOnly ? buildIndieAward(overall) : null;

    if (indie && !indie.won) {
      return { overall: overall, indie: indie, awards: null, totalPoints: 0, totalWins: 0, goal: goal, champion: false, indieLost: true };
    }

    const awards = state.activeCats.map(buildCategoryAward);
    let totalPoints = 0, totalWins = 0;
    awards.forEach(a => { totalPoints += a.points; if (a.place === 1) totalWins++; });
    const champion = totalPoints >= goal.points && totalWins >= goal.wins;
    return { overall: overall, indie: indie, awards: awards, totalPoints: totalPoints, totalWins: totalWins, goal: goal, champion: champion, indieLost: false };
  }

  function showResult() {
    const ov = computeOverall();
    ceremony.safeTitle = escapeHTML(state.title);
    ceremony.result = buildResult(ov.final);

    $("#result-theme-badge").innerHTML = '<i class="ti ' + escapeHTML(state.theme.icon) + '"></i>' + escapeHTML(state.theme.label);
    $("#result-title").textContent = state.title;
    const tag = $("#result-tagline");
    if (state.tagline) { tag.textContent = '"' + state.tagline + '"'; tag.style.display = "block"; }
    else tag.style.display = "none";
    $("#result-overall").textContent = "--";

    // quality grid
    const qg = $("#quality-grid"); qg.innerHTML = "";
    state.activeCats.forEach(cat => {
      const f = state.filled[cat.key];
      const item = document.createElement("div"); item.className = "quality-item";
      item.innerHTML = '<div class="q-cat"><i class="ti ' + escapeHTML(cat.icon) + '"></i>' + escapeHTML(cat.label) + '</div><div class="q-name">' + escapeHTML(f.game.name) + '</div><div class="q-bar"><span style="width:0%;background:' + barColor(f.score) + '"></span></div>';
      qg.appendChild(item);
      setTimeout(() => { const sp = item.querySelector(".q-bar span"); if (sp) sp.style.width = f.score + "%"; }, 100);
    });

    // flags
    const flags = $("#flags-list"); flags.innerHTML = "";
    const sorted = state.activeCats.map(c => ({ cat: c, f: state.filled[c.key] })).sort((a, b) => b.f.score - a.f.score);
    const best = sorted[0], worst = sorted[sorted.length - 1];
    addFlag(flags, "good", "ti-trending-up", "Ponto mais forte: <strong>" + escapeHTML(best.cat.label) + "</strong> — " + escapeHTML(best.f.game.name));
    if (worst.f.score < 60) addFlag(flags, "bad", "ti-trending-down", "Ponto fraco: <strong>" + escapeHTML(worst.cat.label) + "</strong> — " + escapeHTML(worst.f.game.name));
    if (ov.affinity.score > 0) addFlag(flags, "good", "ti-sparkles", "Temática " + escapeHTML(state.theme.label) + " combina. Afinidade +" + ov.affinity.score);
    if (ov.affinity.score < 0) addFlag(flags, "bad", "ti-mood-sad", "Temática " + escapeHTML(state.theme.label) + " destoa. Afinidade " + ov.affinity.score);
    ov.synergies.forEach(s => addFlag(flags, s.bonus >= 0 ? "good" : "bad", s.bonus >= 0 ? "ti-bolt" : "ti-alert-triangle", escapeHTML(s.msg)));

    // prepara cerimônia
    ceremony.skipped = false;
    clearCeremonyTimers();
    $("#bracket").innerHTML = "";
    $("#bracket-title").style.display = "none";
    $("#verdict-box").classList.add("hidden");
    $("#btn-restart").classList.add("hidden");
    $("#btn-skip").disabled = false;
    resetPointsBoard();
    setActiveSpeedButton(ceremony.speed);

    show("#screen-result");
    animateOverall(ov.final);
    runCeremony();
  }

  function addFlag(container, cls, icon, html) {
    const f = document.createElement("div"); f.className = "flag " + cls;
    f.innerHTML = '<i class="ti ' + icon + '"></i>' + html; container.appendChild(f);
  }
  function animateOverall(target) {
    const el = $("#result-overall"); let cur = 0; const step = Math.max(1, Math.round(target / 30));
    const iv = setInterval(() => { cur += step; if (cur >= target) { cur = target; clearInterval(iv); } el.textContent = cur; }, 28);
  }

  function narr(html, flash) {
    const stage = $("#ceremony-stage");
    const box = $("#ceremony-narration");
    box.innerHTML = '<div class="narr-line">' + html + '</div>';
    if (flash) { stage.classList.remove("flash"); void stage.offsetWidth; stage.classList.add("flash"); }
  }

  // ---- placar de pontos ----
  function resetPointsBoard() {
    $("#points-board").classList.add("hidden");
    $("#pb-points").textContent = "0";
    $("#pb-target").textContent = "--";
    $("#pb-wins").textContent = "0";
    $("#pb-points").className = "pb-value";
    $("#pb-wins").className = "pb-value";
  }
  function showPointsBoard() {
    const r = ceremony.result;
    $("#points-board").classList.remove("hidden");
    $("#pb-target").textContent = r.goal.points + " pts · " + r.goal.wins + " cat.";
  }
  function setPointsBoard(points, wins) {
    const r = ceremony.result;
    $("#pb-points").textContent = points;
    $("#pb-wins").textContent = wins;
    $("#pb-points").className = "pb-value" + (points >= r.goal.points ? " hit" : "");
    $("#pb-wins").className = "pb-value" + (wins >= r.goal.wins ? " hit" : "");
  }

  // ---- cards de premiação ----
  function appendAwardCard(label, icon, award) {
    $("#bracket-title").style.display = "block";
    const b = $("#bracket");
    const m = document.createElement("div");
    const cls = award.place === 1 ? "first" : (award.place <= 3 ? "podium" : "missed");
    m.className = "award " + cls;
    const medals = ["ti-trophy", "ti-medal", "ti-medal-2"];
    let rows = "";
    award.nominees.forEach((n, idx) => {
      const rank = idx + 1;
      const mic = rank <= 3 ? medals[rank - 1] : "ti-point";
      rows += '<div class="award-row' + (n.you ? " you" : "") + (rank <= 3 ? " podium-row r" + rank : "") + '">' +
        '<span class="ar-rank"><i class="ti ' + mic + '"></i>' + rank + 'º</span>' +
        '<span class="ar-name">' + (n.you ? ceremony.safeTitle : escapeHTML(n.name)) + '</span>' +
        '<span class="ar-score">' + n.score + '</span></div>';
    });
    const ptsTxt = award.points > 0 ? '+' + award.points + ' pts' : '0 pts';
    m.innerHTML =
      '<div class="award-head"><span class="award-cat"><i class="ti ' + escapeHTML(icon) + '"></i>' + escapeHTML(label) + '</span>' +
      '<span class="award-points ' + (award.points > 0 ? "pos" : "zero") + '">' + escapeHTML(award.place + 'º lugar · ' + ptsTxt) + '</span></div>' +
      '<div class="award-rows">' + rows + '</div>';
    b.appendChild(m);
  }

  // ---- sequência da cerimônia (decidida de antemão em ceremony.result) ----
  function runCeremony() {
    const r = ceremony.result;
    const steps = [];

    // abertura
    steps.push({ run: () => narr('<span class="narr-host">' + escapeHTML(pick(CEREMONY.open)) + '</span>', true), after: ms(1900) });

    // prêmio indie (modo indie)
    if (r.indie) {
      steps.push({ run: () => narr('<span class="narr-host">' + escapeHTML(pick(CEREMONY.indieIntro)) + '</span>', true), after: ms(1800) });
      steps.push({ run: () => { narr('<span class="narr-host">E o Jogo Indie do Ano é</span>... <span class="suspense-dots" id="dots"></span>'); startDots(); }, after: ms(2100) });
      steps.push({
        run: () => {
          stopDots();
          appendAwardCard("Jogo Indie do Ano", "ti-bulb", { place: r.indie.place, points: 0, nominees: r.indie.nominees });
          if (r.indie.won) narr('<span class="narr-winner"><i class="ti ti-trophy"></i>' + ceremony.safeTitle + '!</span><br><br><span class="narr-host">Indie do Ano! Você avança para as categorias principais.</span>', true);
          else narr('<span class="narr-winner"><i class="ti ti-medal"></i>' + escapeHTML(r.indie.nominees[0].name) + '!</span><br><br><span class="narr-host">Seu indie ficou em ' + r.indie.place + 'º e parou aqui.</span>', true);
        }, after: ms(1700)
      });
      if (!r.indie.won) {
        steps.push({ run: () => finishGoty(), after: 0 });
        runSteps(steps);
        return;
      }
    }

    // categorias
    steps.push({ run: () => { showPointsBoard(); setPointsBoard(0, 0); }, after: ms(700) });

    let runningPts = 0, runningWins = 0;
    r.awards.forEach(award => {
      steps.push({
        run: () => narr('<span class="narr-host">' + escapeHTML(pick(CEREMONY.nextCategory)) + '</span> <span class="narr-cat"><i class="ti ' + escapeHTML(award.cat.icon) + '"></i>' + escapeHTML(award.cat.label) + '</span>', true),
        after: ms(1700)
      });
      steps.push({ run: () => { narr('<span class="narr-host">' + escapeHTML(pick(CEREMONY.podiumIntro)) + ' E o 1º lugar é</span>... <span class="suspense-dots" id="dots"></span>'); startDots(); }, after: ms(1900) });
      steps.push({
        run: () => {
          stopDots();
          appendAwardCard(award.cat.label, award.cat.icon, award);
          runningPts += award.points; if (award.place === 1) runningWins++;
          setPointsBoard(runningPts, runningWins);
          const top = award.nominees[0];
          const youWon = award.place === 1;
          const msg = youWon
            ? '<span class="narr-winner"><i class="ti ti-trophy"></i>' + ceremony.safeTitle + '!</span><br><br><span class="narr-host">Levou a categoria! +' + award.points + ' pontos.</span>'
            : '<span class="narr-winner"><i class="ti ti-medal"></i>' + escapeHTML(top.name) + '!</span><br><br><span class="narr-host">Você ficou em ' + award.place + 'º — ' + (award.points > 0 ? '+' + award.points + ' pts no pódio.' : 'sem pontos desta vez.') + '</span>';
          narr(msg, true);
        }, after: ms(1500)
      });
    });

    // final
    steps.push({ run: () => narr('<span class="narr-host">' + escapeHTML(pick(CEREMONY.beforeFinal)) + '</span>', true), after: ms(1800) });
    steps.push({ run: () => { narr('<span class="narr-host">' + escapeHTML(pick(CEREMONY.finalSuspense)) + '</span>... <span class="suspense-dots" id="dots"></span>'); startDots(); }, after: ms(2200) });
    steps.push({ run: () => { stopDots(); finishGoty(); }, after: 0 });

    runSteps(steps);
  }

  function runSteps(steps) {
    let i = 0;
    function next() {
      if (ceremony.skipped) return;
      if (i >= steps.length) return;
      const step = steps[i++];
      try { step.run(); } catch (e) { console.error("[G0T1]", e); }
      if (i < steps.length) later(next, step.after);
    }
    next();
  }

  function skipCeremony() {
    if (ceremony.skipped) return;
    ceremony.skipped = true;
    clearCeremonyTimers();
    const r = ceremony.result;
    const b = $("#bracket"); b.innerHTML = ""; $("#bracket-title").style.display = "block";

    if (r.indie) appendAwardCard("Jogo Indie do Ano", "ti-bulb", { place: r.indie.place, points: 0, nominees: r.indie.nominees });

    if (!r.indieLost) {
      showPointsBoard();
      r.awards.forEach(a => appendAwardCard(a.cat.label, a.cat.icon, a));
      setPointsBoard(r.totalPoints, r.totalWins);
    }
    narr('<span class="narr-host">Cerimônia encerrada.</span>');
    $("#btn-skip").disabled = true;
    finishGoty();
  }

  function setActiveSpeedButton(speed) {
    $all(".speed-btn").forEach(btn => btn.classList.toggle("active", btn.getAttribute("data-speed") === speed));
  }

  function finishGoty() {
    const r = ceremony.result;
    const v = $("#verdict-box");
    const safeTitle = ceremony.safeTitle;

    if (r.indieLost) {
      v.className = "verdict-box lost";
      v.innerHTML = '<i class="ti ti-medal verdict-icon" style="color:var(--text-2)"></i><div class="verdict-title">FORA DA DISPUTA</div>' +
        '<div class="verdict-text">' + safeTitle + ' ficou em ' + r.indie.place + 'º no Jogo Indie do Ano e não passou para as categorias principais. Reforce inovação e jogabilidade — é onde os indies brilham.</div>';
    } else if (r.champion) {
      v.className = "verdict-box champion";
      v.innerHTML = '<i class="ti ti-trophy verdict-icon"></i><div class="verdict-title">GAME OF THE YEAR!</div>' +
        '<div class="verdict-text">' + safeTitle + ' somou <strong>' + r.totalPoints + ' pontos</strong> vencendo <strong>' + r.totalWins + ' categorias</strong> e levou a estatueta máxima. Overall ' + r.overall + '. Uma noite histórica!</div>';
    } else {
      const shortPts = Math.max(0, r.goal.points - r.totalPoints);
      const shortWins = Math.max(0, r.goal.wins - r.totalWins);
      let reason;
      if (shortWins > 0 && shortPts > 0) reason = 'Faltaram ' + shortPts + ' pontos e ' + shortWins + ' vitória(s) de categoria.';
      else if (shortWins > 0) reason = 'Você tinha pontos, mas faltaram ' + shortWins + ' vitória(s) de categoria — é preciso dominar, não só pontuar.';
      else reason = 'Faltaram ' + shortPts + ' pontos para a meta.';
      v.className = "verdict-box lost";
      v.innerHTML = '<i class="ti ti-medal verdict-icon" style="color:var(--text-2)"></i><div class="verdict-title">INDICADO</div>' +
        '<div class="verdict-text">' + safeTitle + ' fez <strong>' + r.totalPoints + '/' + r.goal.points + ' pts</strong> e venceu <strong>' + r.totalWins + '/' + r.goal.wins + '</strong> categorias. ' + reason + ' Refine os pontos fracos e a temática.</div>';
    }
    $("#btn-skip").disabled = true;
    later(() => { v.classList.remove("hidden"); $("#btn-restart").classList.remove("hidden"); }, ms(400));
  }

  // ---------- tema claro/escuro ----------
  function getStoredTheme() { try { return localStorage.getItem("g0t1-theme"); } catch (e) { return null; } }
  function storeTheme(t) { try { localStorage.setItem("g0t1-theme", t); } catch (e) { /* sem persistência: tudo bem */ } }
  function applyTheme(t) {
    document.body.classList.toggle("light", t === "light");
    const ic = $("#btn-theme i");
    if (ic) ic.className = "ti " + (t === "light" ? "ti-moon" : "ti-sun");
  }
  function initTheme() {
    const t = getStoredTheme() || "dark";
    applyTheme(t);
    const btn = $("#btn-theme");
    if (btn) btn.addEventListener("click", safe(() => {
      const cur = document.body.classList.contains("light") ? "light" : "dark";
      const nextT = cur === "light" ? "dark" : "light";
      applyTheme(nextT); storeTheme(nextT);
    }));
  }

  // ---------- wiring (com proteção) ----------
  function safe(fn) { return function () { try { fn.apply(null, arguments); } catch (e) { console.error("[G0T1]", e); } }; }

  function init() {
    initTheme();
    buildModeCards();
    $("#btn-rules").addEventListener("click", safe(() => $("#rules-box").classList.toggle("hidden")));
    $("#btn-start").addEventListener("click", safe(startDraft));
    $("#btn-reroll").addEventListener("click", safe(onReroll));
    $("#btn-next").addEventListener("click", safe(onNext));
    $("#btn-skip").addEventListener("click", safe(skipCeremony));
    $all(".speed-btn").forEach(btn => btn.addEventListener("click", safe(() => {
      ceremony.speed = btn.getAttribute("data-speed");
      setActiveSpeedButton(ceremony.speed);
    })));
    $("#btn-suggest-title").addEventListener("click", safe(() => { $("#input-title").value = suggestTitle(); $("#title-error").textContent = ""; }));
    $("#input-title").addEventListener("input", safe(() => { $("#input-title").style.borderColor = "var(--border)"; $("#title-error").textContent = ""; }));
    $("#btn-compete").addEventListener("click", safe(() => {
      const res = sanitizeTitle($("#input-title").value);
      if (!res.ok) { $("#input-title").focus(); $("#input-title").style.borderColor = "var(--red)"; $("#title-error").textContent = res.error; return; }
      if (!state.theme) state.theme = THEMES[0];
      state.title = res.value;
      state.tagline = sanitizeTagline($("#input-tagline").value);
      showResult();
    }));
    $("#btn-restart").addEventListener("click", safe(() => show("#screen-menu")));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

})();
