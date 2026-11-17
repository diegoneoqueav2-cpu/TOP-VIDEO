# TOP VIDEO

Primeira base do editor de vídeos com IA, usando Remotion.

## Objetivo

Receber um vídeo gravado no celular e instruções em linguagem natural, preparar um plano de edição, renderizar com Remotion e devolver um MP4 para download.

## Estrutura inicial

- Remotion para compor e renderizar vídeos.
- Composição vertical 1080x1920 a 30 fps.
- Camada inicial para vídeo, título e subtítulo.
- Próximas etapas: upload, interpretação das instruções por IA, renderização na nuvem e página de conversa.

## Executar em ambiente Node.js

```bash
npm install
npm run dev
```

Esta é apenas a base inicial. Ainda não está publicada, não recebe uploads e não está conectada a um modelo de IA.
