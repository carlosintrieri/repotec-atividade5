<div align="center">

<img src="https://img.shields.io/badge/FATEC%20SJC-Técnicas%20de%20Programação%20II-0055A4?style=for-the-badge&logoColor=white"/>
<img src="https://img.shields.io/badge/Node.js-14%2B-339933?style=for-the-badge&logo=node.js&logoColor=white"/>
<img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
<img src="https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql&logoColor=white"/>
<img src="https://img.shields.io/badge/Full%20Stack-Web%20App-0d5fa1?style=for-the-badge"/>

# 🌊 Atlantis Water Park
### Sistema de Gestão de Resort — Aplicação Web Full Stack

*Projeto desenvolvido para a disciplina de **Técnicas de Programação II** · FATEC São José dos Campos*

</div>

---

## 🏖️ Sobre o Projeto

Este sistema é uma **aplicação web completa** que simula a gestão operacional do **Resort Atlantis Water Park**, um complexo de lazer aquático. O projeto cobre todo o ciclo de atendimento ao hóspede — do cadastro ao checkout — integrando backend e frontend em uma única solução.

O titular se cadastra no sistema, registra seus dependentes, realiza check-in em um quarto específico, controla entradas e saídas pelo ponto, e tem todos os seus documentos e dados armazenados de forma centralizada no banco de dados.

---

## 🛠️ Stack Tecnológica

> **Este projeto utiliza as seguintes tecnologias — todas integradas de ponta a ponta:**

| Camada | Tecnologia | Função |
|---|---|---|
| 🎨 **Frontend** | **React.js** | Interface do usuário — componentes, estado, roteamento e consumo de API |
| ⚙️ **Backend** | **Node.js + Express** | Servidor HTTP, regras de negócio e API REST |
| 🗄️ **Banco de Dados** | **MySQL** | Persistência de todos os dados — hóspedes, quartos, check-ins e documentos |
| 🔗 **Integração** | **REST API (JSON)** | Comunicação entre React (frontend) e Node.js (backend) |

### Por que essa stack?

- **React** → componentes reutilizáveis, atualizações reativas de tela sem recarregar a página
- **Node.js** → servidor leve e assíncrono, ideal para múltiplas requisições simultâneas
- **MySQL** → banco relacional robusto, com tabelas e relacionamentos para hóspedes, quartos e documentos
- **Express** → framework minimalista que conecta as rotas do Node.js ao banco MySQL via queries SQL

### Fluxo de dados

```
[ React (Frontend) ]
        │  HTTP Request (JSON)
        ▼
[ Node.js + Express (Backend) ]
        │  Query SQL
        ▼
[ MySQL (Banco de Dados) ]
```

---

## ✨ Funcionalidades

| Módulo | Descrição |
|---|---|
| 👤 **Cadastro de Titulares** | Registro completo do hóspede principal — dados salvos no MySQL via API Node.js |
| 👨‍👩‍👧‍👦 **Cadastro de Dependentes** | Acompanhantes vinculados ao titular — relação armazenada no banco de dados |
| 🕐 **Controle de Ponto** | Entrada e saída dos hóspedes com timestamps registrados no MySQL |
| 🛏️ **Reserva de Quartos** | Associação do titular a um quarto — gerenciada por tabela relacional |
| ✅ **Check-in & Check-out** | Ciclo completo de hospedagem com status persistido no banco |
| 📄 **Gestão de Documentos** | Upload e armazenamento de dados e documentos dos clientes no MySQL |

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** — versão 14 ou superior
- **npm** — geralmente incluído com o Node.js
- **MySQL** — versão 5.7+ ou 8.0+ (com o banco criado e configurado)
- Dois terminais abertos simultaneamente para rodar o projeto

---

## ⚙️ Configuração do Banco de Dados (MySQL)

Certifique-se de criar o banco e configurar a conexão no backend antes de rodar o projeto.

```sql
CREATE DATABASE atlantis_resort;
USE atlantis_resort;
```

As credenciais de conexão ficam em `src/backend/` (arquivo `.env` ou de configuração).

---

## 🚀 Como Executar

O projeto precisa de **dois terminais** rodando em paralelo.

### 🔧 Terminal 1 — Backend (Node.js + MySQL)

```bash
cd src/backend
node server.js
```

O servidor Node.js iniciará, conectará ao MySQL e ficará pronto para receber requisições da interface React.

### 🎨 Terminal 2 — Frontend (React)

```bash
npm start
```

O React irá compilar e abrir a interface no navegador, se comunicando com o backend via API REST.

> **📦 Nota:** Se encontrar erros com `react-scripts`, instale antes:
> ```bash
> npm install react-scripts
> ```

---

## ✅ URLs da Aplicação

Após executar ambos os comandos:

- **Frontend (React)** → `http://localhost:8080`
- **Backend (Node.js)** → verifique o console para a porta exata

---

## 💡 Dicas

- Mantenha os dois terminais abertos enquanto trabalha
- Certifique-se de que o **MySQL está rodando** antes de iniciar o backend
- Para parar, use `Ctrl + C` em cada terminal
- Se necessário, instale as dependências com `npm install` em ambas as pastas

---

<div align="center">

Desenvolvido com ❤️ para **FATEC São José dos Campos**

</div>
