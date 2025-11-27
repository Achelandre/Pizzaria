# 🍕 Pizzaria - Sistema de Gerenciamento

Um sistema completo e moderno para gerenciar uma pizzaria, incluindo controle de clientes, produtos, pedidos e geração de relatórios em tempo real.

## 📋 Funcionalidades

- **👥 Gestão de Clientes**: Cadastre e manage informações de clientes, incluindo histórico de pedidos
- **🍔 Cadastro de Produtos**: Organize produtos por categoria (Pizzas, Refrigerantes, Sobremesas)
- **📦 Sistema de Pedidos**: Crie pedidos, acompanhe status e registre formas de pagamento
- **📊 Relatórios Avançados**: Gere análises de vendas, produtos mais populares e faturamento
- **🎨 Interface Moderna**: Layout responsivo e intuitivo com design profissional
- **⚡ Aplicação Rápida**: Tecnologia web moderna com TypeScript compilado

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Estilo moderno e responsivo (Poppins font)
- **JavaScript/TypeScript** - Interatividade dinâmica

### Backend
- **Node.js** - Runtime JavaScript
- **TypeScript** - Tipagem estática para maior segurança
- **File System (CSV)** - Persistência de dados em arquivos

### Ferramentas de Desenvolvimento
- **TypeScript Compiler (tsc)** - Compilação de TS para JS
- **http-server** - Servidor web para desenvolvimento
- **npm** - Gerenciador de pacotes

## 📂 Estrutura do Projeto

```
Pizzaria/
├── public/               # Arquivos servidos para o navegador
│   ├── index.html       # Página principal
│   ├── main.js          # JavaScript compilado
│   ├── main.ts          # TypeScript do frontend
│   └── styles.css       # Estilos da aplicação
├── src/                 # Código-fonte TypeScript (backend)
│   └── index.ts         # Lógica principal da aplicação
├── data/                # Dados persistidos em CSV
│   ├── clientes.csv     # Dados de clientes
│   ├── produtos.csv     # Dados de produtos
│   ├── pedidos.csv      # Dados de pedidos
│   └── itens_pedido.csv # Itens de cada pedido
├── package.json         # Configurações do Node.js
├── tsconfig.json        # Configuração TypeScript (backend)
├── tsconfig.web.json    # Configuração TypeScript (frontend)
└── README.md            # Este arquivo
```

## 🚀 Como Começar

### Pré-requisitos
- **Node.js** 16+ instalado
- **npm** (vem com Node.js)
- Um navegador moderno (Chrome, Firefox, Safari, Edge)

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/Achelandre/Pizzaria.git
cd Pizzaria
```

2. **Instale as dependências**
```bash
npm install
```

3. **Compile o TypeScript**
```bash
npm run web:build
```

4. **Inicie o servidor**
```bash
npm run web
```

5. **Acesse a aplicação**
Abra seu navegador e visite:
```
http://localhost:8080
```

## 📝 Scripts Disponíveis

### `npm run web:build`
Compila arquivos TypeScript (`public/main.ts`) para JavaScript (`public/main.js`)

### `npm run web`
Inicia um servidor HTTP na porta 8080 servindo os arquivos do diretório `public/`

### `npm test`
Espaço reservado para testes (a ser implementado)

## 💾 Estrutura de Dados

### Clientes (clientes.csv)
```
id, nome, telefone, endereco, historicoPedidosIds
```

### Produtos (produtos.csv)
```
id, nome, categoria, preco, ativo
```

### Pedidos (pedidos.csv)
```
id, clienteId, dataPedido, statusPedido, formaPagamento, totalValor
```

### Itens de Pedido (itens_pedido.csv)
```
id, pedidoId, produtoId, quantidade, precoUnitario
```

## 🎯 Recursos Principais

### Dashboard Intuitivo
A navegação é dividida em 4 seções principais:
- **Clientes**: Visualizar e adicionar novos clientes
- **Produtos**: Gerenciar catálogo de produtos
- **Pedidos**: Criar e acompanhar pedidos
- **Relatórios**: Análises e estatísticas de vendas

### Validação de Dados
- Validação de entrada em tempo real
- Tratamento de erros robusto
- Confirmação de ações importantes

## 🔒 Segurança
- Dados armazenados localmente em arquivos CSV
- Tipagem TypeScript para evitar erros em tempo de compilação
- Validação de entrada de usuário





