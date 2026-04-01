#!/bin/bash
# =============================================
# Abridor do Sistema de Credenciamento
# Aclame Jubrac 2026
#
# Imprime DIRETO na impressora padrão,
# sem mostrar diálogo de impressão.
#
# Como usar:
#   1. Defina a impressora padrão no Mac:
#      Preferências do Sistema > Impressoras
#   2. Dê dois cliques neste arquivo
# =============================================

URL="https://credencial-aclame.onrender.com"

/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --kiosk-printing \
  --app="$URL" \
  --start-maximized \
  2>/dev/null &
