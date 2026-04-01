@echo off
:: =============================================
:: Abridor do Sistema de Credenciamento
:: Aclame Jubrac 2026
::
:: Imprime DIRETO na impressora padrao,
:: sem mostrar dialogo de impressao.
::
:: Como usar:
::   1. Defina a impressora padrao no Windows:
::      Configuracoes > Impressoras
::   2. Dê dois cliques neste arquivo
:: =============================================

set URL=https://credencial-aclame.onrender.com

start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --kiosk-printing ^
  --app="%URL%" ^
  --start-maximized
