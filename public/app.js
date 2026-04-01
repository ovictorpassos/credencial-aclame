// ============================
// ELEMENTOS DO DOM
// ============================
const cpfInput          = document.getElementById('cpf-input');
const btnBuscar         = document.getElementById('btn-buscar');
const inputWrap         = document.getElementById('input-wrap');
const loadingEl         = document.getElementById('loading');
const loadingMsg        = document.getElementById('loading-msg');
const inlineError       = document.getElementById('inline-error');
const inlineErrorMsg    = document.getElementById('inline-error-msg');
const buscaSection      = document.getElementById('busca-section');
const resultadoSucesso      = document.getElementById('resultado-sucesso');
const resultadoNaoEncontrado= document.getElementById('resultado-nao-encontrado');
const naoEncontradoCpf      = document.getElementById('nao-encontrado-cpf');
const nomeParticipante      = document.getElementById('nome-participante');
const resultCpf             = document.getElementById('result-cpf');
const btnImprimir           = document.getElementById('btn-imprimir');
const btnNovaBusca          = document.getElementById('btn-nova-busca');
const btnTentarNovamente    = document.getElementById('btn-tentar-novamente');
const contadorValor     = document.getElementById('contador-valor');
const resultadoObrigado = document.getElementById('resultado-obrigado');
const obrigadoEvento    = document.getElementById('obrigado-evento');
const progressFill      = document.getElementById('progress-fill');
const countdownEl       = document.getElementById('countdown');

let credenciaisImpressas = 0;
let dadosAtual  = null;
let ultimoCpf   = '';
let obrigadoTimer = null;

// ============================
// MÁSCARA DE CPF
// ============================
cpfInput.addEventListener('input', () => {
  let v = cpfInput.value.replace(/\D/g, '');
  if (v.length > 11) v = v.slice(0, 11);

  if (v.length > 9)      v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');

  cpfInput.value = v;

  // Limpar estado de erro ao digitar
  cpfInput.classList.remove('input-error', 'input-success');
  esconderErroInline();
});

// ============================
// ATALHOS DE TECLADO
// ============================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') novaBusca();
  if (e.key === 'Enter' && document.activeElement !== btnNovaBusca) buscar();
});

btnBuscar.addEventListener('click', buscar);

// ============================
// BUSCAR
// ============================
async function buscar() {
  const cpfRaw = cpfInput.value.replace(/\D/g, '');

  // Validação com mensagem específica
  if (cpfRaw.length === 0) {
    mostrarErroInline('Digite o CPF do participante');
    cpfInput.classList.add('input-error');
    cpfInput.focus();
    return;
  }
  if (cpfRaw.length < 11) {
    mostrarErroInline(`CPF incompleto — faltam ${11 - cpfRaw.length} dígito${11 - cpfRaw.length > 1 ? 's' : ''}`);
    cpfInput.classList.add('input-error');
    cpfInput.focus();
    return;
  }

  ultimoCpf = cpfRaw;
  setEstado('loading');

  try {
    const res = await fetch(`/api/buscar?cpf=${cpfRaw}`);

    if (!res.ok) throw new Error('server');

    const data = await res.json();

    if (data.found) {
      dadosAtual = data;
      nomeParticipante.textContent = data.nome;
      resultCpf.textContent = cpfInput.value;
      setEstado('sucesso');
    } else {
      naoEncontradoCpf.textContent = cpfInput.value;
      setEstado('nao-encontrado');
    }
  } catch (err) {
    mostrarErroInline('Erro de conexão com o servidor. Tente novamente.');
    setEstado('idle');
  }
}

// ============================
// ESTADOS DA INTERFACE
// ============================
function setEstado(estado, opts = {}) {
  // Reset visual
  loadingEl.classList.add('hidden');
  resultadoSucesso.classList.add('hidden');
  resultadoNaoEncontrado.classList.add('hidden');
  esconderErroInline();
  buscaSection.style.opacity   = '1';
  buscaSection.style.pointerEvents = 'auto';
  btnBuscar.disabled = false;

  switch (estado) {
    case 'loading':
      buscaSection.style.opacity      = '0.5';
      buscaSection.style.pointerEvents = 'none';
      btnBuscar.disabled = true;
      loadingMsg.textContent = 'Buscando participante…';
      loadingEl.classList.remove('hidden');
      break;

    case 'sucesso':
      buscaSection.style.display = 'none';
      resultadoSucesso.classList.remove('hidden');
      // Foco no botão imprimir para agilidade
      setTimeout(() => btnImprimir.focus(), 100);
      break;

    case 'erro':
      buscaSection.style.display = 'none';
      mensagemErroTit.textContent = opts.titulo || 'Erro';
      mensagemErroSub.innerHTML   = opts.sub   || '';
      resultadoErro.classList.remove('hidden');
      break;

    case 'nao-encontrado':
      buscaSection.style.display = 'none';
      resultadoNaoEncontrado.classList.remove('hidden');
      break;

    case 'obrigado':
      buscaSection.style.display = 'none';
      resultadoObrigado.classList.remove('hidden');
      obrigadoEvento.textContent = dadosAtual ? dadosAtual.evento : '';
      iniciarContagem();
      break;

    case 'idle':
      buscaSection.style.display = 'block';
      resultadoObrigado.classList.add('hidden');
      resultadoNaoEncontrado.classList.add('hidden');
      cpfInput.classList.remove('input-error', 'input-success');
      if (obrigadoTimer) { clearInterval(obrigadoTimer); obrigadoTimer = null; }
      break;
  }
}

