// ============================================================
// G0T1 — banco de dados
// Mecânica: sorteia 1 jogo por rodada; o jogador herda UM atributo
// ainda vazio desse jogo. Cada jogo tem nota por atributo (estilo
// crítica/Metacritic), então as notas são realistas e variadas.
// ============================================================

"use strict";

const CATEGORIES = [
  { key: "graficos",     label: "Gráficos",           icon: "ti-photo",            hint: "O visual e a direção de arte." },
  { key: "historia",     label: "História",           icon: "ti-book",             hint: "Roteiro, personagens e narrativa." },
  { key: "jogabilidade", label: "Jogabilidade",       icon: "ti-device-gamepad-2", hint: "Como é a sensação de jogar." },
  { key: "trilha",       label: "Trilha sonora",      icon: "ti-music",            hint: "Música e design de som." },
  { key: "mundo",        label: "Mundo & Exploração", icon: "ti-map",              hint: "O cenário e o que há para explorar." },
  { key: "online",       label: "Modo Online",        icon: "ti-users",            hint: "Multiplayer e vida útil." },
  { key: "inovacao",     label: "Inovação",           icon: "ti-bulb",             hint: "A ousadia de fazer algo novo." },
  { key: "polimento",    label: "Polimento",          icon: "ti-tools",            hint: "Estabilidade e cuidado nos detalhes." }
];

