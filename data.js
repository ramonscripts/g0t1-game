// ============================================================
// G0T1 — banco de dados
// Mecânica: sorteia 1 jogo por rodada; o jogador SELECIONA um
// atributo dele e POSICIONA na vaga correspondente do seu jogo
// (HUD interativa). Cada jogo tem nota por atributo (estilo
// crítica/Metacritic), então as notas são realistas e variadas.
// Catálogo: indicados ao Jogo do Ano (GOTY) de 2016 em diante,
// clássicos atemporais, medianos e flops históricos.
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
// tags (gêneros/temas para afinidade), descritor curto e ano.
// A tag "indie" marca jogos que valem no modo Estúdio Indie.
const GAMES = [
  // ======== clássicos atemporais ========
  { name: "The Legend of Zelda: Breath of the Wild", year: 2017, tags: ["open","fantasy"], desc: "Aventura de mundo aberto da Nintendo.",
    stats: { graficos: 91, historia: 84, jogabilidade: 95, trilha: 88, mundo: 97, online: 40, inovacao: 96, polimento: 92 } },
  { name: "Red Dead Redemption 2", year: 2018, tags: ["open","narrative"], desc: "Épico de faroeste da Rockstar.",
    stats: { graficos: 98, historia: 96, jogabilidade: 82, trilha: 90, mundo: 95, online: 68, inovacao: 80, polimento: 88 } },
  { name: "The Witcher 3: Wild Hunt", year: 2015, tags: ["fantasy","open","narrative"], desc: "RPG de fantasia sombria.",
    stats: { graficos: 89, historia: 95, jogabilidade: 80, trilha: 92, mundo: 96, online: 30, inovacao: 78, polimento: 80 } },
  { name: "Elden Ring", year: 2022, tags: ["fantasy","open"], desc: "Soulslike de mundo aberto da FromSoftware. GOTY 2022.",
    stats: { graficos: 93, historia: 82, jogabilidade: 92, trilha: 87, mundo: 97, online: 74, inovacao: 90, polimento: 85 } },
  { name: "God of War (2018)", year: 2018, tags: ["narrative"], desc: "Ação cinematográfica nórdica. GOTY 2018.",
    stats: { graficos: 94, historia: 92, jogabilidade: 88, trilha: 89, mundo: 78, online: 30, inovacao: 80, polimento: 94 } },
  { name: "Super Mario Odyssey", year: 2017, tags: ["platform"], desc: "Plataforma 3D da Nintendo.",
    stats: { graficos: 86, historia: 60, jogabilidade: 97, trilha: 88, mundo: 82, online: 35, inovacao: 85, polimento: 98 } },
  { name: "Ocarina of Time", year: 1998, tags: ["fantasy","retro"], desc: "Marco do RPG de ação 3D.",
    stats: { graficos: 60, historia: 86, jogabilidade: 88, trilha: 96, mundo: 84, online: 10, inovacao: 95, polimento: 90 } },
  { name: "Final Fantasy VII", year: 1997, tags: ["fantasy","scifi","narrative"], desc: "JRPG clássico inesquecível.",
    stats: { graficos: 70, historia: 92, jogabilidade: 78, trilha: 94, mundo: 80, online: 20, inovacao: 88, polimento: 78 } },
  { name: "Portal 2", year: 2011, tags: ["scifi","platform"], desc: "Puzzle em primeira pessoa da Valve.",
    stats: { graficos: 80, historia: 88, jogabilidade: 94, trilha: 82, mundo: 65, online: 75, inovacao: 95, polimento: 96 } },
  { name: "Half-Life 2", year: 2004, tags: ["shooter","scifi"], desc: "FPS narrativo que mudou o gênero.",
    stats: { graficos: 78, historia: 90, jogabilidade: 90, trilha: 80, mundo: 80, online: 50, inovacao: 94, polimento: 96 } },
  { name: "Skyrim", year: 2011, tags: ["fantasy","open"], desc: "RPG de fantasia nórdico imenso.",
    stats: { graficos: 72, historia: 80, jogabilidade: 74, trilha: 90, mundo: 92, online: 20, inovacao: 82, polimento: 58 } },
  { name: "GTA V", year: 2013, tags: ["open","narrative"], desc: "Crime e sátira em mundo aberto.",
    stats: { graficos: 86, historia: 88, jogabilidade: 84, trilha: 82, mundo: 93, online: 84, inovacao: 80, polimento: 82 } },
  { name: "Minecraft", year: 2011, tags: ["open","retro"], desc: "Sandbox de blocos infinito.",
    stats: { graficos: 58, historia: 30, jogabilidade: 86, trilha: 74, mundo: 88, online: 88, inovacao: 96, polimento: 80 } },
  { name: "Tetris", year: 1984, tags: ["retro","competitive"], desc: "Quebra-cabeça atemporal.",
    stats: { graficos: 40, historia: 10, jogabilidade: 92, trilha: 70, mundo: 15, online: 65, inovacao: 90, polimento: 88 } },

  // ======== indicados ao GOTY — 2016 ========
  { name: "Overwatch", year: 2016, tags: ["shooter","competitive"], desc: "Hero shooter colorido da Blizzard. GOTY 2016.",
    stats: { graficos: 84, historia: 55, jogabilidade: 90, trilha: 78, mundo: 60, online: 94, inovacao: 86, polimento: 90 } },
  { name: "DOOM (2016)", year: 2016, tags: ["shooter","scifi"], desc: "Retorno brutal e veloz do clássico FPS.",
    stats: { graficos: 82, historia: 50, jogabilidade: 92, trilha: 90, mundo: 58, online: 60, inovacao: 78, polimento: 88 } },
  { name: "Inside", year: 2016, tags: ["indie","narrative","platform","horror"], desc: "Puzzle-plataforma sombrio da Playdead.",
    stats: { graficos: 88, historia: 84, jogabilidade: 82, trilha: 86, mundo: 76, online: 10, inovacao: 88, polimento: 92 } },
  { name: "Titanfall 2", year: 2016, tags: ["shooter","scifi"], desc: "FPS de mechs com campanha brilhante.",
    stats: { graficos: 84, historia: 80, jogabilidade: 92, trilha: 78, mundo: 66, online: 82, inovacao: 84, polimento: 90 } },
  { name: "Uncharted 4: A Thief's End", year: 2016, tags: ["narrative"], desc: "Aventura cinematográfica da Naughty Dog.",
    stats: { graficos: 96, historia: 90, jogabilidade: 84, trilha: 86, mundo: 78, online: 60, inovacao: 70, polimento: 94 } },

  // ======== indicados ao GOTY — 2017 ========
  { name: "Horizon Zero Dawn", year: 2017, tags: ["open","scifi","narrative"], desc: "Caçadora contra máquinas em mundo aberto.",
    stats: { graficos: 92, historia: 82, jogabilidade: 84, trilha: 84, mundo: 88, online: 20, inovacao: 82, polimento: 86 } },
  { name: "Persona 5 Royal", year: 2017, tags: ["narrative"], desc: "JRPG estiloso de vida dupla.",
    stats: { graficos: 85, historia: 90, jogabilidade: 86, trilha: 94, mundo: 72, online: 20, inovacao: 82, polimento: 90 } },
  { name: "Cuphead", year: 2017, tags: ["indie","platform","retro"], desc: "Run-and-gun com arte de desenho dos anos 30.",
    stats: { graficos: 92, historia: 50, jogabilidade: 88, trilha: 94, mundo: 50, online: 60, inovacao: 86, polimento: 90 } },
  { name: "PUBG", year: 2017, tags: ["battle","shooter","competitive"], desc: "O battle royale que iniciou a febre.",
    stats: { graficos: 66, historia: 15, jogabilidade: 78, trilha: 50, mundo: 70, online: 88, inovacao: 88, polimento: 58 } },

  // ======== indicados ao GOTY — 2018 ========
  { name: "Celeste", year: 2018, tags: ["indie","platform"], desc: "Plataforma precisa sobre superação.",
    stats: { graficos: 78, historia: 82, jogabilidade: 95, trilha: 90, mundo: 60, online: 20, inovacao: 75, polimento: 95 } },
  { name: "Assassin's Creed Odyssey", year: 2018, tags: ["open","narrative"], desc: "RPG histórico na Grécia antiga.",
    stats: { graficos: 88, historia: 80, jogabilidade: 82, trilha: 82, mundo: 90, online: 30, inovacao: 68, polimento: 80 } },
  { name: "Monster Hunter: World", year: 2018, tags: ["open","coop"], desc: "Caça a monstros gigantes em coop.",
    stats: { graficos: 84, historia: 50, jogabilidade: 88, trilha: 80, mundo: 84, online: 84, inovacao: 76, polimento: 82 } },

  // ======== indicados ao GOTY — 2019 ========
  { name: "Sekiro: Shadows Die Twice", year: 2019, tags: ["fantasy","narrative"], desc: "Ação ninja implacável da FromSoftware. GOTY 2019.",
    stats: { graficos: 86, historia: 76, jogabilidade: 94, trilha: 86, mundo: 82, online: 10, inovacao: 84, polimento: 90 } },
  { name: "Control", year: 2019, tags: ["scifi","narrative"], desc: "Ação paranormal na Casa Mais Antiga.",
    stats: { graficos: 86, historia: 82, jogabilidade: 82, trilha: 84, mundo: 80, online: 15, inovacao: 86, polimento: 78 } },
  { name: "Death Stranding", year: 2019, tags: ["open","scifi","narrative"], desc: "Entregas e conexão num mundo fragmentado.",
    stats: { graficos: 94, historia: 84, jogabilidade: 72, trilha: 92, mundo: 88, online: 60, inovacao: 92, polimento: 82 } },
  { name: "Resident Evil 2 (Remake)", year: 2019, tags: ["horror","narrative"], desc: "Survival horror reimaginado com maestria.",
    stats: { graficos: 90, historia: 80, jogabilidade: 86, trilha: 82, mundo: 70, online: 20, inovacao: 74, polimento: 92 } },
  { name: "Outer Wilds", year: 2019, tags: ["indie","scifi","narrative"], desc: "Exploração espacial em loop temporal.",
    stats: { graficos: 76, historia: 92, jogabilidade: 80, trilha: 90, mundo: 92, online: 10, inovacao: 96, polimento: 84 } },

  // ======== indicados ao GOTY — 2020 ========
  { name: "The Last of Us Part II", year: 2020, tags: ["narrative","horror"], desc: "Drama de vingança pós-apocalíptico. GOTY 2020.",
    stats: { graficos: 96, historia: 88, jogabilidade: 84, trilha: 90, mundo: 76, online: 30, inovacao: 80, polimento: 94 } },
  { name: "Ghost of Tsushima", year: 2020, tags: ["open","narrative"], desc: "Samurai de mundo aberto.",
    stats: { graficos: 93, historia: 84, jogabilidade: 85, trilha: 88, mundo: 88, online: 60, inovacao: 70, polimento: 89 } },
  { name: "Hades", year: 2020, tags: ["indie","fantasy"], desc: "Roguelike de ação da Supergiant.",
    stats: { graficos: 88, historia: 86, jogabilidade: 95, trilha: 90, mundo: 70, online: 25, inovacao: 84, polimento: 93 } },
  { name: "Final Fantasy VII Remake", year: 2020, tags: ["fantasy","scifi","narrative"], desc: "Reimaginação moderna de Midgar.",
    stats: { graficos: 92, historia: 86, jogabilidade: 84, trilha: 94, mundo: 74, online: 20, inovacao: 76, polimento: 88 } },
  { name: "DOOM Eternal", year: 2020, tags: ["shooter","scifi"], desc: "FPS frenético e brutal.",
    stats: { graficos: 84, historia: 52, jogabilidade: 92, trilha: 93, mundo: 60, online: 60, inovacao: 72, polimento: 88 } },
  { name: "Animal Crossing: New Horizons", year: 2020, tags: ["coop","open"], desc: "Vida tranquila numa ilha personalizável.",
    stats: { graficos: 76, historia: 30, jogabilidade: 80, trilha: 78, mundo: 76, online: 72, inovacao: 72, polimento: 88 } },

  // ======== indicados ao GOTY — 2021 ========
  { name: "It Takes Two", year: 2021, tags: ["coop","platform"], desc: "Aventura cooperativa premiada. GOTY 2021.",
    stats: { graficos: 84, historia: 78, jogabilidade: 88, trilha: 76, mundo: 70, online: 90, inovacao: 86, polimento: 90 } },
  { name: "Deathloop", year: 2021, tags: ["shooter","scifi"], desc: "Assassinatos em loop temporal estiloso.",
    stats: { graficos: 84, historia: 80, jogabilidade: 84, trilha: 82, mundo: 76, online: 50, inovacao: 86, polimento: 82 } },
  { name: "Ratchet & Clank: Rift Apart", year: 2021, tags: ["platform","scifi"], desc: "Plataforma com dimensões instantâneas.",
    stats: { graficos: 94, historia: 74, jogabilidade: 86, trilha: 80, mundo: 76, online: 10, inovacao: 82, polimento: 92 } },
  { name: "Resident Evil Village", year: 2021, tags: ["horror","narrative"], desc: "Survival horror gótico e variado.",
    stats: { graficos: 88, historia: 76, jogabilidade: 84, trilha: 82, mundo: 74, online: 30, inovacao: 72, polimento: 88 } },
  { name: "Metroid Dread", year: 2021, tags: ["platform","scifi"], desc: "Metroidvania tenso e refinado.",
    stats: { graficos: 80, historia: 60, jogabilidade: 90, trilha: 78, mundo: 80, online: 10, inovacao: 74, polimento: 90 } },
  { name: "Psychonauts 2", year: 2021, tags: ["platform","narrative"], desc: "Plataforma criativa dentro da mente.",
    stats: { graficos: 84, historia: 86, jogabilidade: 82, trilha: 84, mundo: 78, online: 10, inovacao: 80, polimento: 86 } },

  // ======== indicados ao GOTY — 2022 ========
  { name: "God of War Ragnarök", year: 2022, tags: ["narrative"], desc: "Conclusão épica da saga nórdica.",
    stats: { graficos: 95, historia: 90, jogabilidade: 88, trilha: 90, mundo: 82, online: 20, inovacao: 76, polimento: 94 } },
  { name: "Horizon Forbidden West", year: 2022, tags: ["open","scifi","narrative"], desc: "Continuação exuberante da saga de Aloy.",
    stats: { graficos: 95, historia: 80, jogabilidade: 84, trilha: 84, mundo: 90, online: 20, inovacao: 76, polimento: 86 } },
  { name: "Stray", year: 2022, tags: ["indie","scifi","narrative"], desc: "Um gato numa cidade cyberpunk decadente.",
    stats: { graficos: 84, historia: 76, jogabilidade: 78, trilha: 82, mundo: 80, online: 10, inovacao: 84, polimento: 86 } },
  { name: "Xenoblade Chronicles 3", year: 2022, tags: ["fantasy","narrative"], desc: "JRPG vasto sobre vida e morte.",
    stats: { graficos: 78, historia: 84, jogabilidade: 82, trilha: 90, mundo: 86, online: 30, inovacao: 72, polimento: 78 } },
  { name: "A Plague Tale: Requiem", year: 2022, tags: ["narrative","horror"], desc: "Irmãos fugindo da praga e dos ratos.",
    stats: { graficos: 90, historia: 86, jogabilidade: 76, trilha: 86, mundo: 78, online: 10, inovacao: 72, polimento: 84 } },
  { name: "Tunic", year: 2022, tags: ["indie","fantasy"], desc: "Aventura de raposa com segredos e manual.",
    stats: { graficos: 82, historia: 70, jogabilidade: 84, trilha: 82, mundo: 84, online: 10, inovacao: 88, polimento: 86 } },
  { name: "Vampire Survivors", year: 2022, tags: ["indie","retro"], desc: "Horda automática viciante por centavos.",
    stats: { graficos: 50, historia: 10, jogabilidade: 90, trilha: 78, mundo: 40, online: 20, inovacao: 90, polimento: 80 } },
  { name: "Cult of the Lamb", year: 2022, tags: ["indie"], desc: "Roguelike com gestão de seita fofa e sombria.",
    stats: { graficos: 82, historia: 60, jogabilidade: 84, trilha: 82, mundo: 70, online: 10, inovacao: 82, polimento: 84 } },

  // ======== indicados ao GOTY — 2023 ========
  { name: "Baldur's Gate 3", year: 2023, tags: ["fantasy","narrative","coop"], desc: "RPG de mesa digital colossal. GOTY 2023.",
    stats: { graficos: 88, historia: 96, jogabilidade: 90, trilha: 90, mundo: 92, online: 80, inovacao: 92, polimento: 86 } },
  { name: "Alan Wake 2", year: 2023, tags: ["horror","narrative"], desc: "Terror psicológico entre dois mundos.",
    stats: { graficos: 92, historia: 90, jogabilidade: 78, trilha: 88, mundo: 82, online: 10, inovacao: 90, polimento: 84 } },
  { name: "Marvel's Spider-Man 2", year: 2023, tags: ["open","narrative"], desc: "Dois Homens-Aranha numa Nova York viva.",
    stats: { graficos: 92, historia: 82, jogabilidade: 90, trilha: 84, mundo: 86, online: 20, inovacao: 70, polimento: 88 } },
  { name: "Resident Evil 4 (Remake)", year: 2023, tags: ["horror","narrative"], desc: "Reimaginação impecável do clássico de 2005.",
    stats: { graficos: 90, historia: 82, jogabilidade: 90, trilha: 84, mundo: 76, online: 30, inovacao: 74, polimento: 92 } },
  { name: "Super Mario Bros. Wonder", year: 2023, tags: ["platform","coop"], desc: "Plataforma 2D cheia de surpresas.",
    stats: { graficos: 86, historia: 40, jogabilidade: 94, trilha: 86, mundo: 78, online: 60, inovacao: 86, polimento: 96 } },
  { name: "Zelda: Tears of the Kingdom", year: 2023, tags: ["open","fantasy"], desc: "Sequência criativa de BOTW com construção.",
    stats: { graficos: 88, historia: 82, jogabilidade: 96, trilha: 86, mundo: 97, online: 30, inovacao: 95, polimento: 92 } },
  { name: "Cocoon", year: 2023, tags: ["indie","scifi"], desc: "Puzzle de mundos dentro de orbes.",
    stats: { graficos: 84, historia: 50, jogabilidade: 86, trilha: 82, mundo: 70, online: 10, inovacao: 90, polimento: 92 } },
  { name: "Pizza Tower", year: 2023, tags: ["indie","platform","retro"], desc: "Plataforma frenética de altíssima energia.",
    stats: { graficos: 78, historia: 30, jogabilidade: 92, trilha: 88, mundo: 60, online: 10, inovacao: 86, polimento: 84 } },
  { name: "Dave the Diver", year: 2023, tags: ["indie"], desc: "Mergulho de dia, restaurante de sushi à noite.",
    stats: { graficos: 80, historia: 66, jogabilidade: 88, trilha: 80, mundo: 74, online: 10, inovacao: 88, polimento: 88 } },

  // ======== indicados ao GOTY — 2024 ========
  { name: "Astro Bot", year: 2024, tags: ["platform","coop"], desc: "Plataforma 3D encantadora da PlayStation. GOTY 2024.",
    stats: { graficos: 90, historia: 50, jogabilidade: 94, trilha: 88, mundo: 80, online: 20, inovacao: 86, polimento: 96 } },
  { name: "Balatro", year: 2024, tags: ["indie","competitive","retro"], desc: "Roguelike de pôquer absurdamente viciante.",
    stats: { graficos: 70, historia: 10, jogabilidade: 96, trilha: 80, mundo: 30, online: 30, inovacao: 94, polimento: 92 } },
  { name: "Black Myth: Wukong", year: 2024, tags: ["fantasy","narrative"], desc: "Ação-RPG baseado na Jornada ao Oeste.",
    stats: { graficos: 94, historia: 80, jogabilidade: 88, trilha: 86, mundo: 84, online: 10, inovacao: 80, polimento: 82 } },
  { name: "Elden Ring: Shadow of the Erdtree", year: 2024, tags: ["fantasy","open"], desc: "Expansão monumental do GOTY 2022.",
    stats: { graficos: 92, historia: 82, jogabilidade: 92, trilha: 88, mundo: 95, online: 70, inovacao: 84, polimento: 86 } },
  { name: "Final Fantasy VII Rebirth", year: 2024, tags: ["fantasy","scifi","narrative","open"], desc: "Segundo ato grandioso da remake trilogy.",
    stats: { graficos: 92, historia: 88, jogabilidade: 86, trilha: 95, mundo: 90, online: 20, inovacao: 80, polimento: 86 } },
  { name: "Metaphor: ReFantazio", year: 2024, tags: ["fantasy","narrative"], desc: "JRPG de fantasia política do time de Persona.",
    stats: { graficos: 84, historia: 90, jogabilidade: 86, trilha: 92, mundo: 80, online: 20, inovacao: 84, polimento: 88 } },
  { name: "Animal Well", year: 2024, tags: ["indie","platform"], desc: "Metroidvania misterioso de um só desenvolvedor.",
    stats: { graficos: 80, historia: 40, jogabilidade: 88, trilha: 78, mundo: 86, online: 10, inovacao: 90, polimento: 88 } },

  // ======== indicados ao GOTY — 2025 ========
  { name: "Clair Obscur: Expedition 33", year: 2025, tags: ["indie","fantasy","narrative"], desc: "RPG francês deslumbrante. GOTY 2025.",
    stats: { graficos: 90, historia: 94, jogabilidade: 88, trilha: 96, mundo: 84, online: 10, inovacao: 92, polimento: 84 } },
  { name: "Hollow Knight: Silksong", year: 2025, tags: ["indie","platform"], desc: "A aguardadíssima sequência de Hornet.",
    stats: { graficos: 90, historia: 80, jogabilidade: 94, trilha: 90, mundo: 90, online: 10, inovacao: 84, polimento: 92 } },
  { name: "Death Stranding 2: On the Beach", year: 2025, tags: ["open","scifi","narrative"], desc: "Continuação ainda mais ambiciosa de Kojima.",
    stats: { graficos: 96, historia: 86, jogabilidade: 78, trilha: 92, mundo: 90, online: 60, inovacao: 90, polimento: 88 } },
  { name: "Kingdom Come: Deliverance II", year: 2025, tags: ["open","narrative"], desc: "RPG medieval realista e imersivo.",
    stats: { graficos: 88, historia: 90, jogabilidade: 82, trilha: 84, mundo: 90, online: 10, inovacao: 78, polimento: 80 } },
  { name: "Ghost of Yotei", year: 2025, tags: ["open","narrative"], desc: "Sucessor espiritual de Tsushima.",
    stats: { graficos: 94, historia: 84, jogabilidade: 86, trilha: 88, mundo: 90, online: 30, inovacao: 72, polimento: 90 } },
  { name: "Split Fiction", year: 2025, tags: ["coop","narrative"], desc: "Aventura coop entre sci-fi e fantasia.",
    stats: { graficos: 86, historia: 80, jogabilidade: 90, trilha: 80, mundo: 78, online: 90, inovacao: 88, polimento: 92 } },
  { name: "Donkey Kong Bananza", year: 2025, tags: ["platform","coop"], desc: "Plataforma destrutível em 3D da Nintendo.",
    stats: { graficos: 86, historia: 40, jogabilidade: 92, trilha: 84, mundo: 84, online: 30, inovacao: 86, polimento: 92 } },
  { name: "Monster Hunter Wilds", year: 2025, tags: ["open","coop"], desc: "Caçadas ainda mais grandiosas e vivas.",
    stats: { graficos: 88, historia: 56, jogabilidade: 88, trilha: 82, mundo: 86, online: 86, inovacao: 78, polimento: 76 } },
  { name: "Hades II", year: 2025, tags: ["indie","fantasy"], desc: "Sequência do aclamado roguelike de ação.",
    stats: { graficos: 90, historia: 84, jogabilidade: 94, trilha: 92, mundo: 74, online: 25, inovacao: 82, polimento: 90 } },

  // ======== outros clássicos cultuados ========
  { name: "The Last of Us", year: 2013, tags: ["narrative","horror"], desc: "Drama de sobrevivência pós-apocalíptico.",
    stats: { graficos: 90, historia: 96, jogabilidade: 78, trilha: 91, mundo: 70, online: 55, inovacao: 76, polimento: 89 } },
  { name: "Hollow Knight", year: 2017, tags: ["indie","platform"], desc: "Metroidvania indie desenhado à mão.",
    stats: { graficos: 90, historia: 80, jogabilidade: 93, trilha: 89, mundo: 89, online: 20, inovacao: 82, polimento: 91 } },
  { name: "Disco Elysium", year: 2019, tags: ["narrative","indie"], desc: "RPG de investigação narrativa.",
    stats: { graficos: 80, historia: 96, jogabilidade: 70, trilha: 85, mundo: 75, online: 10, inovacao: 93, polimento: 84 } },
  { name: "Nier: Automata", year: 2017, tags: ["scifi","narrative"], desc: "Action-RPG existencial.",
    stats: { graficos: 82, historia: 91, jogabilidade: 84, trilha: 97, mundo: 78, online: 25, inovacao: 89, polimento: 76 } },
  { name: "Stardew Valley", year: 2016, tags: ["indie","retro","coop"], desc: "Simulação de fazenda relaxante.",
    stats: { graficos: 62, historia: 70, jogabilidade: 88, trilha: 80, mundo: 72, online: 76, inovacao: 74, polimento: 90 } },
  { name: "Journey", year: 2012, tags: ["indie","narrative"], desc: "Jornada poética e silenciosa.",
    stats: { graficos: 88, historia: 80, jogabilidade: 72, trilha: 95, mundo: 78, online: 70, inovacao: 88, polimento: 92 } },
  { name: "Undertale", year: 2015, tags: ["indie","retro","narrative"], desc: "RPG que quebra as regras com coração.",
    stats: { graficos: 50, historia: 92, jogabilidade: 78, trilha: 95, mundo: 60, online: 10, inovacao: 94, polimento: 86 } },
  { name: "Subnautica", year: 2018, tags: ["scifi","horror","open"], desc: "Sobrevivência em oceano alienígena.",
    stats: { graficos: 80, historia: 74, jogabilidade: 82, trilha: 78, mundo: 90, online: 20, inovacao: 84, polimento: 76 } },
  { name: "Cyberpunk 2077", year: 2020, tags: ["scifi","open"], desc: "RPG futurista (após correções).",
    stats: { graficos: 90, historia: 86, jogabilidade: 80, trilha: 84, mundo: 88, online: 25, inovacao: 78, polimento: 64 } },

  // ======== competitivos / multiplayer ========
  { name: "Counter-Strike 2", year: 2023, tags: ["shooter","competitive"], desc: "Tiro tático competitivo.",
    stats: { graficos: 78, historia: 20, jogabilidade: 90, trilha: 55, mundo: 40, online: 93, inovacao: 60, polimento: 80 } },
  { name: "League of Legends", year: 2009, tags: ["competitive"], desc: "MOBA dominante há mais de uma década.",
    stats: { graficos: 70, historia: 50, jogabilidade: 85, trilha: 78, mundo: 45, online: 94, inovacao: 70, polimento: 82 } },
  { name: "Fortnite", year: 2017, tags: ["battle","shooter"], desc: "Battle royale com eventos ao vivo.",
    stats: { graficos: 80, historia: 44, jogabilidade: 84, trilha: 60, mundo: 70, online: 92, inovacao: 82, polimento: 78 } },
  { name: "Rocket League", year: 2015, tags: ["competitive","coop"], desc: "Futebol com carros.",
    stats: { graficos: 72, historia: 15, jogabilidade: 90, trilha: 65, mundo: 30, online: 90, inovacao: 80, polimento: 86 } },
  { name: "Among Us", year: 2018, tags: ["coop","competitive"], desc: "Dedução social caótica.",
    stats: { graficos: 50, historia: 20, jogabilidade: 72, trilha: 45, mundo: 35, online: 82, inovacao: 78, polimento: 74 } },

  // ======== medianos / pontos fracos marcantes ========
  { name: "Cyberpunk 2077 (lançamento)", year: 2020, tags: ["scifi","open"], desc: "Lançamento conturbado de 2020.",
    stats: { graficos: 60, historia: 84, jogabilidade: 50, trilha: 80, mundo: 78, online: 20, inovacao: 70, polimento: 26 } },
  { name: "No Man's Sky (lançamento)", year: 2016, tags: ["scifi","open"], desc: "Promessa que decepcionou no início.",
    stats: { graficos: 64, historia: 40, jogabilidade: 60, trilha: 82, mundo: 52, online: 30, inovacao: 80, polimento: 40 } },
  { name: "Fallout 76", year: 2018, tags: ["open","scifi"], desc: "RPG online problemático no lançamento.",
    stats: { graficos: 56, historia: 48, jogabilidade: 54, trilha: 72, mundo: 66, online: 50, inovacao: 50, polimento: 28 } },
  { name: "Anthem", year: 2019, tags: ["scifi","shooter"], desc: "Looter-shooter sem endgame.",
    stats: { graficos: 78, historia: 46, jogabilidade: 70, trilha: 68, mundo: 58, online: 44, inovacao: 52, polimento: 38 } },
  { name: "Battlefield 2042", year: 2021, tags: ["shooter","battle"], desc: "FPS militar incompleto no lançamento.",
    stats: { graficos: 76, historia: 30, jogabilidade: 66, trilha: 58, mundo: 60, online: 48, inovacao: 50, polimento: 34 } },

  // ======== flops históricos ========
  { name: "Sonic the Hedgehog (2006)", year: 2006, tags: ["platform"], desc: "Lendário pelos bugs.",
    stats: { graficos: 58, historia: 40, jogabilidade: 24, trilha: 74, mundo: 50, online: 20, inovacao: 40, polimento: 18 } },
  { name: "E.T. the Extra-Terrestrial (Atari)", year: 1982, tags: ["retro"], desc: "O flop que quase afundou a indústria.",
    stats: { graficos: 22, historia: 25, jogabilidade: 14, trilha: 30, mundo: 20, online: 0, inovacao: 35, polimento: 16 } },
  { name: "Big Rigs: Over the Road Racing", year: 2003, tags: ["retro"], desc: "Talvez o jogo mais quebrado já lançado.",
    stats: { graficos: 12, historia: 8, jogabilidade: 10, trilha: 12, mundo: 14, online: 0, inovacao: 10, polimento: 6 } },
  { name: "Superman 64", year: 1999, tags: ["open"], desc: "Voar por aros de neblina infinitos.",
    stats: { graficos: 30, historia: 28, jogabilidade: 22, trilha: 24, mundo: 22, online: 0, inovacao: 20, polimento: 18 } },
  { name: "Balan Wonderworld", year: 2021, tags: ["platform"], desc: "Plataforma confusa e mal recebida.",
    stats: { graficos: 48, historia: 42, jogabilidade: 38, trilha: 70, mundo: 44, online: 30, inovacao: 36, polimento: 40 } },
  { name: "Ride to Hell: Retribution", year: 2013, tags: ["open"], desc: "Frequentemente citado entre os piores.",
    stats: { graficos: 30, historia: 18, jogabilidade: 22, trilha: 30, mundo: 28, online: 10, inovacao: 14, polimento: 16 } },
  { name: "Concord", year: 2024, tags: ["shooter","competitive"], desc: "Fechou duas semanas após lançar.",
    stats: { graficos: 74, historia: 40, jogabilidade: 70, trilha: 60, mundo: 50, online: 20, inovacao: 30, polimento: 72 } }
];

