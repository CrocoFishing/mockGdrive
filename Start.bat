@echo off
set "ROOT=%~dp0"

wt -w 0 ^
  new-tab -d "%ROOT%server" cmd /k "npm install && node index.js" ^
  ; split-pane -V -d "%ROOT%ONSTO" cmd /k "npm install && npm run dev"
