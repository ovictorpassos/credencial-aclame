// ============================================================
// COLE ESTE CÓDIGO NO GOOGLE APPS SCRIPT
// Instruções: veja o README ou pergunte ao Claude
// ============================================================

const SHEET_ID   = '1JKlW9RYIlKlzlI-JYf2RGrfu8vYgPrTvNYhDJVk4Kd8';
const SHEET_NAME = 'Respostas ao formulário 1';
const COL_CPF    = 2; // índice 0-based da coluna de CPF

function doPost(e) {
  try {
    const data      = JSON.parse(e.postData.contents);
    const cpfBusca  = data.cpf.replace(/\D/g, '');

    const ss    = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);

    // Encontrar ou criar coluna "Check-in"
    const lastCol = sheet.getLastColumn();
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    let checkinColIndex = headers.findIndex(h => String(h).toLowerCase() === 'check-in');

    if (checkinColIndex === -1) {
      // Cria o cabeçalho na próxima coluna disponível
      checkinColIndex = lastCol;
      sheet.getRange(1, lastCol + 1).setValue('Check-in');
    }

    // Procurar CPF na planilha
    const allData = sheet.getDataRange().getValues();

    for (let i = 1; i < allData.length; i++) {
      const cpfPlanilha = String(allData[i][COL_CPF]).replace(/\D/g, '');

      if (cpfPlanilha === cpfBusca) {
        const jaFezCheckin = allData[i][checkinColIndex];

        if (jaFezCheckin) {
          // Já fez check-in anteriormente
          return json({
            ok: true,
            repetido: true,
            nome: allData[i][1],
            checkinAnterior: String(jaFezCheckin),
          });
        }

        // Registrar check-in com data/hora de Brasília
        const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        sheet.getRange(i + 1, checkinColIndex + 1).setValue(agora);

        return json({ ok: true, repetido: false, nome: allData[i][1] });
      }
    }

    return json({ ok: false, message: 'CPF não encontrado' });

  } catch (err) {
    return json({ ok: false, message: err.toString() });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
