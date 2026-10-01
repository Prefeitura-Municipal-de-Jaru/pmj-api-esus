# API de Transparência da Fila de Espera das UBS (e-SUS APS PEC)

API aberta, padronizada e segura para prefeituras e secretarias municipais de saúde publicarem, em portais da transparência, a relação de agendamentos e a fila de espera de consultas e procedimentos da Atenção Primária à Saúde (APS).

O serviço se conecta diretamente ao banco de dados oficial do **e-SUS APS Prontuário Eletrônico do Cidadão (PEC)** desenvolvido pelo Ministério da Saúde.

---

## 1. Visão Geral e Princípios

- **Transparência Pública Ativa:** Permite que o cidadão acompanhe o tempo médio e sua posição estimada na fila da UBS do seu bairro.
- **Conformidade com a LGPD (Lei nº 13.709/2018):**
  - O nome do paciente é anonimizado em nível de banco de dados, exibindo apenas as iniciais (ex.: `M. S. S.`).
  - O Cartão Nacional de Saúde (CNS) tem os dígitos centrais ofuscados (ex.: `123********4567`).
  - Nenhuma informação clínica, diagnóstico, CID ou dado sensível de saúde é retornado pela API.
- **Desempenho e Segurança:** Consultas parametrizadas (proteção contra SQL Injection), limitação de requisições por IP (*Rate Limiting*), cabeçalhos de segurança (*Helmet*) e suporte a *CORS* configurável.

---

## 2. Estrutura do Banco de Dados e-SUS PEC

A API utiliza as seguintes tabelas nativas do PostgreSQL do e-SUS PEC:

| Tabela | Responsabilidade no e-SUS |
| :--- | :--- |
| `tb_agendado` | Registros de agendamentos e status da marcação (`st_agendado = 0`). |
| `tb_prontuario` | Vinculação entre o agendamento e o prontuário do munícipe. |
| `tb_cidadao` | Identificação do cidadão (nome e CNS para anonimização). |
| `tb_lotacao` | Identificação do papel e vinculação do profissional/posto. |
| `tb_unidade_saude` | Cadastro da Unidade Básica de Saúde / Posto de Saúde. |

### Regras de Negócio Aplicadas

1. **Apenas agendamentos vigentes:** `dt_agendado >= CURRENT_DATE`.
2. **Status ativo:** `st_agendado = 0` (aguardando atendimento).
3. **Cálculo de dias de espera:** Diferença exata entre a data agendada e a data de solicitação/criação:
   `CAST(a.dt_agendado AS DATE) - CAST(COALESCE(a.dt_criacao, a.dt_agendado) AS DATE)`.
4. **Ordenação cronológica:** Critério objetivo por data e horário agendado (`dt_agendado ASC, hr_inicial_agendado ASC`).

---

## 3. Endpoints da API

Todas as rotas estão sob o prefixo `/api` (com aliases de compatibilidade em `/api/esus`):

### `GET /api/agendamentos`
Retorna a listagem paginada da fila de espera.

**Parâmetros de consulta (Query Params):**
- `page` (opcional, padrão `1`): Número da página.
- `limit` (opcional, padrão `15`, máximo `10000` para exportação de relatórios): Itens por página.
- `search` (opcional): Filtra por nome do munícipe, CNS ou nome da unidade.
- `unidade` (opcional): ID sequencial da unidade de saúde (`tb_unidade_saude.co_seq_unidade_saude`).

---

## 4. Requisitos

- **Node.js** v20.x ou superior (caso execute diretamente na máquina/VM)
- **PostgreSQL** 9.6 ou superior (versão utilizada pela instalação do e-SUS PEC)
- **Credenciais E-SUS** Você encontra no diretorio do e-sus aonde foi instalado, usar credenciais de leitura.
- Ou **Docker** e **Docker Compose**

---

## 5. Como Configurar e Executar

### 5.1. Configuração do Arquivo `.env`

Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

