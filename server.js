require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const path = require('path');

// ============================
// CONFIGURACAO DO EVENTO
// Ajuste esses valores conforme a estrutura da sua planilha
// ============================
const CONFIG = {
  SPREADSHEET_ID: process.env.SPREADSHEET_ID,
  SHEET_NAME: 'Respostas ao formulário 1',
  COL_NOME: 1,    // indice 0-based da coluna com nome completo
  COL_CPF: 2,     // indice 0-based da coluna com CPF
  SKIP_HEADER: true,
  NOME_EVENTO: 'Aclame Jubrac — 2026',
  NOME_IGREJA: '',
  DATA_EVENTO: '15 de Junho de 2025',
};

// ============================
// CACHE EM MEMORIA
// Atualiza automaticamente a cada 5 minutos
// ============================
let cache = {
  data: null,
  lastFetch: 0,
  TTL: 5 * 60 * 1000, // 5 minutos
};

// ============================
// GOOGLE SHEETS AUTH
// Usa API Key (planilha deve estar compartilhada como "Qualquer pessoa com o link")
// ============================
async function getAuthClient() {
  return process.env.GOOGLE_API_KEY;
}

// ============================
// BUSCAR DADOS DA PLANILHA (com cache)
// ============================
async function getSheetData() {
  const now = Date.now();

  if (cache.data && (now - cache.lastFetch) < cache.TTL) {
    return cache.data;
  }

  const apiKey = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: apiKey });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: CONFIG.SPREADSHEET_ID,
    range: CONFIG.SHEET_NAME,
  });

  const rows = response.data.values || [];
  cache.data = CONFIG.SKIP_HEADER ? rows.slice(1) : rows;
  cache.lastFetch = now;

  console.log(`[CACHE] Planilha atualizada: ${cache.data.length} registros carregados`);
  return cache.data;
}

// ============================
// NORMALIZAR CPF (so digitos)
// ============================
function normalizeCpf(cpf) {
  return (cpf || '').replace(/\D/g, '');
}

// ============================
// EXPRESS SERVER
// ============================
const app = express();
app.use(express.json());

// ============================
// PROTECAO POR SENHA
// Defina ACCESS_PASSWORD no .env / Render Environment Variables
// ============================
const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD || '';

