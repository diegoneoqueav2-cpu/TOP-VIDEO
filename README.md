# TOP VIDEO

Projeto inicial do editor inteligente de vídeos, construído com Remotion e uma interface web responsiva.

## O que já existe

- Base Remotion para composição e renderização de vídeo.
- Composição vertical 1080x1920 a 30 fps.
- Interface web em português, adaptada para celular.
- Seleção de vídeo com pré-visualização local no navegador.
- Campo para instruções de edição, formato de saída e modo de aprovação.
- Organização local do briefing para revisão.

## O que ainda falta

- Envio seguro do vídeo para um servidor.
- Integração com IA para interpretar as instruções e propor um plano real.
- Serviço de renderização Remotion na nuvem.
- Armazenamento temporário e entrega do MP4 final por link.
- Autenticação, limites de tamanho e proteção dos arquivos.

## Pré-visualização da interface

A interface está em `public/`. O arquivo `vercel.json` está configurado para publicar essa pasta como site estático.

Para rodar a composição Remotion em ambiente Node.js:

```bash
npm install
npm run dev
```

**Importante:** a interface atual é um protótipo. O vídeo selecionado fica apenas no navegador; ainda não é enviado nem editado por IA.