// Cada jogo: stats por categoria (0-100, calibradas como notas de crítica),
// tags (gêneros/temas para afinidade) e um descritor curto.
// Faltando uma stat = aquele jogo não brilha nem é relevante ali (valor médio-baixo).
const GAMES = [
  { name: "The Legend of Zelda: Breath of the Wild", tags: ["open","fantasy"], desc: "Aventura de mundo aberto da Nintendo.",
    stats: { graficos: 91, historia: 84, jogabilidade: 95, trilha: 88, mundo: 97, online: 40, inovacao: 96, polimento: 92 } },
  { name: "Red Dead Redemption 2", tags: ["open","narrative"], desc: "Épico de faroeste da Rockstar.",
    stats: { graficos: 98, historia: 96, jogabilidade: 82, trilha: 90, mundo: 95, online: 68, inovacao: 80, polimento: 88 } },
  { name: "The Witcher 3: Wild Hunt", tags: ["fantasy","open","narrative"], desc: "RPG de fantasia sombria.",
    stats: { graficos: 89, historia: 95, jogabilidade: 80, trilha: 92, mundo: 96, online: 30, inovacao: 78, polimento: 80 } },
  { name: "Elden Ring", tags: ["fantasy","open"], desc: "Soulslike de mundo aberto da FromSoftware.",
    stats: { graficos: 93, historia: 82, jogabilidade: 92, trilha: 87, mundo: 97, online: 74, inovacao: 90, polimento: 85 } },
  { name: "The Last of Us", tags: ["narrative","horror"], desc: "Drama de sobrevivência pós-apocalíptico.",
    stats: { graficos: 90, historia: 96, jogabilidade: 78, trilha: 91, mundo: 70, online: 55, inovacao: 76, polimento: 89 } },
  { name: "God of War (2018)", tags: ["narrative"], desc: "Ação cinematográfica nórdica.",
    stats: { graficos: 94, historia: 92, jogabilidade: 88, trilha: 89, mundo: 78, online: 30, inovacao: 80, polimento: 94 } },
  { name: "Super Mario Odyssey", tags: ["platform"], desc: "Plataforma 3D da Nintendo.",
    stats: { graficos: 86, historia: 60, jogabilidade: 97, trilha: 88, mundo: 82, online: 35, inovacao: 85, polimento: 98 } },
  { name: "Hollow Knight", tags: ["indie","platform"], desc: "Metroidvania indie desenhado à mão.",
    stats: { graficos: 90, historia: 80, jogabilidade: 93, trilha: 89, mundo: 89, online: 20, inovacao: 82, polimento: 91 } },
  { name: "Hades", tags: ["indie","fantasy"], desc: "Roguelike de ação da Supergiant.",
    stats: { graficos: 88, historia: 86, jogabilidade: 95, trilha: 90, mundo: 70, online: 25, inovacao: 84, polimento: 93 } },
  { name: "Celeste", tags: ["indie","platform"], desc: "Plataforma precisa sobre superação.",
    stats: { graficos: 78, historia: 82, jogabilidade: 95, trilha: 90, mundo: 60, online: 20, inovacao: 75, polimento: 95 } },
  { name: "Disco Elysium", tags: ["narrative","indie"], desc: "RPG de investigação narrativa.",
    stats: { graficos: 80, historia: 96, jogabilidade: 70, trilha: 85, mundo: 75, online: 10, inovacao: 93, polimento: 84 } },
  { name: "Portal 2", tags: ["scifi","platform"], desc: "Puzzle em primeira pessoa da Valve.",
    stats: { graficos: 80, historia: 88, jogabilidade: 94, trilha: 82, mundo: 65, online: 75, inovacao: 95, polimento: 96 } },
  { name: "Half-Life 2", tags: ["shooter","scifi"], desc: "FPS narrativo que mudou o gênero.",
    stats: { graficos: 78, historia: 90, jogabilidade: 90, trilha: 80, mundo: 80, online: 50, inovacao: 94, polimento: 96 } },
  { name: "DOOM Eternal", tags: ["shooter","scifi"], desc: "FPS frenético e brutal.",
    stats: { graficos: 84, historia: 52, jogabilidade: 92, trilha: 93, mundo: 60, online: 60, inovacao: 72, polimento: 88 } },
  { name: "Final Fantasy VII", tags: ["fantasy","scifi","narrative"], desc: "JRPG clássico inesquecível.",
    stats: { graficos: 70, historia: 92, jogabilidade: 78, trilha: 94, mundo: 80, online: 20, inovacao: 88, polimento: 78 } },
  { name: "Nier: Automata", tags: ["scifi","narrative"], desc: "Action-RPG existencial.",
    stats: { graficos: 82, historia: 91, jogabilidade: 84, trilha: 97, mundo: 78, online: 25, inovacao: 89, polimento: 76 } },
  { name: "Persona 5 Royal", tags: ["narrative"], desc: "JRPG estiloso de vida dupla.",
    stats: { graficos: 85, historia: 90, jogabilidade: 86, trilha: 94, mundo: 72, online: 20, inovacao: 82, polimento: 90 } },
  { name: "Ghost of Tsushima", tags: ["open","narrative"], desc: "Samurai de mundo aberto.",
    stats: { graficos: 93, historia: 84, jogabilidade: 85, trilha: 88, mundo: 88, online: 60, inovacao: 70, polimento: 89 } },
  { name: "Skyrim", tags: ["fantasy","open"], desc: "RPG de fantasia nórdico imenso.",
    stats: { graficos: 72, historia: 80, jogabilidade: 74, trilha: 90, mundo: 92, online: 20, inovacao: 82, polimento: 58 } },
  { name: "GTA V", tags: ["open","narrative"], desc: "Crime e sátira em mundo aberto.",
    stats: { graficos: 86, historia: 88, jogabilidade: 84, trilha: 82, mundo: 93, online: 84, inovacao: 80, polimento: 82 } },
  { name: "Minecraft", tags: ["open","retro"], desc: "Sandbox de blocos infinito.",
    stats: { graficos: 58, historia: 30, jogabilidade: 86, trilha: 74, mundo: 88, online: 88, inovacao: 96, polimento: 80 } },
  { name: "Stardew Valley", tags: ["indie","retro","coop"], desc: "Simulação de fazenda relaxante.",
    stats: { graficos: 62, historia: 70, jogabilidade: 88, trilha: 80, mundo: 72, online: 76, inovacao: 74, polimento: 90 } },
  { name: "Tetris", tags: ["retro","competitive"], desc: "Quebra-cabeça atemporal.",
    stats: { graficos: 40, historia: 10, jogabilidade: 92, trilha: 70, mundo: 15, online: 65, inovacao: 90, polimento: 88 } },
  { name: "Counter-Strike 2", tags: ["shooter","competitive"], desc: "Tiro tático competitivo.",
    stats: { graficos: 78, historia: 20, jogabilidade: 90, trilha: 55, mundo: 40, online: 93, inovacao: 60, polimento: 80 } },
  { name: "League of Legends", tags: ["competitive"], desc: "MOBA dominante há mais de uma década.",
    stats: { graficos: 70, historia: 50, jogabilidade: 85, trilha: 78, mundo: 45, online: 94, inovacao: 70, polimento: 82 } },
  { name: "Fortnite", tags: ["battle","shooter"], desc: "Battle royale com eventos ao vivo.",
    stats: { graficos: 80, historia: 44, jogabilidade: 84, trilha: 60, mundo: 70, online: 92, inovacao: 82, polimento: 78 } },
  { name: "Rocket League", tags: ["competitive","coop"], desc: "Futebol com carros.",
    stats: { graficos: 72, historia: 15, jogabilidade: 90, trilha: 65, mundo: 30, online: 90, inovacao: 80, polimento: 86 } },
  { name: "It Takes Two", tags: ["coop","platform"], desc: "Aventura cooperativa premiada.",
    stats: { graficos: 84, historia: 78, jogabilidade: 88, trilha: 76, mundo: 70, online: 90, inovacao: 86, polimento: 90 } },
  { name: "Among Us", tags: ["coop","competitive"], desc: "Dedução social caótica.",
    stats: { graficos: 50, historia: 20, jogabilidade: 72, trilha: 45, mundo: 35, online: 82, inovacao: 78, polimento: 74 } },
  { name: "Ocarina of Time", tags: ["fantasy","retro"], desc: "Marco do RPG de ação 3D.",
    stats: { graficos: 60, historia: 86, jogabilidade: 88, trilha: 96, mundo: 84, online: 10, inovacao: 95, polimento: 90 } },
  { name: "Journey", tags: ["indie","narrative"], desc: "Jornada poética e silenciosa.",
    stats: { graficos: 88, historia: 80, jogabilidade: 72, trilha: 95, mundo: 78, online: 70, inovacao: 88, polimento: 92 } },
  { name: "Subnautica", tags: ["scifi","horror","open"], desc: "Sobrevivência em oceano alienígena.",
    stats: { graficos: 80, historia: 74, jogabilidade: 82, trilha: 78, mundo: 90, online: 20, inovacao: 84, polimento: 76 } },
  { name: "Cyberpunk 2077", tags: ["scifi","open"], desc: "RPG futurista (após correções).",
    stats: { graficos: 90, historia: 86, jogabilidade: 80, trilha: 84, mundo: 88, online: 25, inovacao: 78, polimento: 64 } },

  // ---- jogos medianos / com pontos fracos marcantes ----
  { name: "Cyberpunk 2077 (lançamento)", tags: ["scifi","open"], desc: "Lançamento conturbado de 2020.",
    stats: { graficos: 60, historia: 84, jogabilidade: 50, trilha: 80, mundo: 78, online: 20, inovacao: 70, polimento: 26 } },
  { name: "No Man's Sky (lançamento)", tags: ["scifi","open"], desc: "Promessa que decepcionou no início.",
    stats: { graficos: 64, historia: 40, jogabilidade: 60, trilha: 82, mundo: 52, online: 30, inovacao: 80, polimento: 40 } },
  { name: "Fallout 76", tags: ["open","scifi"], desc: "RPG online problemático no lançamento.",
    stats: { graficos: 56, historia: 48, jogabilidade: 54, trilha: 72, mundo: 66, online: 50, inovacao: 50, polimento: 28 } },
  { name: "Anthem", tags: ["scifi","shooter"], desc: "Looter-shooter sem endgame.",
    stats: { graficos: 78, historia: 46, jogabilidade: 70, trilha: 68, mundo: 58, online: 44, inovacao: 52, polimento: 38 } },
  { name: "Battlefield 2042", tags: ["shooter","battle"], desc: "FPS militar incompleto no lançamento.",
    stats: { graficos: 76, historia: 30, jogabilidade: 66, trilha: 58, mundo: 60, online: 48, inovacao: 50, polimento: 34 } },

  // ---- flops históricos (pontos fracos extremos, mas alguma curiosidade) ----
  { name: "Sonic the Hedgehog (2006)", tags: ["platform"], desc: "Lendário pelos bugs.",
    stats: { graficos: 58, historia: 40, jogabilidade: 24, trilha: 74, mundo: 50, online: 20, inovacao: 40, polimento: 18 } },
  { name: "E.T. the Extra-Terrestrial (Atari)", tags: ["retro"], desc: "O flop que quase afundou a indústria.",
    stats: { graficos: 22, historia: 25, jogabilidade: 14, trilha: 30, mundo: 20, online: 0, inovacao: 35, polimento: 16 } },
  { name: "Big Rigs: Over the Road Racing", tags: ["retro"], desc: "Talvez o jogo mais quebrado já lançado.",
    stats: { graficos: 12, historia: 8, jogabilidade: 10, trilha: 12, mundo: 14, online: 0, inovacao: 10, polimento: 6 } },
  { name: "Superman 64", tags: ["open"], desc: "Voar por aros de neblina infinitos.",
    stats: { graficos: 30, historia: 28, jogabilidade: 22, trilha: 24, mundo: 22, online: 0, inovacao: 20, polimento: 18 } },
  { name: "Balan Wonderworld", tags: ["platform"], desc: "Plataforma confusa e mal recebida.",
    stats: { graficos: 48, historia: 42, jogabilidade: 38, trilha: 70, mundo: 44, online: 30, inovacao: 36, polimento: 40 } },
  { name: "Ride to Hell: Retribution", tags: ["open"], desc: "Frequentemente citado entre os piores.",
    stats: { graficos: 30, historia: 18, jogabilidade: 22, trilha: 30, mundo: 28, online: 10, inovacao: 14, polimento: 16 } },
  { name: "Concord", tags: ["shooter","competitive"], desc: "Fechou duas semanas após lançar.",
    stats: { graficos: 74, historia: 40, jogabilidade: 70, trilha: 60, mundo: 50, online: 20, inovacao: 30, polimento: 72 } }
];