// ---------- modos de jogo ----------
// rerolls: giros para a PARTIDA inteira (quanto menor, mais difícil).
// showStats: mostra as notas por atributo durante o draft.
// indieOnly: catálogo restrito a indies + disputa de Jogo Indie do Ano.
const GAME_MODES = [
  { key: "classico",  label: "Clássico",      icon: "ti-eye",     desc: "Notas visíveis. 3 giros para a partida toda.",                 showStats: true,  rerolls: 3, rivalBias: 3,  categories: 6 },
  { key: "almanaque", label: "De Almanaque",  icon: "ti-eye-off", desc: "Notas ocultas. Só 2 giros para a partida inteira.",            showStats: false, rerolls: 2, rivalBias: 5,  categories: 6 },
  { key: "lendario",  label: "Lendário",      icon: "ti-flame",   desc: "8 categorias, ZERO giros, notas ocultas e jurados durões.",    showStats: false, rerolls: 0, rivalBias: 6,  categories: 8 },
  { key: "indie",     label: "Estúdio Indie", icon: "ti-bulb",    desc: "Só jogos indies. Vença o Indie do Ano antes das categorias.",  showStats: true,  rerolls: 2, rivalBias: -2, categories: 6, indieOnly: true,
    weights: { graficos: 0.6, online: 0.7, inovacao: 1.5, jogabilidade: 1.3, historia: 1.1 } }
];