Preencha os dados de conexão do banco de dados do seu servidor e-SUS PEC:
```env
PORT=3001
NODE_ENV=production

# Dados da base do e-SUS PEC
DB_HOST=ip_do_servidor_esus
DB_PORT=ip_da_porta
DB_NAME=nome_da_base
DB_USER=usuario_do_banco
DB_PASSWORD=senha_do_banco
DB_SSL=false

# Opcional: Se quiser restringir a listagem apenas para certas UBSs do municipio
# Deixe vazio para carregar todas as unidades da base automaticamente
UNIDADES_IDS=

# Seguranca e CORS
CORS_ORIGIN=https://transparencia.seumunicipio.gov.br
RATE_LIMIT_MAX=600
RATE_LIMIT_WINDOW_MINUTES=15
```

---

### 5.2. Executando com Docker (Recomendado para Produção)

Para subir o container em segundo plano:
```bash
docker compose up -d --build
```

Para verificar os logs de execução:
```bash
docker compose logs -f api-ubs
```

---

### 5.3. Executando com Node.js Localmente

Instale as dependências:
```bash
npm install
```

Para modo de desenvolvimento:
```bash
npm run dev
```

Para compilar e iniciar em produção:
```bash
npm run build
npm start
```

---

## 6. Estrutura de Diretórios

O projeto segue arquitetura em camadas com separação clara de responsabilidades:

```
API-UBS/
├── .env.example              # Modelo de configuracao das variaveis de ambiente
├── .gitignore
├── Dockerfile                # Imagem multi-stage otimizada
├── docker-compose.yml        # Orquestracao para deploy imediato
├── LICENSE                   # Licenca MIT
├── package.json
├── README.md                 # Documentacao tecnica completa
├── tsconfig.json             # Configuracao TypeScript estrita
└── src/
    ├── app.ts                # Inicializacao do Express, CORS, Helmet e Middlewares
    ├── server.ts             # Boot do servidor e tratamento de graceful shutdown
    ├── config/
    │   ├── database.ts       # Pool PostgreSQL e teste de conexao
    │   └── env.ts            # Validacao tipada das variaveis de ambiente com Zod
    ├── controllers/
    │   ├── agendamentos.controller.ts
    │   ├── health.controller.ts
    │   └── unidades.controller.ts
    ├── middlewares/
    │   ├── errorHandler.ts   # Tratamento central de erros sem vazamento de dados
    │   ├── rateLimiter.ts    # Protecao contra abusos e DoS
    │   └── requestLogger.ts  # Registro objetivo de requisicoes sem emojis
    ├── repositories/
    │   ├── agendamentos.repository.ts # Queries SQL parametrizadas para o e-SUS PEC
    │   └── unidades.repository.ts     # Consulta das unidades de saude
    ├── routes/
    │   ├── agendamentos.routes.ts
    │   ├── health.routes.ts
    │   ├── index.ts          # Roteador mestre e rotas de compatibilidade
    │   └── unidades.routes.ts
    ├── services/
    │   ├── agendamentos.service.ts    # Regras de negocio, limites e paginacao
    │   └── unidades.service.ts
    └── types/
        ├── agendamento.ts    # Interfaces tipadas de agendamentos e filtros
        ├── pagination.ts     # Tipagem reutilizavel de paginacao
        └── unidade.ts        # Tipagem de unidades de saude
```

---

## 7. Autoria e Créditos

Este projeto é de propriedade da **Prefeitura Municipal de Jaru - RO**, idealizado e desenvolvido pelo **Departamento de Tecnologia da Informação (DTI)**:

- **Desenvolvedor:** Daniel Beling
- **Órgão:** Departamento de Tecnologia da Informação (DTI) — Prefeitura Municipal de Jaru/RO

O código é disponibilizado para livre utilização, replicação e adaptação por quaisquer municípios, estados ou órgãos públicos do Brasil, **sob a condição de que os créditos originais de desenvolvimento e autoria sejam sempre preservados** em todas as versões, bifurcações (forks) e distribuições.

---

## 8. Licença

Este projeto é distribuído sob a licença **MIT** com cláusula expressa de atribuição, garantindo a preservação dos direitos autorais e créditos ao desenvolvedor **Daniel Beling** e à **Prefeitura Municipal de Jaru - RO**. Consulte o arquivo [LICENSE](./LICENSE) para mais detalhes.
