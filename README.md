# TOP VIDEO

Projeto inicial do editor inteligente de vídeos, construído com Remotion e uma interface web responsiva.

## O que já existe

- Base Remotion para composição e renderização de vídeo.
- Composição `EditedVideo` para renderização dinâmica de vídeos aprovados com legendas e gráficos animados.
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
- Conexão do GPT ao serviço privado por uma Action/API e publicação do servidor em nuvem.
- Editor conversacional conectado à IA.
- Integração de cenas 3D avançadas com Three.js/React Three Fiber, se necessária.
- Fila persistente, armazenamento privado e testes de renderização em ambiente de produção.
- Entrega do MP4 final diretamente na conversa do GPT, respeitando os limites de anexos da plataforma.
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

**Limitações atuais:** a API ainda depende de hospedagem configurada pelo projeto, usa armazenamento local e autenticação por token de serviço, sem fila persistente nem expiração automática. A análise por IA e o fluxo de aprovação estão descritos nas seções abaixo. Não exponha esta API à internet sem autenticação por usuário, limites operacionais e armazenamento privado.

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

**Limites desta etapa:** a análise usa até 20 quadros amostrados, não uma compreensão contínua de cada frame nem detecção completa de cada corte. A transcrição pode ficar vazia se não houver fala, se o áudio exceder 24 MB ou se o serviço de transcrição falhar; esse aviso fica registrado no diagnóstico do trabalho. A IA gera o plano para aprovação; a composição final usa os elementos textuais aprovados. Imagens, ilustrações e objetos 3D sugeridos ainda não são gerados automaticamente. O servidor continua sendo uma base local e não deve ser exposto publicamente sem endurecimento de segurança e armazenamento privado.


## Perfil editorial da IA

O comportamento padrão do diretor de edição está centralizado em `server/editor-profile.mjs`. Esse perfil define prioridades, linguagem visual, regras de preservação do conteúdo, critérios para cortes, legendas, motion graphics e uso de elementos 2D/3D. O perfil é carregado pela análise de vídeo e pode ser evoluído sem misturar as regras editoriais com o código de infraestrutura.

A instrução específica enviada pelo usuário continua tendo prioridade sobre o estilo padrão, desde que seja segura e tecnicamente possível. O plano permanece sujeito à aprovação humana.


## Aprovação e primeira renderização automática

A API agora tem uma primeira etapa executável de pós-aprovação:

- `POST /api/jobs/:id/approve`: aceita somente trabalhos com plano de edição pronto e inicia a renderização em segundo plano.
- `GET /api/jobs/:id`: informa estados como `awaiting_approval`, `rendering`, `completed` e `render_failed`, além de avisos e resultado técnico.
- `GET /api/jobs/:id/download`: entrega o MP4 final quando o trabalho estiver concluído. A rota exige o mesmo token Bearer.
- `server/render-worker.mjs`: usa FFmpeg para montar os trechos mantidos, ajustar o formato e tratar o áudio; em seguida usa Remotion para renderizar o vídeo final com legendas e gráficos de texto animados.
- `test/render-worker.test.mjs`: verifica a montagem da linha do tempo e a proteção contra um plano que apague o vídeo inteiro.

### Fluxo atual

1. Envie o vídeo com `POST /api/jobs`.
2. Analise com `POST /api/jobs/ID/analyze`.
3. Revise o plano retornado e os avisos.
4. Somente depois de aprovar, chame `POST /api/jobs/ID/approve`.
5. Consulte `GET /api/jobs/ID` até o status ser `completed` ou `render_failed`.
6. Baixe por `GET /api/jobs/ID/download`.

### Limites importantes desta primeira renderização

Esta é uma versão inicial do executor, não um editor profissional completo ainda. A renderização foi integrada em duas etapas: FFmpeg prepara os cortes, o formato e o áudio; Remotion compõe o vídeo final com legendas e gráficos textuais animados. As sugestões de imagens, ilustrações e objetos 3D ainda são registradas no plano, mas não são geradas nem compostas automaticamente. A trilha musical separada também não é adicionada nesta versão. A redução de ruído usa o filtro FFmpeg `afftdn`, que pode alterar a voz; sempre confira o resultado.

A aprovação inicia o render em segundo plano no próprio processo Node. Se o servidor reiniciar durante o trabalho, não existe fila persistente para recuperar automaticamente o render. Para uso real, o servidor precisa ter Node.js, FFmpeg, FFprobe, dependências do Remotion/Chromium e armazenamento persistente. A integração foi adicionada ao código, mas ainda precisa passar por um teste de renderização real em servidor com vídeo válido. O armazenamento atual continua local; não exponha o servidor à internet sem autenticação por usuário, limites, expiração e armazenamento privado.

### Testes

Execute `npm test` para os testes da linha do tempo e use o workflow manual **Testar API TOP VIDEO** na aba Actions para validar sintaxe, schema, proteções e rotas da API. O workflow não testa uma renderização real porque não envia um vídeo válido de produção nem usa uma chave da OpenAI.


## Renderização integrada com Remotion

Após a aprovação, o worker agora executa o seguinte fluxo:

1. FFmpeg prepara um arquivo intermediário com os trechos aprovados, o enquadramento e o áudio.
2. O worker cria um bundle Remotion isolado para o trabalho e disponibiliza o vídeo intermediário como asset privado.
3. A composição `EditedVideo` renderiza o MP4 final com as legendas e os gráficos textuais animados.
4. Os arquivos temporários do bundle são removidos após a renderização bem-sucedida.

A dependência `@remotion/bundler` foi adicionada para permitir o bundle no servidor. **Esta alteração no código não significa que o serviço já esteja hospedado ou que a renderização tenha sido validada em produção.** O próximo teste precisa executar uma renderização real com FFmpeg, Chromium e um vídeo de teste válido.
