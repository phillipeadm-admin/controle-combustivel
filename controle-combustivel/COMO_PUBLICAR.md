# Como Publicar o Sistema na Vercel (Gratuito com PostgreSQL)

Este guia prático ensina como colocar o seu sistema **Controle de Combustível** no ar usando a **Vercel** para hospedar o site e a **Supabase** para hospedar o banco de dados gratuitamente.

Como a Vercel não possui armazenamento local permanente, o código foi adaptado para usar o banco de dados **PostgreSQL** da Supabase.

## Passo 1: Enviar o código para o GitHub
Para hospedar gratuitamente, o primeiro passo é colocar o seu projeto no GitHub.
1. Crie uma conta no [GitHub](https://github.com/).
2. Baixe e instale o **Git** no seu computador.
3. Na pasta do seu projeto, abra o Terminal e digite:
   ```bash
   git init
   git add .
   git commit -m "Primeira versao com Postgres"
   ```
4. Crie um repositório vazio no GitHub e siga as instruções deles para dar o `git push` do seu código.

## Passo 2: Criar o Banco de Dados (Supabase)
1. Acesse [Supabase.com](https://supabase.com/) e faça login usando o GitHub.
2. Clique em **New Project** (Novo Projeto).
3. Preencha o nome do projeto (ex: `controle-combustivel-db`), escolha uma senha forte para o banco de dados e selecione a região (ex: São Paulo). Clique em **Create new project**.
4. Aguarde alguns minutos até o banco de dados ser criado.
5. Quando terminar, vá no menu esquerdo e clique na engrenagem de **Project Settings** -> **Database**.
6. Procure a seção **Connection String** e escolha a aba **URI**.
7. Copie as duas URLs disponíveis:
   - Desmarque a opção `Use connection pooling` para copiar a **Direct Connection URL** (URL Direta). Ela será usada como `DIRECT_URL`.
   - Marque a opção `Use connection pooling` (se disponível) ou copie a mesma URL e chame de `DATABASE_URL`.
   *Obs: Você precisará substituir o texto `[YOUR-PASSWORD]` na URL pela senha que você criou no momento que fez o projeto.*

## Passo 3: Publicar na Vercel
1. Acesse [Vercel.com](https://vercel.com/) e faça login usando a sua conta do GitHub.
2. No painel inicial, clique em **Add New...** -> **Project**.
3. Encontre o repositório que você criou no passo 1 e clique em **Import**.
4. Na tela de configuração do projeto, expanda a seção **Environment Variables** (Variáveis de Ambiente).
5. Adicione as duas variáveis que você pegou da Supabase:
   - Variável 1 -> Name: `DATABASE_URL` | Value: `[Cole a URL de conexão aqui]`
   - Variável 2 -> Name: `DIRECT_URL` | Value: `[Cole a URL direta aqui]`
6. Clique em **Deploy**.

## Passo 4: O que a Vercel vai fazer?
A Vercel vai baixar o seu código, ler as variáveis de ambiente e rodar o nosso comando preparatório de "build" que eu já deixei configurado (`npx prisma generate && npx prisma db push && next build`).

Isso significa que a Vercel vai automaticamente **criar as tabelas** no seu novo banco de dados da Supabase e publicar o site.

*Se for gerar um erro na primeira vez, tente ir na Vercel em "Redeploy", às vezes as variáveis demoram alguns segundos.*

Pronto! Ao final, a Vercel vai te dar um link (ex: `controle-combustivel.vercel.app`) e seu sistema estará no ar.
