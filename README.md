# TOP VIDEO

Projeto inicial do editor inteligente de vídeos, construído com Remotion e uma interface web responsiva.

## O que já existe

- Base Remotion para composição e renderização de vídeo.
- Composição principal vertical 1080x1920 a 30 fps.
- Composição de demonstração `MotionDemo` com tipografia e elementos gráficos 2D animados.
- Cubo com seis faces, perspectiva e rotação 3D por transformações CSS.
- Interface web em português, adaptada para celular.
- Seleção de vídeo com pré-visualização local no navegador.
- Campo para instruções de edição, formato de saída e modo de aprovação.
- Organização local do briefing para revisão.

## Como testar a demonstração

No ambiente Node.js do projeto:

```bash
npm install
npx remotion render src/index.ts MotionDemo out/top-video-motion-demo.mp4
```

A composição `MotionDemo` tem 6 segundos, formato vertical 1080x1920 e 30 fps. Ela demonstra motion graphics 2D e um objeto com profundidade 3D simulada por CSS. Não é ainda uma cena 3D renderizada por Three.js.

## O que ainda falta

- Envio seguro do vídeo para um servidor.
- Integração com IA para interpretar as instruções e propor um plano real.
- Editor conversacional conectado à IA.
- Integração de cenas 3D avançadas com Three.js/React Three Fiber, se necessária.
- Serviço de renderização Remotion na nuvem.
- Armazenamento temporário e entrega do MP4 final por link.
- Autenticação, limites de tamanho e proteção dos arquivos.

## Pré-visualização da interface

A interface está em `public/`. O arquivo `vercel.json` está configurado para publicar essa pasta como site estático.

**Importante:** a interface atual é um protótipo. O vídeo selecionado fica apenas no navegador; ainda não é enviado nem editado por IA. A demonstração de motion graphics é uma composição Remotion separada da interface.
