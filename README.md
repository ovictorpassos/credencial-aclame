# Sistema de Credenciamento - Igreja Aclame

Sistema local para credenciamento de participantes em eventos. Busca por CPF em uma planilha Google Sheets (alimentada por Google Forms) e imprime credenciais/crachas.

## Pre-requisitos

- Node.js 18+
- Conta Google Cloud com acesso ao Google Sheets API

## Configuracao passo a passo

### 1. Google Cloud Console

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um novo projeto (ou use um existente)
3. No menu lateral, va em **APIs e Servicos > Biblioteca**
4. Busque **Google Sheets API** e ative
5. Va em **APIs e Servicos > Credenciais**
6. Clique em **Criar credenciais > Conta de servico**
7. Preencha o nome e crie
8. Na conta de servico criada, va na aba **Chaves**
9. Clique em **Adicionar chave > Criar nova chave > JSON**
10. Salve o arquivo baixado como `credentials.json` na raiz do projeto

### 2. Compartilhar a planilha

1. Abra o arquivo `credentials.json` e copie o campo `client_email`
2. Abra sua planilha Google Sheets
3. Clique em **Compartilhar** e adicione o e-mail da conta de servico como **Leitor**

### 3. Configurar variaveis de ambiente

1. Copie o arquivo de exemplo:
   ```bash
   cp .env.example .env
   ```
2. Abra o `.env` e preencha:
   - `SPREADSHEET_ID`: o ID da planilha (esta na URL: `docs.google.com/spreadsheets/d/ESTE_ID_AQUI/edit`)

### 4. Ajustar colunas (se necessario)

No arquivo `server.js`, ajuste o objeto `CONFIG` no topo do arquivo para corresponder a estrutura da sua planilha:

```js
const CONFIG = {
  SHEET_NAME: 'Respostas ao formulário 1', // nome da aba
  COL_NOME: 1,    // coluna do nome (0-based)
  COL_CPF: 2,     // coluna do CPF (0-based)
  NOME_EVENTO: 'Conferência 2025',
  NOME_IGREJA: 'Igreja Aclame',
  DATA_EVENTO: '15 de Junho de 2025',
};
```

### 5. Instalar e rodar

```bash
npm install
node server.js
```

Acesse: **http://localhost:3000**

## Uso

1. Digite o CPF do participante (com ou sem pontuacao)
2. O sistema busca na planilha e exibe o nome
3. Clique em **Imprimir Credencial** para abrir o dialogo de impressao
4. A credencial esta formatada para impressao em cracha 9x5cm

## Estrutura de arquivos

```
├── server.js           # Servidor Express + integracao Google Sheets
├── credentials.json    # Chave da Service Account (nao commitar!)
├── .env                # Variaveis de ambiente
├── .env.example        # Exemplo de variaveis
├── package.json
└── public/
    ├── index.html      # Interface de busca
    ├── style.css       # Estilos + layout de impressao
    └── app.js          # Logica do frontend
```
