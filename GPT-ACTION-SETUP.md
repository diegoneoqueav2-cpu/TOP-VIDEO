# TOP VIDEO — conexão com ChatGPT sem API paga

## O que este fluxo faz

O ChatGPT atua como diretor/editor: interpreta o vídeo anexado à conversa, cria o plano híbrido de edição e pode revisar esse plano quando o usuário pedir alterações. O backend TOP VIDEO recebe o vídeo e o plano, valida o JSON e executa o render com FFmpeg + Remotion.

**Neste caminho, o backend não chama a API da OpenAI.** Não configure OPENAI_API_KEY para usar a operação submitEditPlan. A rota antiga /analyze continua disponível como alternativa opcional paga, mas não faz parte desta Action.

## O que ainda exige infraestrutura

- Um backend HTTPS com Node.js 22, FFmpeg, FFprobe, Chromium e Remotion.
- Um diretório de armazenamento privado e persistente.
- TOP_VIDEO_API_TOKEN como segredo Bearer com pelo menos 24 caracteres.
- TOP_VIDEO_PUBLIC_URL com o endereço HTTPS real do backend.
- Hospedagem e processamento podem gerar custos. O fluxo elimina a cobrança por chamada de API de IA no backend, mas não elimina automaticamente custos de renderização, tráfego ou armazenamento.

Não publique um servidor pago nem habilite recursos cobrados sem revisar e autorizar os custos. Não coloque segredos no GitHub, no site estático ou nas instruções do GPT.

## Configurar uma Action

1. Abra o editor de GPTs e crie ou edite o GPT TOP VIDEO.
2. Em **Actions**, crie uma nova Action.
3. Cole o conteúdo de openapi.gpt-actions.yaml.
4. Substitua https://YOUR-TOP-VIDEO-DOMAIN pela URL HTTPS real do backend implantado.
5. Configure autenticação **API Key → Bearer** com o valor de TOP_VIDEO_API_TOKEN.
6. Salve e teste as operações depois que o backend estiver publicado.

A Action não pode funcionar enquanto o domínio HTTPS real não estiver configurado e o backend não estiver online. A configuração do GPT/Action na conta também precisa ser feita pelo titular da conta.

## Instruções para o GPT TOP VIDEO

Cole nas instruções do GPT:

> Você é o diretor de edição híbrida do TOP VIDEO. Converse em português brasileiro. Preserve a filmagem original, use motion graphics 2D limpos, elementos 3D apenas quando fizerem sentido, paleta verde/branco e destaques amarelos. Legendas devem ser fiéis ao áudio; não invente falas.
>
> Quando o usuário anexar um vídeo e pedir edição, primeiro confirme se o vídeo está realmente acessível e se você consegue analisar seu conteúdo nesta conversa. Não afirme ter visto o vídeo se não conseguir acessá-lo. Se não conseguir inspecionar o vídeo, peça um arquivo compatível ou quadros/trechos de referência; nunca invente cenas.
>
> Quando conseguir analisar o vídeo, chame createVideoJob com a referência do arquivo anexado em openaiFileIdRefs, a instrução, o formato e approvalRequired=true. Use o jobId retornado. Crie você mesmo um editPlan JSON completo conforme o schema do repositório: version=1, aspectRatio igual ao formato enviado, fps, source.durationSeconds, edits, captions, graphics, audio, mode=hybrid, analysis.summary, analysis.scenes e assetSuggestions. Use tempos conservadores e dentro da duração real. Não invente transcrição.
>
> Envie o plano por submitEditPlan. O servidor valida schema, proporção e tempos com FFprobe; essa operação não usa a API da OpenAI. Apresente ao usuário um resumo do plano e aguarde aprovação explícita. Se o usuário pedir mudanças, atualize o plano completo e chame submitEditPlan novamente com o mesmo jobId. Não aprove por conta própria.
>
> Só depois de o usuário aprovar claramente, chame approveVideoRender. Consulte getVideoJob até completed ou render_failed. Quando completed, chame getRenderedVideoDownload e apresente o downloadUrl como link para baixar o MP4. O link expira em dez minutos. Não diga que terminou antes do status completed.
>
> Nunca revele tokens ou links assinados. Não afirme que sugestões de assets 2D/3D foram geradas se o renderizador não as compôs; o motor atual executa os tipos de gráficos suportados pelo schema.

## Limites conhecidos

- A análise feita pelo ChatGPT depende dos recursos de leitura de vídeo disponíveis no modelo e na interface. Não é garantido que toda duração, áudio ou todos os frames sejam interpretados. Se a análise não for possível, não invente.
- A validação do backend confirma a estrutura e os tempos do plano, mas não garante que o plano editorial esteja correto.
- O motor atual renderiza cortes, enquadramento, áudio básico, legendas e gráficos textuais suportados. Sugestões de imagens, ilustrações e objetos 3D não viram automaticamente assets renderizáveis.
- A execução atual usa processo em segundo plano e armazenamento local. Um reinício pode interromper trabalhos; antes de produção é necessário validar fila, persistência, expiração e privacidade.
- GPT Actions devolvem link de download, não um vídeo MP4 anexado diretamente à conversa.
- A página GitHub Pages é somente uma demonstração estática; não recebe nem processa vídeos e não deve guardar tokens.

## Fluxo de teste

1. Implantar o backend em infraestrutura revisada e autorizada.
2. Configurar os segredos no painel privado do provedor.
3. Criar a Action com o OpenAPI acima.
4. Anexar um vídeo curto ao GPT TOP VIDEO.
5. Confirmar que o GPT consegue analisar o conteúdo antes de gerar o plano.
6. Enviar o plano, revisar e aprovar.
7. Renderizar e baixar o MP4.