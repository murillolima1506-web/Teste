/* Controle Financeiro - app.js */
(function () {
  "use strict";

  const STORAGE_KEY = "cf_lancamentos";
  const THEME_KEY = "cf_theme";

  // ---------- Persistência ----------
  function carregar() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }
  function salvar(lista) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  }

  let lancamentos = carregar();

  // ---------- Helpers ----------
  const $ = (id) => document.getElementById(id);
  const fmt = (v) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
  const fmtData = (iso) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };
  const hojeISO = () => new Date().toISOString().slice(0, 10);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // ---------- Elementos ----------
  const el = {
    form: $("formLancamento"),
    tipo: $("tipo"),
    descricao: $("descricao"),
    categoria: $("categoria"),
    categoriasList: $("categoriasList"),
    valor: $("valor"),
    data: $("data"),
    editId: $("editId"),
    btnSalvar: $("btnSalvar"),
    btnCancelar: $("btnCancelar"),
    totalReceitas: $("totalReceitas"),
    totalDespesas: $("totalDespesas"),
    saldoTotal: $("saldoTotal"),
    tabela: $("tabelaLancamentos"),
    vazio: $("vazio"),
    graficoCategorias: $("graficoCategorias"),
    graficoSaldo: $("graficoSaldo"),
    filtroTipo: $("filtroTipo"),
    filtroCategoria: $("filtroCategoria"),
    filtroMes: $("filtroMes"),
    limparFiltros: $("limparFiltros"),
    themeToggle: $("themeToggle"),
    exportar: $("exportar"),
    limparTudo: $("limparTudo"),
  };

  // ---------- Tema ----------
  function aplicarTema() {
    const tema = localStorage.getItem(THEME_KEY) || "light";
    document.documentElement.setAttribute("data-theme", tema);
    el.themeToggle.textContent = tema === "dark" ? "☀️" : "🌙";
  }
  el.themeToggle.addEventListener("click", () => {
    const atual = document.documentElement.getAttribute("data-theme");
    const prox = atual === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, prox);
    aplicarTema();
  });

  // ---------- Formulário ----------
  function preencherCategorias() {
    const cats = [...new Set(lancamentos.map((l) => l.categoria))].sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
    el.categoriasList.innerHTML = cats
      .map((c) => `<option value="${c}"></option>`)
      .join("");
    const atual = el.filtroCategoria.value;
    el.filtroCategoria.innerHTML =
      '<option value="">Todas as categorias</option>' +
      cats.map((c) => `<option value="${c}"${c === atual ? " selected" : ""}>${c}</option>`).join("");
  }

  el.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const valor = parseFloat(el.valor.value.replace(",", "."));
    if (!valor || valor <= 0) return;

    const registro = {
      id: el.editId.value || uid(),
      tipo: el.tipo.value,
      descricao: el.descricao.value.trim(),
      categoria: el.categoria.value.trim() || "Geral",
      valor,
      data: el.data.value,
    };

    const idx = lancamentos.findIndex((l) => l.id === registro.id);
    if (idx >= 0) lancamentos[idx] = registro;
    else lancamentos.push(registro);

    salvar(lancamentos);
    resetForm();
    render();
  });

  function resetForm() {
    el.form.reset();
    el.editId.value = "";
    el.data.value = hojeISO();
    el.btnSalvar.textContent = "Adicionar";
    el.btnCancelar.classList.add("hidden");
  }

  el.btnCancelar.addEventListener("click", resetForm);

  function editar(id) {
    const l = lancamentos.find((x) => x.id === id);
    if (!l) return;
    el.editId.value = l.id;
    el.tipo.value = l.tipo;
    el.descricao.value = l.descricao;
    el.categoria.value = l.categoria;
    el.valor.value = l.valor;
    el.data.value = l.data;
    el.btnSalvar.textContent = "Salvar";
    el.btnCancelar.classList.remove("hidden");
    el.descricao.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function excluir(id) {
    if (!confirm("Excluir este lançamento?")) return;
    lancamentos = lancamentos.filter((l) => l.id !== id);
    salvar(lancamentos);
    render();
  }

  // ---------- Filtros ----------
  function filtrar() {
    return lancamentos
      .filter((l) => !el.filtroTipo.value || l.tipo === el.filtroTipo.value)
      .filter((l) => !el.filtroCategoria.value || l.categoria === el.filtroCategoria.value)
      .filter((l) => {
        if (!el.filtroMes.value) return true;
        return l.data.slice(0, 7) === el.filtroMes.value;
      })
      .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
  }

  [el.filtroTipo, el.filtroCategoria, el.filtroMes].forEach((f) =>
    f.addEventListener("change", renderTabela)
  );
  el.limparFiltros.addEventListener("click", () => {
    el.filtroTipo.value = "";
    el.filtroCategoria.value = "";
    el.filtroMes.value = "";
    renderTabela();
  });

  // ---------- Resumo ----------
  function renderResumo() {
    const receitas = lancamentos.filter((l) => l.tipo === "receita").reduce((s, l) => s + l.valor, 0);
    const despesas = lancamentos.filter((l) => l.tipo === "despesa").reduce((s, l) => s + l.valor, 0);
    el.totalReceitas.textContent = fmt(receitas);
    el.totalDespesas.textContent = fmt(despesas);
    el.saldoTotal.textContent = fmt(receitas - despesas);
  }

  // ---------- Tabela ----------
  function renderTabela() {
    const lista = filtrar();
    if (!lista.length) {
      el.tabela.innerHTML = "";
      el.vazio.classList.remove("hidden");
      return;
    }
    el.vazio.classList.add("hidden");
    el.tabela.innerHTML = lista
      .map(
        (l) => `
      <tr>
        <td>${fmtData(l.data)}</td>
        <td>${esc(l.descricao)}</td>
        <td>${esc(l.categoria)}</td>
        <td><span class="tag tag-${l.tipo}">${l.tipo === "receita" ? "Receita" : "Despesa"}</span></td>
        <td class="num" style="color:var(--${l.tipo})">${l.tipo === "despesa" ? "−" : "+"}${fmt(l.valor)}</td>
        <td class="row-actions">
          <button data-edit="${l.id}" title="Editar">✏️</button>
          <button data-del="${l.id}" title="Excluir">🗑️</button>
        </td>
      </tr>`
      )
      .join("");
  }

  el.tabela.addEventListener("click", (e) => {
    const edt = e.target.closest("[data-edit]");
    const del = e.target.closest("[data-del]");
    if (edt) editar(edt.dataset.edit);
    if (del) excluir(del.dataset.del);
  });

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  // ---------- Gráfico de barras (despesas por categoria) ----------
  function renderGraficoCategorias() {
    const porCat = {};
    lancamentos
      .filter((l) => l.tipo === "despesa")
      .forEach((l) => (porCat[l.categoria] = (porCat[l.categoria] || 0) + l.valor));
    const itens = Object.entries(porCat).sort((a, b) => b[1] - a[1]);
    if (!itens.length) {
      el.graficoCategorias.innerHTML = '<p class="line-empty">Nenhuma despesa registrada.</p>';
      return;
    }
    const max = Math.max(...itens.map((i) => i[1]));
    el.graficoCategorias.innerHTML = itens
      .map(([cat, val]) => {
        const pct = max > 0 ? (val / max) * 100 : 0;
        return `
        <div class="bar-row">
          <div class="bar-label"><span>${esc(cat)}</span><span>${fmt(val)}</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        </div>`;
      })
      .join("");
  }

  // ---------- Gráfico de linha (evolução do saldo) ----------
  function renderGraficoSaldo() {
    const ordenados = [...lancamentos].sort((a, b) => (a.data < b.data ? -1 : 1));
    if (!ordenados.length) {
      el.graficoSaldo.innerHTML = '<p class="line-empty">Sem dados suficientes.</p>';
      return;
    }
    // saldo acumulado por data
    let saldo = 0;
    const pontos = ordenados.map((l) => {
      saldo += l.tipo === "receita" ? l.valor : -l.valor;
      return { data: l.data, saldo };
    });
    // agrupar por dia (último saldo do dia)
    const porDia = {};
    pontos.forEach((p) => (porDia[p.data] = p.saldo));
    const dias = Object.entries(porDia);
    const saldos = dias.map((d) => d[1]);
    const min = Math.min(0, ...saldos);
    const max = Math.max(0, ...saldos);
    const range = max - min || 1;
    const W = 100, H = 100;
    const step = dias.length > 1 ? W / (dias.length - 1) : 0;
    const pontosXY = dias.map((d, i) => {
      const x = i * step;
      const y = H - ((d[1] - min) / range) * H;
      return [x, y];
    });
    const path = pontosXY.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    const areaPath = `${path} L${W},${H} L0,${H} Z`;
    const corLinha = saldo >= 0 ? "var(--receita)" : "var(--despesa)";

    el.graficoSaldo.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <path d="${areaPath}" fill="${saldo >= 0 ? "rgba(22,163,74,0.15)" : "rgba(220,38,38,0.15)"}" />
        <path d="${path}" fill="none" stroke="${corLinha}" stroke-width="1.5" vector-effect="non-scaling-stroke" />
      </svg>
      <div class="bar-label"><span>${fmtData(dias[0][0])}</span><span>${fmtData(dias[dias.length - 1][0])}</span></div>`;
  }

  // ---------- Exportar / Limpar ----------
  el.exportar.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(lancamentos, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `controle-financeiro-${hojeISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  el.limparTudo.addEventListener("click", () => {
    if (!confirm("Apagar TODOS os lançamentos? Esta ação não pode ser desfeita.")) return;
    lancamentos = [];
    salvar(lancamentos);
    render();
  });

  // ---------- Render geral ----------
  function render() {
    preencherCategorias();
    renderResumo();
    renderTabela();
    renderGraficoCategorias();
    renderGraficoSaldo();
  }

  // ---------- Init ----------
  el.data.value = hojeISO();
  aplicarTema();
  render();
})();