// ---------- modos de jogo ----------
const GAME_MODES = [
  { key: "classico",  label: "Clássico",     icon: "ti-eye",            desc: "Notas visíveis. 5 giros para a partida toda.",            showStats: true,  rerolls: 5, rivalBias: 0,  categories: 6 },
  { key: "almanaque", label: "De Almanaque", icon: "ti-eye-off",        desc: "Notas ocultas. 3 giros para a partida toda.",             showStats: false, rerolls: 3, rivalBias: 0,  categories: 6 },
  { key: "lendario",  label: "Lendário",     icon: "ti-flame",          desc: "8 categorias, só 2 giros na partida, rivais mais fortes.",showStats: true,  rerolls: 2, rivalBias: 6,  categories: 8 },
  { key: "indie",     label: "Estúdio Indie",icon: "ti-bulb",           desc: "Orçamento apertado: 4 giros; inovação pesa mais.",        showStats: true,  rerolls: 4, rivalBias: -3, categories: 6,
    weights: { graficos: 0.6, online: 0.7, inovacao: 1.5, jogabilidade: 1.3, historia: 1.1 } }
];

// ---------- temáticas e afinidade ----------
const THEMES = [
  { key: "rpg",      label: "RPG de fantasia",   icon: "ti-sword",          likes: ["fantasy","narrative","open"],     dislikes: ["competitive","battle"] },
  { key: "scifi",    label: "Ficção científica", icon: "ti-rocket",         likes: ["scifi","narrative","shooter"],    dislikes: ["retro"] },
  { key: "horror",   label: "Terror",            icon: "ti-ghost",          likes: ["horror","narrative"],             dislikes: ["coop","competitive"] },
  { key: "open",     label: "Mundo aberto",      icon: "ti-map-2",          likes: ["open","narrative","fantasy"],     dislikes: ["competitive"] },
  { key: "shooter",  label: "Tiro / ação",       icon: "ti-target",         likes: ["shooter","competitive","scifi"],  dislikes: ["narrative"] },
  { key: "indie",    label: "Indie autoral",     icon: "ti-palette",        likes: ["indie","narrative","platform"],   dislikes: ["battle"] },
  { key: "platform", label: "Plataforma",        icon: "ti-stairs-up",      likes: ["platform","indie","retro"],       dislikes: ["shooter","horror"] },
  { key: "battle",   label: "Battle royale",     icon: "ti-swords",         likes: ["battle","shooter","competitive"], dislikes: ["narrative","horror"] },
  { key: "coop",     label: "Cooperativo",       icon: "ti-friends",        likes: ["coop","platform","competitive"],  dislikes: ["horror"] },
  { key: "retro",    label: "Retrô / arcade",    icon: "ti-device-gamepad", likes: ["retro","platform","competitive"], dislikes: ["open","narrative"] }
];

