# Guia para executar o Nexo Office localmente

## 1. Instalar os requisitos

Instale Node.js 22 ou superior. No Windows, abra o PowerShell. No macOS ou Linux, use o terminal.

## 2. Baixar o projeto

Depois que o repositório estiver publicado no GitHub:

```powershell
git clone https://github.com/thomasfarias-afk/nexo-office.git
cd nexo-office
```

Se estiver executando a cópia já existente, abra o terminal na pasta `nexo-office`.

## 3. Instalar dependências e iniciar

```powershell
npm install
npm run dev
```

Acesse o endereço local indicado no terminal (normalmente `http://127.0.0.1:5174`). O Vite também encaminha as chamadas da API ao servidor local durante o desenvolvimento.

## 4. Conectar uma ferramenta de IA

Para executar trabalho em arquivos, instale e autentique Codex CLI ou Claude Code primeiro. Depois, no Nexo Office, abra **Integrações**, escolha o provedor e conecte-o. Selecione uma pasta de trabalho específica para as tarefas.

Também é possível configurar uma API compatível:

```powershell
Copy-Item .env.example .env
notepad .env
```

Preencha as variáveis `AI_BASE_URL`, `AI_API_KEY` e `AI_MODEL`. A chave fica no processo local do servidor e não deve ser incluída em commits.

## 5. Servir a versão de produção

```powershell
npm run build
npm start
```

Abra `http://127.0.0.1:4173`. Para alterar a porta, defina `PORT` no ambiente ou no `.env`.

## Dados locais e cópias de segurança

- A conta, as conversas e o workspace ficam neste navegador.
- O estado do runtime e as pastas de projetos locais ficam em `.nexo-runtime/` e `local-workspaces/`.
- Esses caminhos, arquivos `.env` e pastas de build estão ignorados pelo Git.
- Exporte os dados pela área **Configurações** antes de limpar os dados do navegador ou trocar de dispositivo.

O servidor local escuta em `127.0.0.1`. Não exponha a porta à rede sem configurar autenticação e controles de acesso adequados.