if (ACCESS_PASSWORD) {
  // Tela de login
  app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acesso — Credenciamento</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #13131f; color: #e0e0f0;
           min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .box { background: #1c1c2e; border: 1px solid #2e2e4a; border-radius: 14px;
           padding: 2.5rem 2rem; width: 100%; max-width: 360px; text-align: center; }
    .logo { font-size: 1.4rem; color: #5c6bc0; margin-bottom: 1rem; }
    h1 { font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 0.3rem; }
    p { font-size: 0.82rem; color: #7070a0; margin-bottom: 1.75rem; }
    input { width: 100%; padding: 0.9rem 1rem; font-size: 1.1rem; letter-spacing: 3px;
            text-align: center; border: 2px solid #2e2e4a; border-radius: 10px;
            background: #16213e; color: #fff; outline: none; margin-bottom: 0.75rem; }
    input:focus { border-color: #5c6bc0; }
    button { width: 100%; padding: 0.9rem; font-size: 0.95rem; font-weight: 600;
             border: none; border-radius: 10px; background: #5c6bc0; color: #fff;
             cursor: pointer; }
    button:hover { background: #7986cb; }
    .erro { color: #ef9a9a; font-size: 0.8rem; margin-top: 0.75rem; }
  </style>
</head>
<body>
  <div class="box">
    <div class="logo">✦</div>
    <h1>Credenciamento</h1>
    <p>Digite a senha de acesso para continuar</p>
    <form method="POST" action="/login">
      <input type="password" name="senha" placeholder="••••••••" autofocus>
      <button type="submit">Entrar</button>
      ${req.query.erro ? '<p class="erro">Senha incorreta. Tente novamente.</p>' : ''}
    </form>
  </div>
</body>
</html>`);
  });

  app.post('/login', express.urlencoded({ extended: false }), (req, res) => {
    if (req.body.senha === ACCESS_PASSWORD) {
      res.cookie('auth', ACCESS_PASSWORD, { httpOnly: true, sameSite: 'strict' });
      return res.redirect('/');
    }
    res.redirect('/login?erro=1');
  });

  // Middleware de autenticacao
  app.use((req, res, next) => {
    const publicPaths = ['/login'];
    if (publicPaths.includes(req.path)) return next();
    const cookie = req.headers.cookie || '';
    const autenticado = cookie.split(';').some(c => c.trim() === `auth=${ACCESS_PASSWORD}`);
    if (!autenticado) return res.redirect('/login');
    next();
  });
}

// Servir arquivos estaticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// ============================
// ENDPOINT: buscar participante por CPF
// ============================
app.get('/api/buscar', async (req, res) => {
  const cpfBusca = normalizeCpf(req.query.cpf);

  if (!cpfBusca || cpfBusca.length < 11) {
    return res.json({ found: false, message: 'CPF invalido' });
  }

  const timestamp = new Date().toISOString();

  try {
    const rows = await getSheetData();

    const row = rows.find(r => {
      const cpfPlanilha = normalizeCpf(r[CONFIG.COL_CPF]);
      return cpfPlanilha === cpfBusca;
    });

    if (row) {
      const nome = row[CONFIG.COL_NOME];
      console.log(`[BUSCA] ${timestamp} | CPF: ${cpfBusca} | ENCONTRADO: ${nome}`);
      return res.json({
        found: true,
        nome,
        evento: CONFIG.NOME_EVENTO,
        igreja: CONFIG.NOME_IGREJA,
        dataEvento: CONFIG.DATA_EVENTO,
      });
    }

    console.log(`[BUSCA] ${timestamp} | CPF: ${cpfBusca} | NAO ENCONTRADO`);
    return res.json({ found: false, message: 'Participante nao encontrado' });

  } catch (err) {
    console.error(`[ERRO] ${timestamp} | CPF: ${cpfBusca} |`, err.message);
    return res.status(500).json({ found: false, message: 'Erro ao consultar planilha' });
  }
});

// ============================
// ENDPOINT: registrar check-in via Apps Script
// ============================
app.post('/api/checkin', async (req, res) => {
  const cpf = normalizeCpf(req.body.cpf);
  const timestamp = new Date().toISOString();

  if (!cpf) return res.json({ ok: false, message: 'CPF inválido' });

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  if (!scriptUrl || scriptUrl.startsWith('cole_aqui')) {
    console.warn(`[CHECKIN] ${timestamp} | CPF: ${cpf} | Apps Script não configurado — check-in ignorado`);
    return res.json({ ok: true, aviso: 'Apps Script não configurado' });
  }

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf }),
      redirect: 'follow',
    });

    const data = await response.json();

    if (data.repetido) {
      console.log(`[CHECKIN] ${timestamp} | CPF: ${cpf} | REPETIDO — check-in anterior: ${data.checkinAnterior}`);
    } else {
      console.log(`[CHECKIN] ${timestamp} | CPF: ${cpf} | OK — ${data.nome}`);
    }

    return res.json(data);
  } catch (err) {
    console.error(`[CHECKIN ERRO] ${timestamp} | CPF: ${cpf} |`, err.message);
    return res.status(500).json({ ok: false, message: 'Erro ao registrar check-in' });
  }
});

// ============================
// ENDPOINT: configuracoes publicas do evento
// ============================
app.get('/api/config', (req, res) => {
  res.json({
    evento: CONFIG.NOME_EVENTO,
    igreja: CONFIG.NOME_IGREJA,
    dataEvento: CONFIG.DATA_EVENTO,
  });
});

// ============================
// INICIAR SERVIDOR
// ============================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  Sistema de Credenciamento - ${CONFIG.NOME_IGREJA}`);
  console.log(`  Evento: ${CONFIG.NOME_EVENTO}`);
  console.log(`  Rodando em: http://localhost:${PORT}`);
  console.log(`========================================\n`);
});
