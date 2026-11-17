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


## Inteligência de análise de vídeo — modo Híbrido

A rota autenticada `POST /api/jobs/:id/analyze` inicia a análise do vídeo recebido:

1. FFprobe identifica duração, resolução e taxa de quadros; FFmpeg extrai até 20 quadros distribuídos ao longo do vídeo, cada um identificado com seu instante de captura.
2. O modelo `gpt-transcribe` transcreve o áudio em português quando há faixa de áudio e o arquivo extraído fica dentro do limite de 24 MB.
3. Um modelo com visão (configurável por `OPENAI_VISION_MODEL`, padrão `gpt-4o-mini`) interpreta os quadros com seus tempos, a instrução e a transcrição.
4. O modelo propõe cenas, cortes, legendas, motion graphics e sugestões de imagens/ilustrações/objetos 3D.
5. O JSON é validado contra `schemas/edit-plan.schema.json` e salvo como `edit-plan.json`. O trabalho fica em `awaiting_approval` por padrão.

### Configuração adicional

Defina `OPENAI_API_KEY` somente no ambiente privado do servidor. Opcionalmente, defina `OPENAI_VISION_MODEL`. Instale FFmpeg e FFprobe no servidor. Nunca coloque a chave no navegador, no Git ou em arquivos enviados pelo usuário.

Exemplo de chamada após o upload:

```bash
curl -X POST -H "Authorization: Bearer $TOP_VIDEO_API_TOKEN" \
  http://localhost:8787/api/jobs/ID_DO_TRABALHO/analyze
```

**Limites desta etapa:** a análise usa até 20 quadros amostrados, não uma compreensão contínua de cada frame nem detecção completa de cada corte. A transcrição pode ficar vazia se não houver fala, se o áudio exceder 24 MB ou se o serviço de transcrição falhar; esse aviso fica registrado no diagnóstico do trabalho. A IA gera apenas o plano; a inserção efetiva dos assets, a tela de aprovação e a renderização final ainda serão implementadas nas próximas etapas. O servidor continua sendo uma base local e não deve ser exposto publicamente sem endurecimento de segurança e armazenamento privado.


## Perfil editorial da IA

O comportamento padrão do diretor de edição está centralizado em `server/editor-profile.mjs`. Esse perfil define prioridades, linguagem visual, regras de preservação do conteúdo, critérios para cortes, legendas, motion graphics e uso de elementos 2D/3D. O perfil é carregado pela análise de vídeo e pode ser evoluído sem misturar as regras editoriais com o código de infraestrutura.

A instrução específica enviada pelo usuário continua tendo prioridade sobre o estilo padrão, desde que seja segura e tecnicamente possível. O plano permanece sujeito à aprovação humana.