const TITLE_PARTS = {
  prefix: ["Crônicas de","Lendas de","O Despertar de","A Saga","Projeto","Origens de","Ecos de","Império de","A Queda de","Além de"],
  core:   ["Aurora","Babel","Nexus","Wraith","Helix","Ouroboros","Vértigo","Solstício","Atrax","Pyre","Niflheim","Zênite","Kairos","Umbra"],
  suffix: ["","","",": Renascença",": O Último Eco"," Eternal"," II",": Capítulo Final"]
};

const RIVALS = [
  { name: "Astro Bot", power: 89, trait: "queridinho da crítica" },
  { name: "Baldur's Gate 3", power: 95, trait: "favorito absoluto" },
  { name: "Hades II", power: 90, trait: "sucesso de público" },
  { name: "FF VII Rebirth", power: 90, trait: "épico nostálgico" },
  { name: "Helldivers 2", power: 86, trait: "fenômeno coop" },
  { name: "Black Myth: Wukong", power: 88, trait: "estreia avassaladora" },
  { name: "Metaphor: ReFantazio", power: 88, trait: "RPG aclamado" },
  { name: "Split Fiction", power: 86, trait: "coop criativo" },
  { name: "Clair Obscur: Exp. 33", power: 90, trait: "surpresa do ano" },
  { name: "Silksong", power: 92, trait: "lenda há anos esperada" },
  { name: "Monster Hunter Wilds", power: 85, trait: "máquina de vendas" },
  { name: "Ghost of Yotei", power: 87, trait: "sucessor cinematográfico" }
];

