# G0T1 — Game of the Year, montado por você

Jogo de navegador inspirado no "7 a 0". A cada rodada, um jogo é sorteado e
você herda **um atributo** dele (gráficos, história, jogabilidade...). Monte
o jogo perfeito juntando pedaços de clássicos e flops, dê nome e temática,
e dispute a Copa GOTY.

## Subir para o GitHub e fazer deploy no Vercel

```bash
git init
git add .
git commit -m "feat: initial G0T1 webapp"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/g0t1.git
git push -u origin main
```

(crie antes um repositório vazio chamado `g0t1` no GitHub, sem README/license,
para não dar conflito no push).

No Vercel:
1. **Add New > Project > Import** e selecione o repositório `g0t1`.
2. Framework Preset: **Other**. Build Command: vazio. Output Directory: vazio/raiz.
3. Deploy. O `vercel.json` já aplica os headers de segurança automaticamente.
4. Todo push futuro no `main` gera um novo deploy automático.

## Arquivos

- `index.html`, `style.css`, `data.js`, `app.js` — código do jogo (edite estes).
- `netlify.toml` / `vercel.json` — configuração de deploy com headers de segurança.


## Rodar localmente

```bash
python -m http.server 8000   # depois acesse http://localhost:8000
```

Ou apenas dê dois cliques em `index.html` (alguns recursos podem pedir um
servidor local dependendo do navegador, mas o jogo é 100% estático).

## Outras formas de hospedar

### Netlify (arrastar e soltar)
1. Entre em https://app.netlify.com e faça login.
2. Vá em **Sites** e arraste a **pasta inteira do projeto** para a área
   "Drag and drop your site output folder here".
3. O `netlify.toml` já aplica os headers de segurança automaticamente.

### GitHub Pages (alternativa)
1. No repositório, vá em **Settings > Pages > Source: Deploy from a branch**,
   escolha `main` / `root`.
2. A URL fica `seu-usuario.github.io/g0t1`.
   (o `.toml`/`.json` não se aplicam aqui, mas o jogo funciona igual).

## Segurança e privacidade

- **Zero rede:** o jogo não faz nenhuma requisição de dados. `connect-src 'none'`
  na CSP bloqueia qualquer tentativa. Nada que você digita sai do navegador.
- **Input sanitizado:** nome e slogan passam por validação (remoção de
  caracteres de controle, limite de tamanho, exigência de alfanumérico) e todo
  texto do jogador é escapado antes de ir pro HTML — sem brecha de XSS.
- **Sem armazenamento externo:** nenhum cookie, nenhum tracker, nenhum
  `localStorage` enviado a lugar nenhum.
- **Proteção de runtime:** handlers críticos rodam dentro de try/catch para o
  jogo não travar com um erro inesperado.
- As únicas conexões externas são para baixar a fonte (Google Fonts) e os
  ícones (Tabler via jsDelivr). Quer 100% offline e self-hosted? Baixe esses
  dois e troque os `@import` no topo do CSS por arquivos locais.

## Editar o catálogo

Tudo em `data.js`:
- Adicionar um jogo: inclua um objeto em `GAMES` com `name`, `tags`, `desc` e
  `stats` (uma nota 0-100 por categoria).
- Nova temática: adicione em `THEMES` com `likes` e `dislikes` (tags).
- Novo modo: adicione em `GAME_MODES` (pesos opcionais por categoria em `weights`).