// ---------- premiação por categoria ----------
// Pontos por posição no pódio de cada categoria.
const AWARD_POINTS = { first: 10, second: 6, third: 3 };
// Quantos rivais disputam cada categoria contra o jogador.
const NOMINEES_PER_CATEGORY = 3;

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

// ---------- gerador de nomes (mais variado e evocativo) ----------
const TITLE_PARTS = {
  // padrões: cada função monta um nome a partir das listas abaixo
  patterns: [
    (p) => p.prefix() + " " + p.core(),
    (p) => p.core() + p.suffix(),
    (p) => p.adjective() + " " + p.core(),
    (p) => p.core() + ": " + p.subtitle(),
    (p) => p.prefix() + " " + p.core() + p.suffix(),
    (p) => p.core() + " " + p.numeral(),
    (p) => "O " + p.noun() + " de " + p.core(),
    (p) => p.core() + " & " + p.coreB()
  ],
  prefix: ["Crônicas de","Lendas de","O Despertar de","A Saga de","Projeto","Origens de","Ecos de","Império de","A Queda de","Além de","O Código","Vigília de","Relíquias de","O Juramento de","Cinzas de"],
  core: ["Aurora","Babel","Nexus","Wraith","Helix","Ouroboros","Vértigo","Solstício","Atrax","Pyre","Niflheim","Zênite","Kairos","Umbra","Aether","Mirage","Vanguard","Eclipse","Chronos","Seraph","Obsidian","Lúmen","Tempest","Astralis"],
  adjective: ["Eterno","Sombrio","Carmesim","Infinito","Esquecido","Selvagem","Fraturado","Radiante","Silencioso","Último"],
  noun: ["Reino","Trono","Véu","Abismo","Farol","Labirinto","Santuário","Horizonte","Oráculo","Exílio"],
  subtitle: ["Renascença","O Último Eco","Almas de Ferro","A Hora Final","Despertar","Fronteira Quebrada","O Ciclo Eterno","Sombras do Norte","A Tempestade","Vozes do Vazio"],
  suffix: ["",": Renascença",": O Último Eco"," Eternal"," II",": Capítulo Final"," Reborn",": Origens"],
  numeral: ["II","III","IV","Zero","X","Saga","Origins"]
};

