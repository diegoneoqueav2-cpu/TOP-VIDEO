# Publicar o backend TOP VIDEO

## O que esta etapa resolve

A página do GitHub Pages é apenas a interface estática. Ela não executa FFmpeg, Chromium, Remotion nem guarda vídeos. O backend deste repositório faz esse trabalho, mas precisa de um servidor HTTPS ativo.

Foram adicionados:

- `Dockerfile`: instala Node.js 22, FFmpeg/FFprobe, bibliotecas do Chromium e o navegador compatível com Remotion.
- `render.yaml`: blueprint para criar um serviço web com disco persistente no Render.
- `/health`: endpoint de verificação já existente na API.

## Atenção a custos

O blueprint usa uma instância paga e um disco persistente. Isso é intencional: a versão gratuita pode suspender o serviço e não oferece o mesmo armazenamento persistente necessário para guardar uploads e renders. **Não crie o serviço sem conferir o preço e confirmar que aceita esse custo.** Nenhum serviço é criado automaticamente por este repositório.

## Implantação no Render

1. Entre no Render e escolha criar um **Blueprint**.
2. Conecte o repositório `diegoneoqueav2-cpu/TOP-VIDEO`.
3. Confira o conteúdo de `render.yaml`, principalmente o plano `starter` e o disco de 1 GB.
4. Só confirme a criação se estiver de acordo com o custo exibido.
5. Quando o Render pedir `OPENAI_API_KEY`, informe uma chave da API OpenAI. Essa cobrança é separada da assinatura ChatGPT.
6. Aguarde o build Docker e o deploy.
7. Copie o endereço HTTPS público do serviço. No painel do serviço, configure `TOP_VIDEO_PUBLIC_URL` com esse endereço, sem barra no final, e salve.
8. No painel do Render, copie o valor gerado para `TOP_VIDEO_API_TOKEN`. Trate-o como senha: não publique no GitHub, não coloque na página web e não o envie em conversas.
9. Abra `https://SEU-DOMINIO/health`. A resposta esperada contém `"status":"ok"`.

## Conectar a um GPT personalizado

Depois que a API estiver ativa:

1. Abra o GPT TOP VIDEO no editor de GPTs.
2. Em Actions, importe `openapi.gpt-actions.yaml`.
3. Troque o domínio de exemplo pelo domínio HTTPS do Render.
4. Configure autenticação API Key, modo Bearer, com o valor de `TOP_VIDEO_API_TOKEN`.
5. Salve e teste o upload/análise com um vídeo curto.

As instruções completas de comportamento e aprovação estão em `GPT-ACTION-SETUP.md`.

## Limites que continuam existindo

- A análise visual usa até 20 quadros amostrados, não todos os frames do vídeo.
- O áudio é transcrito quando possível, sujeito aos limites e à disponibilidade da API.
- A renderização atual aplica cortes, enquadramento, legendas e gráficos textuais. A geração automática de ilustrações, imagens e objetos 3D sugeridos ainda não está implementada.
- A fila de renderização ainda roda no processo da API. Um reinício durante um render pode interrompê-lo; o disco persistente preserva arquivos, mas não substitui uma fila de tarefas recuperável.
- A página GitHub Pages continua sendo uma demonstração independente. Não exponha o token do backend no JavaScript do navegador.
- Faça primeiro um teste com vídeo curto e sem conteúdo sensível. Confirme o MP4 final antes de usar em trabalhos de clientes.
