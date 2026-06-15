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

  // Valida e limpa o nome do jogo. Retorna {ok, value, error}.
  function sanitizeTitle(raw) {
    let v = String(raw == null ? "" : raw);
    v = v.replace(/[\u0000-\u001F\u007F]/g, "");        // remove caracteres de controle
    v = v.replace(/\s+/g, " ").trim();                   // colapsa espaços
    if (v.length === 0) return { ok: false, error: "Dê um nome ao seu jogo." };
    if (v.length > 40) v = v.slice(0, 40);
    if (!/[\p{L}\p{N}]/u.test(v)) return { ok: false, error: "O nome precisa ter ao menos uma letra ou número." };
    return { ok: true, value: v };
  }

  function sanitizeTagline(raw) {
    let v = String(raw == null ? "" : raw);
    v = v.replace(/[\u0000-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim();
    return v.slice(0, 60);
  }

  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function show(id) { $all(".screen").forEach(s => s.classList.remove("active")); const el = $(id); if (el) el.classList.add("active"); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function tier(o) { if (o >= 88) return "elite"; if (o >= 70) return "good"; if (o >= 50) return "mid"; return "bad"; }
  function barColor(o) { if (o >= 88) return "var(--gold)"; if (o >= 70) return "var(--cyan)"; if (o >= 50) return "var(--text-2)"; return "var(--red)"; }

  // ---------- estado ----------
  const state = {
    mode: GAME_MODES[0],
    activeCats: [],
    filled: {},      // catKey -> { game, score }
    round: 0,        // quantos atributos já preenchidos
    currentGame: null,
    rerollsLeft: 0,
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
    state.rerollsLeft = state.mode.rerolls; // total para a partida inteira
    state.activeCats = CATEGORIES.slice(0, state.mode.categories);
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
    state.currentGame = pick(GAMES);
    $("#next-bar").classList.add("hidden");
    $("#draft-eyebrow").textContent = "Rodada " + (state.round + 1) + " de " + state.activeCats.length;
    renderRolled();
    renderRerollBtn();
    renderSynergyBanner();
    updateProgress();
  }

  function renderRolled() {
    const g = state.currentGame;
    $("#rolled-name").textContent = g.name;
    $("#rolled-desc").textContent = g.desc;
    $("#rolled-tags").innerHTML = (g.tags || []).map(t => '<span class="opt-tag">' + escapeHTML(t) + '</span>').join("");

    const grid = $("#attr-grid"); grid.innerHTML = "";
    const remaining = remainingCats();
    state.activeCats.forEach(cat => {
      const score = g.stats[cat.key] != null ? g.stats[cat.key] : 45;
      const taken = !!state.filled[cat.key];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "attr-btn";
      btn.disabled = taken;

      let scoreHtml;
      if (taken) scoreHtml = '<span class="attr-taken">já preenchido</span>';
      else if (state.mode.showStats) scoreHtml = '<span class="attr-score tier-' + tier(score) + '">' + score + '</span>';
      else scoreHtml = '<span class="attr-score hidden-score">? ? ?</span>';

      btn.innerHTML = '<span class="attr-label"><i class="ti ' + escapeHTML(cat.icon) + '"></i>' + escapeHTML(cat.label) + '</span>' + scoreHtml;
      if (!taken) btn.addEventListener("click", () => chooseAttr(cat, score));
      grid.appendChild(btn);
    });
  }

  function renderRerollBtn() {
    const btn = $("#btn-reroll"), txt = $("#reroll-text");
    if (state.rerollsLeft > 0) { btn.disabled = false; txt.textContent = "Girar de novo (" + state.rerollsLeft + " no total)"; }
    else { btn.disabled = true; txt.textContent = "Giros esgotados"; }
  }

  function renderBuilt() {
    const grid = $("#built-grid"); grid.innerHTML = "";
    state.activeCats.forEach(cat => {
      const slot = document.createElement("div");
      const f = state.filled[cat.key];
      slot.className = "built-slot" + (f ? " filled" : "");
      const inner = f
        ? '<div class="bs-cat"><i class="ti ' + escapeHTML(cat.icon) + '"></i>' + escapeHTML(cat.label) + '</div><div class="bs-game">' + escapeHTML(f.game.name) + '</div>'
        : '<div class="bs-cat"><i class="ti ' + escapeHTML(cat.icon) + '"></i>' + escapeHTML(cat.label) + '</div><div class="bs-empty">vazio</div>';
      slot.innerHTML = inner;
      grid.appendChild(slot);
    });
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

  function chooseAttr(cat, score) {
    if (state.filled[cat.key]) return; // proteção: nunca sobrescreve
    state.filled[cat.key] = { game: state.currentGame, score: score };
    state.round++;
    renderBuilt();

    // trava os botões de atributo e mostra a barra "Próximo" (jogador controla o avanço)
    $all("#attr-grid .attr-btn").forEach(b => { b.disabled = true; });
    $("#btn-reroll").disabled = true;
    $("#rolled-prompt").textContent = "Atributo herdado!";
    const bar = $("#next-bar");
    const last = remainingCats().length === 0;
    $("#next-confirm").innerHTML = '<i class="ti ti-circle-check-filled"></i>' + escapeHTML(cat.label) + ' de ' + escapeHTML(state.currentGame.name) + ' adicionado.';
    $("#btn-next").innerHTML = last
      ? 'Finalizar e nomear <i class="ti ti-arrow-right"></i>'
      : 'Próximo jogo <i class="ti ti-player-track-next"></i>';
    bar.classList.remove("hidden");
  }

  function onNext() {
    $("#next-bar").classList.add("hidden");
    $("#rolled-prompt").textContent = "Qual atributo deste jogo você quer herdar?";
    if (remainingCats().length === 0) goToIdentity();
    else rollGame();
  }

  function onReroll() {
    if (state.rerollsLeft <= 0) return;
    state.rerollsLeft--;
    let next = pick(GAMES);
    // evita repetir o mesmo jogo no reroll, se possível
    let guard = 0;
    while (next === state.currentGame && guard++ < 10) next = pick(GAMES);
    state.currentGame = next;
    renderRolled();
    renderRerollBtn();
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

  function suggestTitle() { return pick(TITLE_PARTS.prefix) + " " + pick(TITLE_PARTS.core) + pick(TITLE_PARTS.suffix); }

  // ---------- Copa GOTY + Cerimônia ----------
  // ritmo da cerimônia (multiplicadores de tempo)
  const SPEEDS = { slow: 1.7, normal: 1, fast: 0.45 };
  const ceremony = { speed: "normal", timers: [], skipped: false, rounds: null, overall: 0, safeTitle: "" };

  function ms(base) { return Math.round(base * SPEEDS[ceremony.speed]); }
  function clearCeremonyTimers() { ceremony.timers.forEach(t => { if (t && t._iv) clearInterval(t._iv); else clearTimeout(t); }); ceremony.timers = []; }
  function later(fn, delay) { const t = setTimeout(fn, delay); ceremony.timers.push(t); return t; }

  function buildBracket(playerOverall) {
    const rivals = shuffle(RIVALS).slice(0, 3);
    const stages = ["Quartas de final", "Semifinal", "Final — Game of the Year"];
    const rounds = [];
    for (let i = 0; i < 3; i++) {
      const r = rivals[i];
      const rivalPower = clamp(r.power + state.mode.rivalBias + i * 2, 68, 99);
      const youScore = clamp(playerOverall + Math.round(Math.random() * 10 - 5), 10, 99);
      const rivalScore = clamp(rivalPower + Math.round(Math.random() * 10 - 5), 10, 99);
      rounds.push({ stage: stages[i], rival: r, youScore: youScore, rivalScore: rivalScore, won: youScore >= rivalScore });
    }
    return rounds;
  }
  function flavorFor(diff) {
    if (Math.abs(diff) <= 3) return pick(MATCH_FLAVOR.close);
    if (Math.abs(diff) >= 12) return pick(MATCH_FLAVOR.blowout);
    return pick(MATCH_FLAVOR.intro);
  }

  function showResult() {
    const ov = computeOverall();
    ceremony.safeTitle = escapeHTML(state.title);
    ceremony.overall = ov.final;

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
    ceremony.rounds = buildBracket(ov.final);
    ceremony.skipped = false;
    clearCeremonyTimers();
    $("#bracket").innerHTML = "";
    $("#bracket-title").style.display = "none";
    $("#verdict-box").classList.add("hidden");
    $("#btn-restart").classList.add("hidden");
    $("#btn-skip").disabled = false;
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

  // monta o card de uma partida no bracket (revelado)
  function appendMatchCard(r) {
    $("#bracket-title").style.display = "block";
    const b = $("#bracket");
    const m = document.createElement("div");
    m.className = "match " + (r.won ? "win-result" : "lose-result");
    m.innerHTML =
      '<div class="match-stage"><i class="ti ti-trophy"></i>' + escapeHTML(r.stage) + '</div>' +
      '<div class="match-body">' +
        '<div class="match-side"><div class="side-name you">' + ceremony.safeTitle + '</div><div class="side-trait">seu jogo</div></div>' +
        '<div class="match-score">' + r.youScore + ' : ' + r.rivalScore + '</div>' +
        '<div class="match-side right"><div class="side-name">' + escapeHTML(r.rival.name) + '</div><div class="side-trait">' + escapeHTML(r.rival.trait) + '</div></div>' +
      '</div>' +
      '<div class="match-outcome ' + (r.won ? "win" : "lose") + ' show">' + (r.won ? '<i class="ti ti-check"></i>Avança!' : '<i class="ti ti-x"></i>Eliminado') + '</div>';
    b.appendChild(m);
  }

  // sequência narrada — cada etapa agenda a próxima
  function runCeremony() {
    const rounds = ceremony.rounds;
    let i = 0;
    narr('<span class="narr-host">' + escapeHTML(pick(CEREMONY.open)) + '</span>', true);

    function nextStage() {
      if (ceremony.skipped) return;
      if (i >= rounds.length) { return; }
      const r = rounds[i];
      const isFinal = (i === rounds.length - 1);

      // 1) anuncia a etapa
      const lead = isFinal ? pick(CEREMONY.beforeFinal) : pick(CEREMONY.nextCategory);
      narr('<span class="narr-host">' + escapeHTML(lead) + '</span>', true);

      // 2) mostra a categoria/confronto
      later(() => {
        if (ceremony.skipped) return;
        narr('<span class="narr-cat"><i class="ti ti-trophy"></i>' + escapeHTML(r.stage) + '</span><br><br><span class="narr-host">' + ceremony.safeTitle + ' enfrenta ' + escapeHTML(r.rival.name) + ' — ' + escapeHTML(r.rival.trait) + '. ' + escapeHTML(flavorFor(r.youScore - r.rivalScore)) + '</span>');

        // 3) suspense antes do vencedor
        later(() => {
          if (ceremony.skipped) return;
          const phrase = isFinal ? pick(CEREMONY.finalSuspense) : pick(CEREMONY.suspenseWinner);
          narr('<span class="narr-host">' + escapeHTML(phrase) + '...</span> <span class="suspense-dots" id="dots"></span>');
          // reticências animadas
          let dots = 0;
          const dotIv = setInterval(() => {
            const el = $("#dots"); if (!el) { clearInterval(dotIv); return; }
            dots = (dots % 5) + 1; el.textContent = ".".repeat(dots);
          }, ms(260));
          ceremony.timers.push({ _iv: dotIv });

          // 4) revela vencedor
          later(() => {
            clearInterval(dotIv);
            if (ceremony.skipped) return;
            const winnerName = r.won ? state.title : r.rival.name;
            const youWon = r.won;
            narr('<span class="narr-winner"><i class="ti ti-' + (youWon ? "trophy" : "medal") + '"></i>' + escapeHTML(winnerName) + '!</span><br><br><span class="narr-host">' + r.youScore + ' a ' + r.rivalScore + (youWon ? ' — seu jogo avança!' : ' — fim de linha.') + '</span>', true);
            appendMatchCard(r);

            i++;
            if (r.won && i < rounds.length) later(nextStage, ms(1400));
            else later(() => finishCup(rounds, i - 1, ceremony.overall), ms(1400));
          }, ms(1900));
        }, ms(2100));
      }, ms(1700));
    }

    later(nextStage, ms(1900));
  }

  function skipCeremony() {
    if (ceremony.skipped) return;
    ceremony.skipped = true;
    // limpa timers e intervalos pendentes
    ceremony.timers.forEach(t => { if (t && t._iv) clearInterval(t._iv); else clearTimeout(t); });
    ceremony.timers = [];
    // renderiza o bracket inteiro de uma vez
    const b = $("#bracket"); b.innerHTML = ""; $("#bracket-title").style.display = "block";
    let lastIdx = ceremony.rounds.length - 1;
    for (let k = 0; k < ceremony.rounds.length; k++) {
      appendMatchCard(ceremony.rounds[k]);
      if (!ceremony.rounds[k].won) { lastIdx = k; break; }
    }
    narr('<span class="narr-host">Cerimônia encerrada.</span>');
    $("#btn-skip").disabled = true;
    finishCup(ceremony.rounds, lastIdx, ceremony.overall);
  }

  function setActiveSpeedButton(speed) {
    $all(".speed-btn").forEach(btn => btn.classList.toggle("active", btn.getAttribute("data-speed") === speed));
  }

  function finishCup(rounds, lastIdx, playerOverall) {
    const champion = rounds.every(r => r.won);
    const v = $("#verdict-box");
    const safeTitle = escapeHTML(state.title);
    if (champion) {
      v.className = "verdict-box champion";
      v.innerHTML = '<i class="ti ti-trophy verdict-icon"></i><div class="verdict-title">GAME OF THE YEAR!</div><div class="verdict-text">' + safeTitle + ' levou a estatueta máxima. Overall ' + playerOverall + ' venceu a noite inteira.</div>';
    } else {
      const lostTo = escapeHTML(rounds[lastIdx].rival.name);
      v.className = "verdict-box lost";
      v.innerHTML = '<i class="ti ti-medal verdict-icon" style="color:var(--text-2)"></i><div class="verdict-title">INDICADO</div><div class="verdict-text">' + safeTitle + ' caiu para ' + lostTo + ' na ' + escapeHTML(rounds[lastIdx].stage.toLowerCase()) + '. Com overall ' + playerOverall + ', faltou pouco — refine os pontos fracos e a temática.</div>';
    }
    $("#btn-skip").disabled = true;
    later(() => { v.classList.remove("hidden"); $("#btn-restart").classList.remove("hidden"); }, ms(400));
  }

  // ---------- wiring (com proteção) ----------
  function safe(fn) { return function () { try { fn.apply(null, arguments); } catch (e) { console.error("[G0T1]", e); } }; }

  function init() {
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
