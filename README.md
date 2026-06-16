# G0T1 — Jornada ao Game of the Year

> Monte o jogo perfeito e dispute o título de Jogo do Ano.

**[Jogar agora](https://g0t1-game.vercel.app)** · Feito por [ramonscripts](https://github.com/ramonscripts)

---

## O que é este jogo?

G0T1 é um jogo de navegador onde você constrói o seu próprio jogo do zero, herdando atributos de títulos reais indicados ao GOTY (Game of the Year) desde 2016.

A cada rodada, um jogo é sorteado — pode ser um clássico como *Elden Ring*, um indie como *Celeste*, ou até um flop. Você escolhe **um atributo** desse jogo (gráficos, trilha sonora, história, jogabilidade...) e o **posiciona** na vaga correspondente do seu projeto, numa HUD interativa de escalação.

Quando seu jogo estiver completo, você enfrenta a **Jornada ao GOTY**: uma cerimônia de premiação por categoria onde 1º, 2º e 3º lugar somam pontos. Só leva o título de Jogo do Ano quem dominar várias categorias.

---

## Como jogar

1. **Escolha um modo** de jogo na tela inicial.
2. A cada rodada, um jogo é revelado com seus atributos. **Clique no atributo** que quer herdar.
3. O atributo fica selecionado (em destaque dourado) — então **clique na vaga** correspondente na escalação para posicioná-lo.
4. Repita até preencher todas as vagas. Use rerolls para trocar o jogo sorteado se quiser.
5. Dê um **nome e temática** ao seu jogo.
6. Enfrente a **Jornada ao GOTY** e veja se você é campeão!

---

## Modos de jogo

| Modo | Descrição |
|------|-----------|
| **Clássico** | Modo padrão. 3 rerolls disponíveis. |
| **De Almanaque** | Notas dos jogos ficam ocultas durante o draft. |
| **Lendário** | Sem rerolls e sem ver as notas. O mais difícil. |
| **Estúdio Indie** | Só jogos independentes. Vença o Indie do Ano antes de disputar as categorias principais. |

---

## Catálogo

Mais de 100 jogos incluídos: todos os indicados ao GOTY de 2016 a 2025, grandes clássicos, jogos medianos e flops históricos — com notas realistas por categoria.

*Alguns exemplos: Elden Ring, Baldur's Gate 3, The Last of Us Part II, God of War, Sekiro, Celeste, Hollow Knight, Astro Bot, Clair Obscur: Expedition 33...*

---

## Tecnologia

- HTML, CSS e JavaScript puro — sem frameworks, sem build step.
- Zero requisições de rede durante o jogo. Nada que você digita sai do navegador.
- Deploy estático via Vercel.

---

## Rodar localmente

```bash
git clone https://github.com/ramonscripts/g0t1-game.git
cd g0t1-game
python -m http.server 8000
# acesse http://localhost:8000
```

Ou simplesmente abra o `index.html` no navegador.

---

© Direitos Autorais de **ramonscripts** — todos os direitos reservados.