// ============================
// ERROS INLINE
// ============================
function mostrarErroInline(msg) {
  inlineErrorMsg.textContent = msg;
  inlineError.classList.remove('hidden');
}

function esconderErroInline() {
  inlineError.classList.add('hidden');
}

// ============================
// NOVA BUSCA
// ============================
function novaBusca() {
  cpfInput.value = '';
  dadosAtual = null;
  setEstado('idle');

  // Reset botão imprimir se estava no estado "impresso"
  btnImprimir.classList.remove('printed');
  btnImprimir.querySelector('.btn-text').textContent = 'Imprimir Credencial';
  btnImprimir.querySelector('.btn-icon-left').textContent = '🖨';
  btnImprimir.disabled = false;

  setTimeout(() => cpfInput.focus(), 50);
}

btnNovaBusca.addEventListener('click', novaBusca);
btnTentarNovamente.addEventListener('click', novaBusca);

// ============================
// IMPRIMIR CREDENCIAL
// ============================
btnImprimir.addEventListener('click', () => {
  if (!dadosAtual) return;

  // Preencher dados da credencial
  document.getElementById('print-igreja').textContent = dadosAtual.igreja;
  document.getElementById('print-evento').textContent = dadosAtual.evento;
  document.getElementById('print-nome').textContent   = dadosAtual.nome;
  document.getElementById('print-data').textContent   = dadosAtual.dataEvento;

  const protocolo = `${ultimoCpf}-${Date.now().toString(36).toUpperCase()}`;
  document.getElementById('print-protocolo').textContent = `Protocolo: ${protocolo}`;

  // Detectar fim da impressão
  window.addEventListener('afterprint', async function handler() {
    window.removeEventListener('afterprint', handler);

    // Registrar check-in na planilha (silencioso)
    registrarCheckin(ultimoCpf);

    // Atualizar contador
    credenciaisImpressas++;
    contadorValor.textContent = credenciaisImpressas;
    contadorValor.classList.remove('bump');
    void contadorValor.offsetWidth;
    contadorValor.classList.add('bump');

    // Ir para tela de obrigado
    resultadoSucesso.classList.add('hidden');
    setEstado('obrigado');
  });

  window.print();
});

// ============================
// REGISTRAR CHECK-IN
// ============================
async function registrarCheckin(cpf) {
  try {
    const res  = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf }),
    });
    const data = await res.json();
    if (data.repetido) {
      console.warn(`[CHECK-IN] Check-in repetido para CPF ${cpf} — anterior: ${data.checkinAnterior}`);
    }
  } catch (err) {
    console.warn('[CHECK-IN] Falha ao registrar:', err.message);
  }
}

// ============================
// CONTAGEM REGRESSIVA (tela obrigado)
// ============================
function iniciarContagem() {
  const TOTAL = 6;
  let restante = TOTAL;

  countdownEl.textContent = restante;
  progressFill.style.transition = 'none';
  progressFill.style.width = '0%';

  // Forçar reflow antes de iniciar a transição
  void progressFill.offsetWidth;
  progressFill.style.transition = `width ${TOTAL}s linear`;
  progressFill.style.width = '100%';

  obrigadoTimer = setInterval(() => {
    restante--;
    countdownEl.textContent = restante;
    if (restante <= 0) {
      clearInterval(obrigadoTimer);
      obrigadoTimer = null;
      novaBusca();
    }
  }, 1000);
}

// ============================
// CARREGAR CONFIG DO EVENTO
// ============================
async function carregarConfig() {
  try {
    const res    = await fetch('/api/config');
    const config = await res.json();
    document.getElementById('nome-evento').textContent = config.evento;
    // Só mostra a igreja se estiver preenchida
    const igrejaEl = document.getElementById('nome-igreja');
    if (config.igreja) {
      igrejaEl.textContent = config.igreja;
    } else {
      igrejaEl.style.display = 'none';
    }
  } catch {
    // mantém textos padrão
  }
}

carregarConfig();
setTimeout(() => cpfInput.focus(), 100);
