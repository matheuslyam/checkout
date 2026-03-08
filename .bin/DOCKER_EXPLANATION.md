# O Guia Definitivo do Docker (Traduzido para Humanos)

Respondendo diretamente ao seu desejo de entender "por trás das cortinas", resolvi preparar este documento detalhado baseado exatamente no arquivo `docker-compose` rico em contêineres que você nos enviou.

Vou explicar o que faz tudo funcionar de forma simples, sem muito "computês".

---

## 1. O básico do básico: O que é um arquivo `.yml`?
YAML (lê-se "iamel" - _YAML Ain't Markup Language_) é apenas uma forma de escrever dados focada inteiramente em **serem fáceis para um humano ler**. Antigamente, se usava muito XML e depois JSON, mas ambos eram poluídos por chaves `{}`, chaves de fechamento, e aspas. 

No `.yml`, o que dita a regra é a **indentação (espaços)**. Se você der um espaço a mais ou a menos, ele quebra tudo. Ele transforma linhas alinhadas em relações de "pai e filho".

---

## 2. A Trindade: Dockerfile, Docker Compose e .dockerignore

O Docker inteiro se baseia em separar a "receita" do "maestro".

### 2.1 O que é o `Dockerfile`? E a diferença dele pro compose?
Pense no `Dockerfile` como a **receita de bolo de uma forma só**. 
Ele se preocupa APENAS com uma tecnologia única. Quando você tem um `Dockerfile` no Next.js do seu Checkout, as instruções lá dentro são apenas para o Next.js:
- _"Comece com um Linux bem leve"_ (`FROM node:18-alpine`)
- _"Copie as coisas da pasta PC para mim"_ (`COPY . .`)
- _"Instale os plugins"_ (`RUN npm install`)
- _"Ligue a luz quando estiver pronto"_ (`CMD ["npm", "run", "dev"]`)

### 2.2 O que é o `docker-compose.yml`?
O `docker-compose` é o **Maestro da Orquestra**. 
Nenhum sistema grande vive de apenas uma tecnologia. Você precisa de um site em Next.js (um Dockerfile), de um Banco MySQL, de um servidor Nginx e talvez de um Redis.
O Composer avisa ao Docker: _"Leia todas as partituras de todos! Suba primeiro o Banco, ligue a corda no App, e bote o Nginx na frente, tudo dessa exata forma."_

### 2.3 Por que ter um `docker-compose.yml` e outro `docker-compose.prod.yml`?
Porque o seu PC e a VPS **se odeiam** nas práticas do software. Eles têm objetivos 100% inversos.
- **No dev (`docker-compose.yml`):** Você está desenvolvendo. Se você salvar um arquivo `Botao.tsx`, a tela precisa atualizar na mesma hora (Hot Reloading). Você quer ferramentas de debug, arquivos expostos, e se der erro, mensagens gigantes listando a quebra de código.
- **Na VPS/Produção (`docker-compose.prod.yml`):** Você **NÃO** quer que ninguém de fora veja logs de erro da sua aplicação, e você quer a versão empacotada (`build`), pré-compilada, e o mais rápida possível. Aqui as coisas são imutáveis e enxutas para economia agressiva de energia e processamento do servidor. O arquivo de dev trava o servidor e o arquivo de prod impede você de editar o site. Por isso temos os dois.

### 2.4 Para que serve o `.dockerignore`?
No seu Windows você instalou a temida pasta `node_modules`. Dentro dela, os pacotes foram compilados pelo V8 para rodar no **Windows**.
Como nós dissemos no passo 2.1, o Docker tenta rodar um **Linux puro** dentro dele. 
Se durante a criação da "receita" do Dockerfile o Docker copiar a SUA pasta `node_modules` para dentro da barriga dele, o código vai rachar, porque a "roda do windows não entra na fechadura do linux". 
O `.dockerignore` fala: _"Ignore a pasta node_modules do dev. Entre na sua barriga Linux e instale tudo de novo do zero no padrão Linux com seu próprio npm install!"_.

---

## 3. Dissecando seu Arquivo Monstro Passo a Passo

No arquivo gigante que mandou, você listou Nginx, PHP, MySQL, evolution_api, e redis. Vamos ver os super-poderes que cada um usa por trás das cortinas:

### 3.1 Nascendo (image vs build)
**`image:`**
```yaml
  db:
    image: mysql:8.0
```
Quando você bota `image: xyz`, você tá dizendo: _"Docker, não tenta processar essa receita do zero, vai lá na nuvem oficial (Docker Hub) e faz o download de um MySQL certinho completo."_

**`build:`**
```yaml
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile
```
Quando tem a tag `build`, significa: _"Docker, esse código aqui eu mesmo criei, não existe na internet. Você vai ter que abrir o 'contexto' (nesta mesma pasta usando o '.') e seguir a minha receita que tá ali dentro de 'docker/Dockerfile'."_

### 3.2 Por que a maldita string `networks` no final de todos eles?
Contêineres do Docker sofrem de isolamento absoluto. Eles não possuem a internet ou a rede local que o seu Windows e Mac possuem; cada um vive num quarto escuro fechado.
Ao colocar:
```yaml
networks:
  - nexus-network
```
O Compose cria um **cabo de ethernet invisível** chamado `nexus-network`. Todos os contêineres que tiverem essa linha lá embaixo passam a viver na mesma rede local "mágica". O mais maravilhoso do Docker é que, graças a essa rede, o Next.js pode se conectar ao banco MySQL acessando o IP fictício apenas passando o NOME DELE. Em vez de ser `http://192.168.0.12`, o link do banco virá apenas `http://db:3306`, porque ambos estão de mãos dadas nesta `network`.

### 3.3 A linha `volumes` (Salvando memórias de vidas passadas)
```yaml
  db:
    volumes:
      - db_data:/var/lib/mysql
```
Contêineres têm severos casos de Alzheimer digital. Se você deletar o contêiner do seu banco de dados, todos os seus usuários no Checkout e transações somem para o éter.
O comando `volumes` cria um **HD Externo de Silicone Virtual**. A gente mapeia o diretório fantasma interno do Docker (`/var/lib/mysql`) e "cola" na porta dele um disco rígido (`db_data`). O banco de dados jura de pés juntos que está salvando internamente, mas está salvando no HD do seu computador debaixo dos panos. Assim, se o contêiner for desligado ou deletado e outro nascer 3 dias depois, ele achará os dados intocados!

### 3.4 depends_on
```yaml
  evolution_api:
    depends_on:
      - redis
      - postgres
```
Alguns microsserviços surtam agressivamente e encerram sozinhos caso liguem e o banco secundário ainda não esteja rodando para atender. O `depends_on` só cria uma "fila de prioridade": Ele obriga o Docker a ficar esperando o Redis e o Postgres subirem totalmente e dizerem "Olha, estou de pé e operante" antes sequer de apertar o botão de Ligar do Whatsapp Evolution API.

### 3.5 healthcheck (O paramédico da UTI)
_Nota: No seu Dockerfile de exemplo não tem o Healthcheck, mas os que aplicamos no checkout (Healthcheck e Retries) servem para isso:_

O Docker é muito inteligente, se o container "capotar" o processo e morrer (Exit 1), o Docker automaticamente ressucita ele (caso tenha `restart: always`).
Acontece que, se o seu site entra num bug cabuloso de "Erro 500 banco de dados lotado", o servidor do Node não processou "Morte Súbita". Ele está rodando. Ligado. O Docker olha pra ele e acha que está tudo fantástico. E você perde clientes e dinheiro.

O `healthcheck` age como um Médico. Nós configuramos ele para injetar um vírus fictício ou dar um `ping` (ex: acessar a URL `/api/health`) a cada 30 segundos. Se o Node responder verde ("Estou respirando!"), o médico anota no prontuário: "Saudável". Se por ventura retornar uma aba vermelha sem fim, o médico do docker avisa o sentinela: *"Olha, a aplicação zumbificou ou entrou em loop, mata e cria uma nova rapidão!"*

--- 

Fiz essa documentação para que da próxima vez que você bater o olho em qualquer `docker-compose.yml`, você consiga ler ele não como código alienígena, mas imaginando exatamente que pecinhas de lego estão sendo construídas, quais discos rígidos estão sendo grudados neles, e quais cabinhos de rede estão conectando quem a quem!