// ---------- rivais (jurados/concorrentes nas categorias) ----------
const RIVALS = [
  { name: "Astro Bot", power: 90, trait: "queridinho da crítica" },
  { name: "Baldur's Gate 3", power: 96, trait: "favorito absoluto" },
  { name: "FF VII Rebirth", power: 90, trait: "épico nostálgico" },
  { name: "Black Myth: Wukong", power: 89, trait: "estreia avassaladora" },
  { name: "Metaphor: ReFantazio", power: 89, trait: "RPG aclamado" },
  { name: "Clair Obscur: Exp. 33", power: 93, trait: "surpresa do ano" },
  { name: "Death Stranding 2", power: 90, trait: "ambição de Kojima" },
  { name: "Ghost of Yotei", power: 88, trait: "sucessor cinematográfico" },
  { name: "Monster Hunter Wilds", power: 86, trait: "máquina de vendas" },
  { name: "Split Fiction", power: 87, trait: "coop criativo" },
  { name: "Donkey Kong Bananza", power: 86, trait: "destruição da Nintendo" },
  { name: "Kingdom Come II", power: 87, trait: "imersão medieval" }
];

// ---------- rivais indies (disputa de Jogo Indie do Ano) ----------
const INDIE_RIVALS = [
  { name: "Hades II", power: 90, trait: "roguelike refinado" },
  { name: "Hollow Knight: Silksong", power: 92, trait: "lenda há anos esperada" },
  { name: "Balatro", power: 91, trait: "vício instantâneo" },
  { name: "Clair Obscur: Exp. 33", power: 93, trait: "joia francesa" },
  { name: "Animal Well", power: 86, trait: "obra de um só dev" },
  { name: "Pizza Tower", power: 84, trait: "energia pura" },
  { name: "Cocoon", power: 85, trait: "puzzle elegante" },
  { name: "Dave the Diver", power: 84, trait: "mistura inesperada" }
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
  podiumIntro: [
    "Veja como ficou o pódio:",
    "Os indicados desta categoria são fortíssimos:",
    "O júri avaliou e decidiu:",
    "Eis a disputa nesta categoria:"
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
  ],
  indieIntro: [
    "Primeiro, o prêmio de Jogo Indie do Ano. Só os independentes disputam aqui.",
    "Antes das categorias principais: quem leva o Indie do Ano?",
    "A noite começa com a categoria mais autoral: Jogo Indie do Ano."
  ]
};

if (typeof module !== "undefined") {
  module.exports = {
    CATEGORIES, GAMES, GAME_MODES, AWARD_POINTS, NOMINEES_PER_CATEGORY,
    THEMES, TITLE_PARTS, RIVALS, INDIE_RIVALS, MATCH_FLAVOR, CEREMONY
  };
}