const MATCH_FLAVOR = {
  close:   ["Foi por uma fração de voto.","Ninguém respirava nessa hora.","A crítica está dividida.","Decisão apertadíssima do júri."],
  intro:   ["O júri se reúne. O auditório silencia.","Os votos estão sendo contados.","A tensão toma conta da plateia.","O apresentador abre o envelope."],
  blowout: ["Não houve a menor dúvida.","Um domínio absoluto.","O júri foi unânime.","A plateia já sabia o resultado."]
};

// Falas do apresentador da cerimônia (estilo The Game Awards).
const CEREMONY = {
  open: [
    "Senhoras e senhores, bem-vindos à grande cerimônia do Game of the Year!",
    "Boa noite! A indústria inteira está reunida aqui esta noite.",
    "As luzes se acendem. Começa a premiação mais esperada do ano!"
  ],
  nextCategory: [
    "Agora, para a próxima categoria...",
    "Seguimos para o próximo prêmio da noite...",
    "E o envelope seguinte é para...",
    "Atenção, plateia. A próxima categoria é..."
  ],
  suspenseWinner: [
    "E o vencedor é",
    "O júri decidiu. O prêmio vai para",
    "E quem leva a estatueta é",
    "Com a palavra final do júri, vence"
  ],
  beforeFinal: [
    "Chegamos ao momento mais aguardado da noite.",
    "E agora, o prêmio máximo. A categoria que todos esperam.",
    "Silêncio absoluto no auditório. É a hora da verdade."
  ],
  finalSuspense: [
    "E o Game of the Year é",
    "O grande vencedor da noite é",
    "A estatueta máxima vai para"
  ]
};

if (typeof module !== "undefined") {
  module.exports = { CATEGORIES, GAMES, GAME_MODES, THEMES, TITLE_PARTS, RIVALS, MATCH_FLAVOR, CEREMONY };
}
