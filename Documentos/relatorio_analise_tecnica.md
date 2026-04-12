# 🛡️ Relatório de Análise Técnica: Frontend vs. Backend - Ponto Fácil

## ✅ Concluído (Fatos e Implementações)
*   **Entidades Atuais:** Todas as 8 entidades descritas no `agkit_mcp_prompt.json` possuem estrutura correspondente no banco de dados (`init.sql`): `usuario`, `cliente`, `valor_hora_base`, `feriado`, `mes`, `dia` e `intervalo`.
*   **Rotas Implementadas:** As rotas base para os módulos `mes`, `valorHora` e `intervalo` estão criadas e conectadas aos controllers/services correspondentes.
*   **Lógica de Negócio (Core):** 
    *   **Abertura de Mês:** O `mes.service.js` já implementa a criação automática dos dias do mês, classificação (`UTIL`, `SABADO`, `DOMINGO`) e identificação de feriados.
    *   **Cálculo de Horas:** O `intervalo.service.js` realiza o *snapshot* do valor da hora no momento do lançamento e dispara o recálculo em cascata (Dia e Mês) usando Transações SQL.
*   **Arquitetura:** O projeto adota um padrão **Layered Module-based MVC** (Routes -> Controller -> Service -> DB Query via pg).

## PASSO 1: Inventário do Frontend (Stitch Project 9093164475449328539)

### Telas e Fluxos Principais
O projeto Stitch possui **14 telas** cobrindo fluxos Desktop e Mobile:
1.  **Dashboard (M/D):** Visualização de horas meta, realizadas e estimativa financeira.
2.  **Gestão de Clientes (M/D):** Cadastro e listagem de clientes ativos.
3.  **Valor/Hora (M/D):** Histórico de valores e configuração do valor atual (ativo).
4.  **Calendário de Feriados (M/D):** Cadastro de feriados nacionais/locais.
5.  **Lançamento de Horas (Mobile):** O componente principal aqui é o **"Timeline Pulse"** (linha do tempo vertical para intervalos).
6.  **Tabela de Dias (M/D):** Visão detalhada do mês com horas por dia.
7.  **Login (Mobile):** Autenticação simples.

### API Calls Identificadas (Contrato Implícito)
*   **Auth:** `POST /api/login` (Expectativa: `{ token, user: { usuLogin } }`)
*   **Mes/Dashboard:** `GET /api/mes/:anoMes` (Expectativa: `mesAnoMes`, `mesValorHora`, `mesHorasMeta`, etc. em **camelCase**)
*   **Lançamento:** `POST /api/intervalo` (Payload: `{ diaId, cliId, ordem, inicio, fim }`)

---

## PASSO 2: Comparação com Backend Atual

| Tela/Componente | Status Backend | Observação |
| :--- | :---: | :--- |
| **Login Mobile** | ✅ | Módulo `auth_modules` operacional com JWT. |
| **Gestão Clientes** | ✅ | CRUD completo no módulo `cliente`. |
| **Dashboard (Mes)** | ⚠️ | Lógica de cálculo existe, mas o payload está em `snake_case`. |
| **Timeline Pulse** | 🔄 | O backend calcula horas decimais, mas a UI pode precisar de strings formatadas. |
| **Feriados** | ✅ | Módulo `feriado` implementado. |
| **Valor/Hora** | ✅ | Lógica de "desativar anterior e criar novo" implementada. |

---

## PASSO 3: Status das Entidades

| Entidade | Migration | Service | Controller | Rotas |
| :--- | :---: | :---: | :---: | :---: |
| **usuario** | `init.sql` | ✅ | ✅ | ✅ |
| **cliente** | `init.sql` | ✅ | ✅ | ✅ |
| **valorHora**| `init.sql` | ✅ | ✅ | ✅ |
| **feriado** | `init.sql` | ✅ | ✅ | ✅ |
| **mes** | `init.sql` | ✅ | ✅ | ✅ |
| **dia** | `init.sql` | ✅ | ✅ | ✅ |
| **intervalo**| `init.sql` | ✅ | ✅ | ✅ |

---

## PASSO 4: Análise de Riscos e Ajustes Críticos

### ⚠️ Inconsistência de Payload (Bloqueador)
O backend está retornando `mes_ano_mes` e `dia_horas_total`. O Stitch gera código React que consome `mesAnoMes` e `diaHorasTotal`. Sem um middleware de conversão, **o frontend não exibirá os dados**, apesar das rotas estarem funcionando.

### 🔄 Lógica de Cascata
A lógica de `COMMIT/ROLLBACK` em `intervalo.service.js` está correta, garantindo que ao deletar um intervalo, o dia e o mês sejam atualizados atomicamente. Isso mitiga riscos de dados órfãos.

---

## PRÓXIMOS PASSOS (Sem Gerar Código)

1.  **[Prioridade 1] Normalização de Case:** Implementar um middleware global no Express (ou um helper nos controllers) para converter automaticamente todas as chaves de saída do banco para `camelCase`.
2.  **[Prioridade 2] Validação de Zod:** Alinhar os schemas do Zod no backend com os tipos estritos definidos no design system do Stitch (especialmente precisão de `NUMERIC` para horas).
3.  **[Prioridade 3] Estrutura de Migrations:** Migrar o `init.sql` para um sistema de controle de versão (Knex ou similar) para permitir evolução do schema sem perda de dados.
