# Arquitetura planejada — TOP VIDEO

## Objetivo

Transformar o protótipo atual em um editor de vídeo conversacional. A pessoa envia um vídeo, descreve o resultado desejado em linguagem natural, recebe um plano de edição para aprovar e, só depois da aprovação, solicita a renderização e recebe o MP4.

Este documento descreve a arquitetura-alvo. **Ela ainda não está implementada.** Não há, nesta etapa, upload para servidor, análise por IA, fila de renderização ou entrega automática.

## Fluxo esperado

1. **Entrada:** receber vídeo e instruções do usuário.
2. **Validação:** verificar tipo real do arquivo, tamanho, duração e formato; rejeitar arquivos inválidos.
3. **Plano de edição:** IA transforma o pedido em um plano estruturado, sem editar o vídeo diretamente.
4. **Aprovação:** apresentar cortes, legendas, textos, efeitos, proporção e trilha planejados. Não renderizar enquanto a aprovação estiver pendente.
5. **Renderização:** converter o plano aprovado em propriedades de composição Remotion e executar o render em um worker.
6. **Entrega:** disponibilizar o MP4 por link temporário e permitir sua exclusão.

## Componentes

- **Interface:** experiência mobile-first em português. A interface existente em `public/` é apenas um protótipo local.
- **API:** recebe pedidos, valida permissões e coordena os trabalhos. Deve ser uma API autenticada; não confiar em dados enviados pelo navegador.
- **Armazenamento temporário:** guarda vídeos originais e resultados fora do GitHub, com acesso privado, URLs assinadas e prazo de expiração.
- **Interpretador de pedidos:** camada independente do fornecedor de IA. Recebe instruções e metadados do vídeo e devolve um plano JSON validado.
- **Fila e worker:** processam trabalhos sem manter a conexão do celular aberta.
- **Remotion:** renderiza o vídeo aprovado. Remotion é o motor de composição/renderização, não o interpretador de linguagem natural.
- **Entrega:** retorna estado do trabalho e link temporário do arquivo final.

## Contrato inicial da API (proposta)

Os caminhos abaixo são uma especificação para implementação futura; não existem endpoints ativos neste momento.

### `POST /api/jobs`

Cria um trabalho após autenticação e upload seguro.

Resposta esperada:
```json
{
  "jobId": "identificador",
  "status": "uploaded"
}
```

### `POST /api/jobs/{jobId}/plan`

Solicita a interpretação das instruções. O servidor deve validar o arquivo e produzir um plano estruturado.

Resposta esperada:
```json
{
  "jobId": "identificador",
  "status": "awaiting_approval",
  "plan": {
    "aspectRatio": "9:16",
    "edits": [],
    "captions": [],
    "graphics": [],
    "audio": []
  }
}
```

### `POST /api/jobs/{jobId}/approve`

Confirma explicitamente o plano. Só uma aprovação válida pode colocar o trabalho na fila de renderização.

### `GET /api/jobs/{jobId}`

Consulta estados possíveis: `uploaded`, `planning`, `awaiting_approval`, `queued`, `rendering`, `completed` ou `failed`.

### `GET /api/jobs/{jobId}/download`

Retorna um link temporário para o MP4 quando o trabalho estiver concluído.

### `DELETE /api/jobs/{jobId}`

Solicita a exclusão do original, do resultado e dos dados associados, respeitando os registros operacionais mínimos necessários.

## Regras de segurança e privacidade

- Nunca guardar vídeos, chaves de API ou credenciais no repositório Git.
- Exigir autenticação e autorização em todas as operações de trabalho.
- Usar URLs assinadas com validade curta; não tornar os vídeos públicos.
- Definir limites de tamanho, duração, formatos aceitos e tempo de processamento.
- Validar MIME type e conteúdo do arquivo; não confiar apenas no nome/extensão.
- Isolar cada trabalho e impedir que uma pessoa acesse arquivos de outra.
- Apagar originais e renders automaticamente após prazo definido e oferecer exclusão sob demanda.
- Não enviar vídeo a um provedor de IA sem informar claramente o serviço e a finalidade.
- Não executar código arbitrário produzido pelo modelo. A IA deve retornar um plano JSON limitado a operações permitidas.
- Registrar erros e IDs de trabalho, evitando registrar conteúdo privado ou tokens.

## Decisões para manter o custo controlado

- Começar com vídeos curtos e limites conservadores.
- Separar a análise por IA da renderização; não chamar IA repetidamente durante o render.
- Reutilizar templates Remotion e componentes de motion graphics.
- Medir duração, tamanho e custo de cada etapa antes de abrir o uso.
- Não prometer custo fixo por vídeo até medir armazenamento, processamento e chamadas de IA.

## Integração com o ChatGPT

O repositório GitHub não se conecta automaticamente a esta conversa. Para o ChatGPT enviar vídeos a este editor e receber o resultado, será necessário um serviço/API acessível com autenticação e uma integração compatível. Manter o projeto sem site público é possível durante o desenvolvimento, mas uma integração remota com o ChatGPT precisará de um endpoint acessível de forma segura quando chegar essa fase.

## Etapas de implementação

1. **Contrato e segurança:** definir estados, formatos do plano, limites e ciclo de vida dos arquivos. (documentado aqui)
2. **API mínima:** criar trabalhos, autenticar, receber upload e consultar estado.
3. **Plano com IA:** transformar instruções em JSON validado e apresentar aprovação.
4. **Render worker:** consumir apenas planos aprovados e gerar MP4 com Remotion.
5. **Entrega e limpeza:** link temporário, exclusão e expiração automática.
6. **Integração conversacional:** conectar a API ao ChatGPT quando a base estiver testada.

## Situação atual

O projeto possui uma interface demonstrativa, composições Remotion e um workflow de GitHub Actions que renderiza uma demo. Isso comprova a renderização da composição de demonstração, não o fluxo de edição de vídeos enviados por usuários. Nenhuma etapa de upload privado ou edição automática descrita acima deve ser considerada pronta.
