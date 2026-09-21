# Estado inicial do frontend hardening

- Data: 2026-09-19
- Branch de origem: `main`
- SHA inicial: `365fb5ba7eb16bc8d0da21b6ec21555b8c87e858`
- Sincronização: `main` igual a `origin/main`
- Working tree: limpa

## Checks antes das alterações

Os scripts `check`, `test` e `build` foram acionados antes da criação da branch. O repositório não possuía `node_modules`; o gerenciador disponível tentou instalar as dependências e falhou por indisponibilidade de rede no sandbox. Portanto, nenhum check chegou a executar nesta linha de base.

## Achados principais

- `dev` e `build` dependiam de Express.
- O repositório continha MySQL, Drizzle, tRPC, OAuth, S3 e infraestrutura herdada sem uso pelo produto.
- Havia instrumentação e assets de depuração herdados no Vite e na pasta pública.
- O teste existente ficava em `server/`, apesar de validar conteúdo frontend.
- Não havia script/configuração de lint.

Todos os checks finais serão executados após a instalação do conjunto mínimo de dependências frontend.
