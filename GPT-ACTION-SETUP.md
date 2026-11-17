# Conectar o TOP VIDEO a um GPT personalizado

## Estado

Este repositório agora contém o contrato OpenAPI e os endpoints necessários para uma Action conversacional. Isso não publica a API nem cria/edita automaticamente um GPT na conta do usuário.

## Preparar o servidor

Hospede o projeto em um serviço HTTPS que suporte Node.js 22, FFmpeg, FFprobe, Chromium e Remotion. Configure no ambiente do servidor:

- `TOP_VIDEO_API_TOKEN`: segredo aleatório com pelo menos 24 caracteres.
- `OPENAI_API_KEY`: chave da API OpenAI usada pelo motor de análise.
- `TOP_VIDEO_PUBLIC_URL`: URL HTTPS pública exata da API, sem barra final.
- `TOP_VIDEO_STORAGE`: diretório de armazenamento persistente e privado.
- Opcional: `OPENAI_VISION_MODEL`.

Não coloque essas chaves no GitHub, no navegador ou nas instruções do GPT. A assinatura do GPT Action e a chave OpenAI usada pelo servidor são credenciais diferentes.

## Criar a Action

1. Abra o editor de GPTs e crie ou edite o GPT TOP VIDEO.
2. Em **Actions**, escolha **Create new action**.
3. Cole o conteúdo de `openapi.gpt-actions.yaml`.
4. Troque `https://YOUR-TOP-VIDEO-DOMAIN` pelo domínio HTTPS real do servidor publicado.
5. Configure Authentication como **API Key → Bearer** e use o valor de `TOP_VIDEO_API_TOKEN`.
6. Salve e teste as operações.

## Instruções para o GPT

Cole este texto nas instruções do GPT:

> Você é o diretor de edição do TOP VIDEO. Converse em português do Brasil. Quando o usuário anexar um vídeo e pedir uma edição, pergunte somente o que estiver faltando. Chame createVideoJob enviando a referência do vídeo anexado em openaiFileIdRefs, o briefing, o formato e approvalRequired=true. Em seguida chame analyzeVideo com o jobId retornado. Explique a análise e apresente o plano de forma clara. Não aprove nem renderize sem aprovação explícita do usuário.
>
> Enquanto o plano estiver aguardando aprovação, trate cada novo pedido do usuário como um comando de revisão e chame reviseVideoPlan com o mesmo jobId e apenas o novo comando. Mostre o plano atualizado e aguarde nova aprovação. Não crie um novo trabalho para cada ajuste.
>
> Só depois de o usuário dizer claramente que aprova, chame approveVideoRender. Consulte getVideoJob periodicamente até status=completed ou render_failed. Quando completed, chame getRenderedVideoDownload e apresente o downloadUrl como link para baixar o MP4. Avise que o link expira em dez minutos; GPT Actions não anexa vídeos diretamente à conversa. Se falhar, explique o erro sem afirmar que o vídeo foi entregue.
>
> Nunca invente análise, progresso, disponibilidade ou conclusão. Preserve o vídeo original e as decisões do plano que não conflitem com os comandos novos. Não revele tokens, URLs assinadas ou segredos.

## Limites conhecidos

- A API ainda usa execução em segundo plano no processo e armazenamento local; reiniciar o servidor pode interromper trabalhos. Para produção, adicione fila persistente e armazenamento privado durável.
- A análise visual usa até 20 quadros amostrados e transcrição; não é uma leitura de todos os frames.
- Os assets sugeridos (ilustrações, imagens e 3D) ainda não são gerados automaticamente; Remotion aplica os gráficos textuais suportados atualmente.
- O MP4 final é entregue por um link HTTPS assinado de dez minutos. A documentação de GPT Actions não permite devolver arquivos de vídeo como anexos da conversa; o GPT apresenta o link para o usuário abrir e baixar o MP4.
