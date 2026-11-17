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

## Arquitetura e próximos passos

A arquitetura planejada para upload privado, interpretação do pedido, aprovação, renderização e entrega está documentada em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md). Esse documento é uma especificação, não a confirmação de que esses serviços já estejam ativos.

**Privacidade:** vídeos de usuários não devem ser enviados ao GitHub. A integração futura deverá usar armazenamento privado temporário, autenticação, links assinados e exclusão dos arquivos. O projeto não foi publicado como site.


## API inicial (nova etapa)

Foi adicionada uma API Node.js em `server/index.mjs` para a primeira etapa do fluxo:

- `GET /health`: verifica se o serviço está ativo.
- `POST /api/jobs`: recebe um vídeo (MP4, MOV, WebM ou MKV), instrução e formato; exige autenticação Bearer.
- `GET /api/jobs/:id`: consulta os metadados do trabalho.
- `DELETE /api/jobs/:id`: exclui os arquivos daquele trabalho.

### Executar localmente

Requer Node.js 20 ou superior:

1. Copie `.env.example` para `.env`.
2. Troque `TOP_VIDEO_API_TOKEN` por um segredo aleatório longo (não compartilhe nem faça commit do arquivo `.env`).
3. Execute `npm install`.
4. Execute `npm run api`.

A API fica em `http://localhost:8787`. Upload máximo atual: 100 MB. Os arquivos são guardados em `storage/jobs`, fora do Git.

**Limitações desta primeira API:** armazenamento local, sem autenticação de usuários além de um token de serviço, sem expiração automática, sem inspeção real do codec/duração, sem IA, sem aprovação implementada e sem renderização. Não exponha esta API à internet nem envie vídeos pessoais para ela antes de configurarmos armazenamento privado, limites operacionais e autenticação adequada.

### Teste automatizado

O workflow manual [Testar API TOP VIDEO](.github/workflows/test-api.yml) exercita saúde, bloqueio sem token, upload, consulta e exclusão usando um arquivo de teste. Abra a aba **Actions**, selecione **Testar API TOP VIDEO** e use **Run workflow**. Isso testa a API no ambiente temporário do GitHub Actions; não publica um servidor permanente.
