# Nexo Office

Workspace local para organizar um escritório de agentes, projetos, tarefas e conversas. O projeto usa React, TypeScript, Vite e um servidor Node local para integração com Codex, Claude Code ou uma API compatível.

## Requisitos

- Windows 10/11, macOS ou Linux
- Node.js 22 ou superior e npm
- Para executar tarefas de código: Codex CLI ou Claude Code instalado e autenticado

## Instalação rápida no Windows

Abra o PowerShell na pasta do projeto e execute:

```powershell
npm install
npm run dev
```

Abra o endereço que o Vite mostrar no terminal (por padrão `http://127.0.0.1:5174`). Mantenha o terminal aberto enquanto usa o workspace.

Para gerar a versão de produção e servi-la pelo servidor local:

```powershell
npm run build
npm start
```

Abra `http://127.0.0.1:4173`. O servidor escuta somente no próprio computador.

## Conectar Codex ou Claude Code

1. Instale e autentique o Codex CLI ou Claude Code pelo procedimento oficial do provedor.
2. Abra **Integrações** no Nexo Office.
3. Selecione o provedor e use a opção de conexão. O Nexo detecta o CLI instalado e executa tarefas na pasta local escolhida.
4. Confira a pasta de trabalho antes de iniciar uma tarefa. O Codex e o Claude Code podem ler ou editar arquivos nessa pasta, de acordo com as permissões do provedor.

Para usar uma API compatível em vez de um CLI, copie `.env.example` para `.env`, preencha `AI_BASE_URL`, `AI_API_KEY` e `AI_MODEL` e reinicie o servidor. Mantenha a chave somente no `.env` local; nunca a publique no GitHub.

## Contas e armazenamento

Na primeira visita, um pop-up explica o cadastro e solicita que a pessoa crie uma conta e entre para acessar o escritório. Depois do cadastro, é necessário fazer login. O perfil de conta é local ao navegador e ao dispositivo: não confirma a identidade por e-mail, não sincroniza dispositivos e não oferece recuperação de senha. O workspace e as conversas também ficam no armazenamento local do navegador. Faça exportações em **Configurações** para guardar cópias.

A senha do perfil local é derivada com PBKDF2 e salt antes de ser armazenada no navegador. Esse recurso ajuda a identificar o perfil neste dispositivo, mas não substitui autenticação de servidor nem criptografa os dados do workspace. Qualquer pessoa com acesso ao perfil do navegador ou aos arquivos locais pode acessar os dados.

## Desenvolvimento

```powershell
npm run dev       # Aplicação local com API de desenvolvimento
npm run build     # Verifica TypeScript e gera dist/
npm test          # Executa a suíte de testes
npm run dev:agents
```

Consulte [docs/LOCAL-SETUP.md](docs/LOCAL-SETUP.md) para o passo a passo local e [docs/GUIA-DE-USO.md](docs/GUIA-DE-USO.md) para o guia da conta e do workspace.
