# Arquitetura e estado atual — TOP VIDEO

## Objetivo

O TOP VIDEO é um editor de vídeo assistido por IA em modo híbrido. A IA interpreta a filmagem e as instruções do usuário, prepara um plano estruturado e aguarda aprovação. Após a aprovação, FFmpeg executa os cortes e prepara a mídia; Remotion compõe e renderiza o vídeo final.

Este documento descreve o código existente e separa as partes implementadas das que ainda dependem de infraestrutura.

## Fluxo implementado na API

1. **Upload:** `POST /api/jobs` recebe o vídeo, a instrução do usuário e o formato de saída. Exige token Bearer.
2. **Análise:** `POST /api/jobs/{jobId}/analyze` usa FFprobe/FFmpeg para ler metadados, extrair até 20 quadros distribuídos e extrair o áudio.
3. **Interpretação:** o áudio é transcrito quando possível; um modelo com visão recebe os quadros com seus tempos, a transcrição, o perfil editorial e a instrução do usuário.
4. **Plano:** a IA retorna análise de cenas, cortes, legendas, gráficos e sugestões de assets. O JSON é validado por `schemas/edit-plan.schema.json`.
5. **Aprovação:** o plano fica em `awaiting_approval` por padrão. A aprovação humana é mantida antes da renderização.
6. **Renderização:** `POST /api/jobs/{jobId}/approve` inicia o worker. FFmpeg prepara os trechos e o áudio; Remotion renderiza legendas e gráficos textuais animados.
7. **Consulta e download:** `GET /api/jobs/{jobId}` consulta o estado; `GET /api/jobs/{jobId}/download` entrega o MP4 quando concluído.
8. **Exclusão:** `DELETE /api/jobs/{jobId}` remove os arquivos do trabalho.

Todas as rotas de trabalho exigem o token de serviço configurado em `TOP_VIDEO_API_TOKEN`. `GET /health` é público.

## Interpretação e comandos do usuário

A instrução enviada no upload é incluída diretamente no prompt de análise, junto com o perfil editorial e o conteúdo visual/auditivo extraído. A IA deve respeitar a instrução explícita, preservar o original quando houver dúvida e produzir somente um plano para aprovação.

A análise visual atual usa até 20 quadros amostrados; não é uma leitura contínua de todos os frames. A transcrição é enviada como contexto ao modelo de visão. A transcrição pode falhar ou ser pulada por limite de tamanho; esse estado aparece nos avisos da análise.

## Renderização híbrida

- **FFmpeg/FFprobe:** metadados, extração de quadros e áudio, cortes, concatenação, enquadramento, FPS e redução de ruído opcional.
- **Remotion:** composição final do vídeo intermediário, legendas e gráficos de texto animados.
- **Assets:** sugestões de imagens, ilustrações e objetos 3D são descritas no plano, mas ainda não são geradas automaticamente nesta versão.
- **Áudio:** o áudio original é preservado nos trechos mantidos. A trilha musical separada ainda não é adicionada.

Quando o plano contém trechos explícitos para manter e intervalos para remover, o worker deve subtrair as remoções dos trechos mantidos antes de montar a linha do tempo.

## Interface atual

A interface em `public/` é um protótipo mobile-first: permite selecionar e pré-visualizar um vídeo local e organizar as instruções em um briefing. Ela ainda não envia o arquivo para a API nem mostra o plano de análise. A integração conversacional está preparada via GPT Actions, com upload por `openaiFileIdRefs`, endpoint de comando incremental e entrega do MP4 por link temporário de download; requer backend publicado e configuração manual da Action.

As composições Remotion `Main` e `MotionDemo` continuam disponíveis para demonstrações independentes. `EditedVideo` é a composição usada pelo worker após aprovação.

## Infraestrutura ainda necessária

- Hospedar a API em um ambiente persistente com Node.js, FFmpeg, FFprobe e Chromium compatível com Remotion.
- Configurar `TOP_VIDEO_API_TOKEN` e `OPENAI_API_KEY` como variáveis secretas no servidor.
- Usar armazenamento privado persistente, expiração e fila durável para recuperar trabalhos após reinícios.
- Configurar o GPT Action com `openapi.gpt-actions.yaml`, após publicar a API em HTTPS; as instruções estão em `GPT-ACTION-SETUP.md`.
- A interface web atual ainda não envia vídeos para a API.
- Automatizar a geração/composição dos assets sugeridos e implementar trilha musical quando houver arquivo ou fonte licenciada.
- Validar o ciclo completo com vídeos reais e, depois, a entrega do MP4 dentro da experiência conversacional.

## Integração com GPT Actions

- `POST /api/jobs` aceita `openaiFileIdRefs` e busca com segurança o arquivo temporário anexado à conversa.
- `POST /api/jobs/{id}/command` aplica novos comandos ao plano existente sem iniciar renderização e preserva histórico de comandos.
- `GET /api/jobs/{id}/file-response` devolve `downloadUrl` com link assinado de curta duração; o endpoint `/file` valida a assinatura antes de servir o MP4. GPT Actions não anexa arquivos de vídeo à conversa, então o GPT apresenta o link para download.
- A chave Bearer da Action é `TOP_VIDEO_API_TOKEN`; a chave `OPENAI_API_KEY` fica somente no servidor.
- O contrato está em `openapi.gpt-actions.yaml`; instruções de configuração em `GPT-ACTION-SETUP.md`.

## Testes

- `npm test`: testes unitários da montagem de segmentos e regras de corte.
- `npm run test:render`: cria um vídeo sintético e testa FFmpeg + Remotion até produzir um MP4 final.
- `.github/workflows/test-api.yml`: executa verificações de sintaxe, TypeScript, schema, testes, renderização sintética e smoke tests da API.

Os testes sintéticos não substituem uma validação com vídeo real nem comprovam que o serviço está hospedado. O repositório contém o código; não é, por si só, um servidor ativo.

## Segurança e privacidade

- Não guardar vídeos, chaves de API ou credenciais no GitHub.
- Exigir autenticação nas rotas de trabalho.
- Manter vídeos e resultados fora do repositório, em armazenamento privado.
- Validar tipo real do arquivo, duração, tamanho e conteúdo antes do processamento.
- Não executar código produzido pelo modelo. A IA retorna somente JSON limitado pelo schema.
- Não registrar tokens ou conteúdo privado nos logs.
