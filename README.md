# 💰 Controle Financeiro

App web de controle financeiro pessoal — registre receitas e despesas, acompanhe o saldo, visualize gráficos por categoria e a evolução do saldo ao longo do tempo.

## ✨ Funcionalidades

- **Lançamentos**: registre receitas e despesas com descrição, categoria, valor e data.
- **Resumo**: total de receitas, despesas e saldo atual.
- **Gráficos**:
  - Barras de despesas por categoria.
  - Linha da evolução do saldo acumulado.
- **Filtros**: por tipo (receita/despesa), categoria e mês.
- **Editar / Excluir** lançamentos.
- **Exportar** dados em JSON.
- **Tema claro/escuro** com preferência salva.
- **Persistência local** via `localStorage` (não requer backend nem cadastro).

## 🚀 Como usar

Não há dependências nem build. Basta abrir o arquivo no navegador:

1. Abra `index.html` no seu navegador (duplo clique ou arraste para o navegador).
2. Comece a adicionar lançamentos. Os dados ficam salvos no seu navegador.

> Alternativamente, rode um servidor local:
> ```bash
> python3 -m http.server 8000
> # acesse http://localhost:8000
> ```

## 📁 Estrutura

| Arquivo      | Descrição                                  |
|--------------|--------------------------------------------|
| `index.html` | Estrutura e marcação da interface.         |
| `styles.css` | Estilos responsivos + tema claro/escuro.  |
| `app.js`     | Lógica: CRUD, resumo, gráficos, filtros.  |

## 🛠️ Tecnologias

- HTML, CSS e JavaScript puros (sem frameworks, sem dependências).
- Gráficos desenhados em SVG/CSS, sem bibliotecas externas.
- `localStorage` para persistência.

## 💾 Privacidade

Todos os dados ficam apenas no seu navegador. Nada é enviado para servidores.
