(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const fmtNum = (v, casas) =>
    v == null || Number.isNaN(v)
      ? "—"
      : Number(v).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

  const fmtData = (iso) => {
    if (!iso) return "não informada";
    const [a, m, d] = iso.split("-");
    return `${d}/${m}/${a}`;
  };
  const fmtDataCurta = (iso) => {
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
  };

  const hojeISO = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };

  const store = {
    get(k, fallback) {
      try {
        const v = localStorage.getItem(k);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) {
        return fallback;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
        return true;
      } catch (e) {
        return false;
      }
    }
  };

  const ICON = {
    ok: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    warn: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2.8L22 20.5H2z" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/><path d="M12 9v5.2" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.5" fill="currentColor"/></svg>',
    crit: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 2.5h8l5.5 5.5v8L16 21.5H8L2.5 16V8z" fill="currentColor"/><path d="M12 7v6.2" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="16.8" r="1.6" fill="#fff"/></svg>',
    na: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-dasharray="3 3"/><path d="M8 12h8" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
    info: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 11v6" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="7.5" r="1.5" fill="currentColor"/></svg>',
    det: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8" fill="currentColor"/></svg>',
    naoDet: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 17L17 6M9 6h8v8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 7l11 11M17 10v8H9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    flat: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h15M14 7l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    indet: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-dasharray="3 2.4"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5v.6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="17" r="1.3" fill="currentColor"/></svg>'
  };

  const NIVEL = {
    ok: { rotulo: "Sem alerta", classe: "ok", icone: ICON.ok },
    warn: { rotulo: "Atenção", classe: "warn", icone: ICON.warn },
    crit: { rotulo: "Prioridade de investigação", classe: "crit", icone: ICON.crit },
    na: { rotulo: "Classificação incompleta", classe: "neutral", icone: ICON.na }
  };

  const badge = (nivel, textoCurto) => {
    const n = NIVEL[nivel];
    const txt = textoCurto && nivel === "crit" ? "Prioridade" : n.rotulo;
    return `<span class="badge ${n.classe}">${n.icone}<span>${txt}</span></span>`;
  };

  const badgeEdna = (res) => {
    if (res === "Detectado") return `<span class="badge info">${ICON.det}<span>Detectado</span></span>`;
    if (res === "Não detectado") return `<span class="badge neutral">${ICON.naoDet}<span>Não detectado</span></span>`;
    return `<span class="badge warn">${ICON.indet}<span>Indeterminado</span></span>`;
  };

  const IND = ECB.indicadores;
  const CODIGOS_ALERTA = Object.keys(IND).filter((k) => IND[k].entraNoAlerta);

  function ultrapassa(cod, valor) {
    const i = IND[cod];
    if (!i.entraNoAlerta || valor == null) return false;
    if (i.min != null && valor < i.min) return "abaixo";
    if (i.max != null && valor > i.max) return "acima";
    return false;
  }

  function avaliar(m) {
    const ultrapassados = [];
    const ausentes = [];
    CODIGOS_ALERTA.forEach((cod) => {
      if (m == null || m[cod] == null) ausentes.push(cod);
      else if (ultrapassa(cod, m[cod])) ultrapassados.push(cod);
    });
    let nivel;
    if (ultrapassados.length >= 2) nivel = "crit";
    else if (ausentes.length) nivel = "na";
    else if (ultrapassados.length === 1) nivel = "warn";
    else nivel = "ok";
    return { ultrapassados, ausentes, nivel, rotulo: NIVEL[nivel].rotulo };
  }

  const pontoPorId = (id) => ECB.pontos.find((p) => p.id === id);
  const datas = () => Array.from(new Set(ECB.medicoes.map((m) => m.data))).sort();
  const medicoesDo = (id) => ECB.medicoes.filter((m) => m.ponto === id).sort((a, b) => a.data.localeCompare(b.data));
  const medicao = (id, data) => ECB.medicoes.find((m) => m.ponto === id && m.data === data) || null;
  const ultimaData = () => datas().slice(-1)[0];
  const ednaDo = (id) => ECB.edna.find((e) => e.ponto === id);

  function descreverExcesso(cod, valor) {
    const i = IND[cod];
    const dir = ultrapassa(cod, valor);
    const v = `${fmtNum(valor, i.casas)}${i.unidade ? " " + i.unidade : ""}`;
    if (cod === "ph") return dir === "abaixo" ? `pH ${v} está abaixo de 6,0 (água mais ácida que o limite)` : `pH ${v} está acima de 9,0`;
    if (cod === "turbidez") return `Turbidez de ${v} está acima de 25 NTU (água mais turva que o limite)`;
    if (cod === "od") return `Oxigênio dissolvido de ${v} está abaixo de 5,0 mg/L (pouco oxigênio para a vida aquática)`;
    return `${i.nome}: ${v}`;
  }

  function initPreferencias() {
    const html = document.documentElement;
    const tamanhos = ["normal", "grande", "maior", "maxima"];
    let fonte = store.get("ecb-fonte", "normal");
    let contraste = store.get("ecb-contraste", "normal");
    const aplicar = () => {
      html.dataset.fonte = fonte;
      html.dataset.contraste = contraste;
      const bC = $("[data-acao='contraste']");
      if (bC) bC.setAttribute("aria-pressed", String(contraste === "alto"));
      const st = $("#pref-status");
      if (st) st.textContent = "";
    };
    aplicar();
    document.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-acao]");
      if (!b) return;
      const acao = b.dataset.acao;
      const anunciar = (msg) => {
        const st = $("#pref-status");
        if (st) st.textContent = msg;
      };
      if (acao === "fonte-mais") {
        fonte = tamanhos[Math.min(tamanhos.indexOf(fonte) + 1, tamanhos.length - 1)];
        anunciar(`Tamanho do texto: ${fonte}`);
      } else if (acao === "fonte-menos") {
        fonte = tamanhos[Math.max(tamanhos.indexOf(fonte) - 1, 0)];
        anunciar(`Tamanho do texto: ${fonte}`);
      } else if (acao === "contraste") {
        contraste = contraste === "alto" ? "normal" : "alto";
        anunciar(contraste === "alto" ? "Alto contraste ativado" : "Alto contraste desativado");
      } else return;
      store.set("ecb-fonte", fonte);
      store.set("ecb-contraste", contraste);
      html.dataset.fonte = fonte;
      html.dataset.contraste = contraste;
      const bC = $("[data-acao='contraste']");
      if (bC) bC.setAttribute("aria-pressed", String(contraste === "alto"));
    });
  }

  function initMenu() {
    const btn = $(".menu-toggle");
    const nav = $(".sidebar");
    if (!btn || !nav) return;
    btn.addEventListener("click", () => {
      const aberto = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!aberto));
      nav.dataset.open = String(!aberto);
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && btn.getAttribute("aria-expanded") === "true" && getComputedStyle(btn).display !== "none") {
        btn.setAttribute("aria-expanded", "false");
        nav.dataset.open = "false";
        btn.focus();
      }
    });
  }

  const Ocorrencias = {
    novas() {
      return store.get("ecb-ocorrencias", []);
    },
    statusAlterados() {
      return store.get("ecb-status", {});
    },
    todas() {
      const alt = this.statusAlterados();
      return ECB.ocorrenciasDemo
        .concat(this.novas())
        .map((o) => Object.assign({}, o, alt[o.protocolo] ? { status: alt[o.protocolo] } : {}))
        .sort((a, b) => b.protocolo.localeCompare(a.protocolo));
    },
    salvar(o) {
      const lista = this.novas();
      lista.push(o);
      return store.set("ecb-ocorrencias", lista);
    },
    proximoProtocolo() {
      const n = 201 + this.novas().length;
      return `ECB-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`;
    },
    mudarStatus(protocolo, status) {
      const alt = this.statusAlterados();
      alt[protocolo] = status;
      return store.set("ecb-status", alt);
    }
  };

  function baixarCSV(nome, linhas) {
    const csv = "﻿" + linhas.map((l) => l.map((c) => `"${String(c == null ? "" : c).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  }

  const NOME_CURTO = { ph: "pH", turbidez: "Turbidez", od: "Oxigênio" };
  const ROTULO_COL = { ph: "pH", turbidez: "Turbidez (NTU)", od: "Oxigênio (mg/L)", temperatura: "Temperatura (°C, simulada)" };

  function respostaCurta(av) {
    if (av.nivel === "ok") return "Tudo dentro dos limites.";
    if (av.nivel === "na") return "Faltam leituras para dizer.";
    const COM_ARTIGO = { ph: "o pH", turbidez: "a turbidez", od: "o oxigênio" };
    const nomes = av.ultrapassados.map((c) => COM_ARTIGO[c]);
    const lista = nomes.length > 1 ? `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}` : nomes[0];
    return `${lista[0].toUpperCase() + lista.slice(1)} ${nomes.length > 1 ? "passaram" : "passou"} do limite.`;
  }

  function cartaoPonto(p) {
    const d = ultimaData();
    const m = medicao(p.id, d);
    const av = avaliar(m);
    const classe = NIVEL[av.nivel].classe === "neutral" ? "" : NIVEL[av.nivel].classe;
    const linha = (cod) => {
      const i = IND[cod];
      const v = m ? m[cod] : null;
      const over = ultrapassa(cod, v);
      return `<div><dt>${NOME_CURTO[cod]}</dt><dd class="${over ? "over " + over : ""}">${fmtNum(v, i.casas)}${v != null && i.unidade ? ` <small>${i.unidade}</small>` : ""}${over ? `<span class="visually-hidden"> (${over} do limite)</span>` : ""}</dd></div>`;
    };
    return `
      <li class="${classe}">
        <article class="tile ${classe}" aria-labelledby="pc-${p.id}">
          <div class="tile-head">
            <div>
              <h3 id="pc-${p.id}">${p.id} — ${esc(p.nome)}</h3>
              <p class="tile-where">${esc(p.descricao)}</p>
            </div>
            ${badge(av.nivel, true)}
          </div>
          <p class="tile-answer">${respostaCurta(av)}</p>
          <dl class="tile-nums">${CODIGOS_ALERTA.map(linha).join("")}</dl>
          <p class="tile-meta">${av.ultrapassados.length} de 3 limites ultrapassados · medição de ${fmtData(d)}</p>
          <a class="tile-link" href="monitoramento.html?ponto=${p.id}">Ver o ${p.id} em detalhe<span class="visually-hidden"> — ${esc(p.nome)}</span></a>
        </article>
      </li>`;
  }

  function initInicio() {
    const alvo = $("#point-cards");
    if (alvo) alvo.innerHTML = ECB.pontos.map(cartaoPonto).join("");
    const recentes = $("#recent-list");
    if (recentes) {
      const lista = Ocorrencias.todas().sort((a, b) => b.data.localeCompare(a.data) || b.protocolo.localeCompare(a.protocolo)).slice(0, 4);
      recentes.innerHTML = lista.length
        ? lista
            .map(
              (o) => `<li><div><span class="recent-type">${esc(o.tipo)}</span><span class="recent-meta">${o.ponto ? `${o.ponto} — ${esc(pontoPorId(o.ponto).nome)}` : "Outro lugar do córrego"} · visto em ${fmtData(o.data)} ${o.demo ? '<span class="tag">demo</span>' : '<span class="tag sim">novo</span>'}</span></div><span class="state-chip">${esc(o.status)}</span></li>`
            )
            .join("")
        : "<li>Ninguém avisou nada ainda.</li>";
    }
    ECB.pontos.forEach((p) => {
      const av = avaliar(medicao(p.id, ultimaData()));
      const t = $(`#map-status-${p.id}`);
      if (t) t.textContent = av.nivel === "crit" ? "Prioridade" : av.rotulo;
      const a = $(`#map-link-${p.id}`);
      if (a) a.setAttribute("aria-label", `${p.id}, ${p.nome}: ${av.rotulo}. Abrir detalhes.`);
      const ring = $(`#map-pin-${p.id}`);
      if (ring) ring.setAttribute("data-nivel", av.nivel);
      const leg = $(`#map-legend-${p.id}`);
      if (leg) leg.innerHTML = badge(av.nivel, true);
    });
    const resumo = $("#home-summary");
    if (resumo) {
      const d = ultimaData();
      const avs = ECB.pontos.map((p) => ({ p, av: avaliar(medicao(p.id, d)) }));
      const crit = avs.filter((x) => x.av.nivel === "crit").map((x) => x.p.id);
      const warn = avs.filter((x) => x.av.nivel === "warn").map((x) => x.p.id);
      const ok = avs.filter((x) => x.av.nivel === "ok").map((x) => x.p);
      const juntar = (ids) => (ids.length > 1 ? `${ids.slice(0, -1).join(", ")} e ${ids[ids.length - 1]}` : ids[0]);
      const extenso = ["nenhum", "um", "dois", "três"];
      const nivelGeral = crit.length ? "crit" : warn.length ? "warn" : "ok";
      resumo.classList.add(nivelGeral);
      let titulo, texto;
      if (crit.length) {
        titulo = `${extenso[crit.length][0].toUpperCase() + extenso[crit.length].slice(1)} dos três pontos ${crit.length === 1 ? "precisa" : "precisam"} de investigação: ${juntar(crit)}.`;
        texto = `Na medição de ${fmtData(d)}, ${crit.length === 1 ? "esse trecho passou" : "esses trechos passaram"} de dois ou mais limites. Nesses casos, a equipe ambiental programa vistoria de campo e nova coleta.${ok.length ? ` ${ok.map((p) => `No ${p.id} (${p.nome.toLowerCase()})`).join(" e ")}, tudo está dentro dos limites.` : ""}`;
      } else if (warn.length) {
        titulo = `Nenhum ponto pede investigação, mas ${juntar(warn)} ${warn.length === 1 ? "está" : "estão"} em atenção.`;
        texto = `Na medição de ${fmtData(d)}, um limite passou do ponto. O trecho fica em observação na próxima medição.`;
      } else {
        titulo = "Os três pontos estão dentro dos limites.";
        texto = `Na medição de ${fmtData(d)}, nenhum dos três números passou do limite.`;
      }
      resumo.innerHTML = `<div class="answer-icon">${NIVEL[nivelGeral].icone}</div><p class="answer-title">${titulo}</p><p class="answer-text">${texto}</p><div class="answer-actions"><a class="btn" href="monitoramento.html${crit.length ? `?ponto=${crit[crit.length - 1]}` : ""}">${crit.length ? `Ver o ${crit[crit.length - 1]} em detalhe` : "Ver os pontos"}</a><a class="btn btn-secondary" href="ocorrencia.html">Avisar um problema</a></div>`;
    }
  }

  function initMonitoramento() {
    const params = new URLSearchParams(location.search);
    let pontoId = (params.get("ponto") || "").toUpperCase();
    let data = params.get("data") || ultimaData();
    const aviso = $("#param-warning");
    const avisos = [];

    if (pontoId && !pontoPorId(pontoId)) {
      avisos.push(`Não existe o ponto “${esc(params.get("ponto"))}”. Os pontos são P1, P2 e P3, então mostramos o P1.`);
      pontoId = "P1";
    }
    if (!pontoId) pontoId = "P1";
    if (!datas().includes(data)) {
      const bruto = params.get("data");
      if (bruto) avisos.push(`Não tem medição em ${/^\d{4}-\d{2}-\d{2}$/.test(bruto) ? fmtData(bruto) : `“${esc(bruto)}”`}, então mostramos a mais recente (${fmtData(ultimaData())}).`);
      data = ultimaData();
    }
    if (aviso && avisos.length) {
      aviso.hidden = false;
      aviso.innerHTML = `<h2>Não deu para mostrar exatamente o que você pediu</h2><p>${avisos.join("<br>")}</p>`;
    }

    const selData = $("#sel-data");
    selData.innerHTML = datas()
      .slice()
      .reverse()
      .map((d, i) => `<option value="${d}">${fmtData(d)}${i === 0 ? " (mais recente)" : ""}</option>`)
      .join("");

    const render = (anunciar) => {
      const p = pontoPorId(pontoId);
      const m = medicao(pontoId, data);
      const av = avaliar(m);
      const ds = datas();
      const anterior = ds.indexOf(data) > 0 ? medicao(pontoId, ds[ds.indexOf(data) - 1]) : null;

      $$("input[name='ponto']").forEach((r) => (r.checked = r.value === pontoId));
      selData.value = data;
      ECB.pontos.forEach((q) => {
        const st = $(`#rail-status-${q.id}`);
        if (st) st.innerHTML = badge(avaliar(medicao(q.id, data)).nivel, true);
      });

      $("#ponto-titulo").textContent = `${p.id} — ${p.nome}`;
      $("#ponto-desc").textContent = `${p.descricao} Medição de ${fmtData(data)}.`;

      const n = NIVEL[av.nivel];
      const v = $("#verdict");
      v.className = `verdict ${n.classe === "neutral" ? "" : n.classe}`;
      let corpo;
      if (av.nivel === "ok") corpo = "<p>Nenhum dos três limites didáticos (pH, turbidez e oxigênio dissolvido) passou do ponto nesta medição.</p>";
      else if (av.nivel === "na") corpo = `<p>Faltam leituras de: ${av.ausentes.map((c) => IND[c].nome).join(", ")}. Sem elas não dá para classificar o ponto. Falta de leitura não quer dizer que está tudo bem.</p>`;
      else corpo = `<p>Por quê? ${av.ultrapassados.length === 1 ? "Um dos três limites passou do ponto" : `${av.ultrapassados.length === 2 ? "Dois" : "Os três"} limites passaram do ponto`}:</p><ul>${av.ultrapassados.map((c) => `<li>${descreverExcesso(c, m[c])}</li>`).join("")}</ul>`;
      if (av.nivel === "warn" || av.nivel === "crit") {
        const abertas = Ocorrencias.todas().filter((o) => o.ponto === pontoId && o.status !== "Concluída").length;
        const feito = av.nivel === "crit"
          ? "A equipe ambiental programa vistoria de campo e nova coleta neste trecho."
          : "O trecho fica em observação na próxima medição.";
        corpo += `<div class="next-steps"><h3>O que fazemos agora</h3><p>${feito} ${abertas ? `Moradores deste trecho já mandaram ${abertas} ${abertas === 1 ? "aviso que ainda está aberto" : "avisos que ainda estão abertos"}.` : ""}</p><p>Viu algo diferente por aqui? <a href="ocorrencia.html?local=${pontoId}">Avise um problema no ${pontoId}</a>.</p></div>`;
      }
      v.innerHTML = `<div class="v-icon">${n.icone}</div><div><h2>Situação: ${n.rotulo}</h2>${corpo}</div>`;

      $("#readings").innerHTML = Object.keys(IND)
        .map((cod) => {
          const i = IND[cod];
          const val = m ? m[cod] : null;
          const over = ultrapassa(cod, val);
          let cls = "reading";
          if (val == null) cls += " na";
          else if (!i.entraNoAlerta) cls += " ctx";
          else if (over) cls += " over";
          let status;
          if (val == null) status = `<p class="r-status">${ICON.na} Sem leitura nesta data</p>`;
          else if (!i.entraNoAlerta) status = `<p class="r-status">${ICON.info} Só contexto: não acende alerta</p>`;
          else if (over) status = `<p class="r-status">${ICON.crit} Passou do limite de alerta</p>`;
          else status = `<p class="r-status ok">${ICON.ok} Dentro do limite de alerta</p>`;
          let tendencia = "";
          if (anterior && anterior[cod] != null && val != null) {
            const dif = val - anterior[cod];
            const txt = Math.abs(dif) < 1e-9 ? "igual à semana anterior" : `${dif > 0 ? "subiu" : "caiu"} ${fmtNum(Math.abs(dif), i.casas)}${i.unidade ? " " + i.unidade : ""} desde ${fmtDataCurta(anterior.data)}`;
            tendencia = `<p class="r-trend">${dif > 0 ? ICON.up : dif < 0 ? ICON.down : ICON.flat} <span>${txt[0].toUpperCase() + txt.slice(1)}</span></p>`;
          } else if (!anterior) {
            tendencia = `<p class="r-trend">Primeira medição do período, sem comparação.</p>`;
          }
          return `<div class="${cls}">
              <p class="r-name"><span>${i.nomeLongo}</span>${i.simulado ? '<span class="tag sim">simulado pelo grupo</span>' : ""}</p>
              <p class="r-value">${val == null ? "—" : fmtNum(val, i.casas)}${val != null && i.unidade ? `<small>${i.unidade}</small>` : ""}</p>
              ${status}
              <p class="r-rule">${i.regra}</p>
              ${tendencia}
            </div>`;
        })
        .join("");

      const e = ednaDo(pontoId);
      $("#edna-mini").innerHTML = e
        ? `<p>Peixe nativo: ${badgeEdna(e.peixe)}</p><p>Cianobactéria: ${badgeEdna(e.ciano)}</p><p class="small muted">O laboratório não informou a data da coleta.</p><a class="go" href="biotecnologia.html#ponto-${pontoId}">O que isso quer dizer no ${pontoId}</a>`
        : `<p>Ainda não há resultado de DNA ambiental para este ponto.</p>`;

      const linhas = medicoesDo(pontoId)
        .map((x) => {
          const a = avaliar(x);
          const cel = (cod) => {
            const i = IND[cod];
            const o = ultrapassa(cod, x[cod]);
            return `<td data-label="${ROTULO_COL[cod]}" class="num ${o === "acima" ? "over" : o === "abaixo" ? "under" : ""}">${fmtNum(x[cod], i.casas)}${o ? `<span class="visually-hidden"> (fora do limite)</span>` : ""}</td>`;
          };
          return `<tr${x.data === data ? ' aria-current="true"' : ""}><th scope="row">${fmtData(x.data)}${x.data === data ? '<span class="visually-hidden"> (data escolhida)</span>' : ""}</th>${cel("ph")}${cel("turbidez")}${cel("od")}${cel("temperatura")}<td data-label="Classificação">${badge(a.nivel, true)}</td></tr>`;
        })
        .join("");
      $("#hist-body").innerHTML = linhas;
      $("#hist-caption").firstChild.textContent = `Todas as medições do ${p.id} — ${p.nome}`;

      const url = new URL(location.href);
      url.searchParams.set("ponto", pontoId);
      url.searchParams.set("data", data);
      history.replaceState(null, "", url);
      document.title = `${p.id} ${p.nome} — Pontos de coleta | EcoCidade Bio`;

      if (anunciar) $("#live").textContent = `Mostrando o ${p.id}, ${p.nome}, na medição de ${fmtData(data)}: ${n.rotulo}.`;
    };

    const limparAviso = () => { if (aviso) aviso.hidden = true; };
    $$("input[name='ponto']").forEach((r) =>
      r.addEventListener("change", () => {
        pontoId = r.value;
        limparAviso();
        render(true);
      })
    );
    selData.addEventListener("change", () => {
      data = selData.value;
      limparAviso();
      render(true);
    });

    const d = ultimaData();
    $("#alert-date").textContent = fmtData(d);
    $("#alerts-body").innerHTML = ECB.pontos
      .map((p) => ({ p, m: medicao(p.id, d) }))
      .map(({ p, m }) => ({ p, m, av: avaliar(m) }))
      .sort((a, b) => b.av.ultrapassados.length - a.av.ultrapassados.length)
      .map(
        ({ p, m, av }) =>
          `<tr><th scope="row"><a href="?ponto=${p.id}&data=${d}">${p.id} — ${esc(p.nome)}</a></th><td data-label="Classificação">${badge(av.nivel, true)}</td><td data-label="Limites ultrapassados" class="num">${av.ultrapassados.length}</td><td data-label="O que passou do limite">${av.ultrapassados.length ? av.ultrapassados.map((c) => IND[c].nome).join(", ") : "Nada"}</td></tr>`
      )
      .join("");

    render(false);
  }

  const SERIE = {
    P1: { cor: "var(--s1)", traco: "", forma: "circulo", nomeForma: "círculo, linha contínua" },
    P2: { cor: "var(--s2)", traco: "9 6", forma: "quadrado", nomeForma: "quadrado, linha tracejada" },
    P3: { cor: "var(--s3)", traco: "2 5", forma: "triangulo", nomeForma: "triângulo, linha pontilhada" }
  };

  function marcador(forma, x, y, cor) {
    if (forma === "quadrado") return `<rect class="pt-mark" x="${x - 6}" y="${y - 6}" width="12" height="12" fill="${cor}" stroke="#fff" stroke-width="2"/>`;
    if (forma === "triangulo") return `<path class="pt-mark" d="M${x} ${y - 8} L${x + 7.5} ${y + 5.5} L${x - 7.5} ${y + 5.5}Z" fill="${cor}" stroke="#fff" stroke-width="2"/>`;
    return `<circle class="pt-mark" cx="${x}" cy="${y}" r="6.5" fill="${cor}" stroke="#fff" stroke-width="2"/>`;
  }

  function desenharGrafico(svg, cod, pontosSel, ds) {
    const i = IND[cod];
    const W = Math.max(300, Math.round(svg.getBoundingClientRect().width) || 760);
    const estreito = W < 560;
    const H = estreito ? 320 : 380, m = { t: 26, r: estreito ? 84 : 132, b: 48, l: estreito ? 42 : 58 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const vals = [];
    pontosSel.forEach((pid) => ds.forEach((d) => { const x = medicao(pid, d); if (x && x[cod] != null) vals.push(x[cod]); }));
    const lims = [];
    if (i.min != null) lims.push({ v: i.min, t: `limite ${fmtNum(i.min, i.casas)}` });
    if (i.max != null) lims.push({ v: i.max, t: `limite ${fmtNum(i.max, i.casas)}` });
    const todos = vals.concat(lims.map((l) => l.v));
    let lo = Math.min(...todos), hi = Math.max(...todos);
    if (cod === "turbidez" || cod === "od") lo = 0;
    else lo = Math.floor(lo - (hi - lo) * 0.15 - 0.5);
    hi = hi + (hi - lo) * 0.12;
    const passo = (() => {
      const bruto = (hi - lo) / 5;
      const mag = Math.pow(10, Math.floor(Math.log10(bruto)));
      const n = bruto / mag;
      return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
    })();
    lo = Math.floor(lo / passo) * passo;
    hi = Math.ceil(hi / passo) * passo;
    const X = (k) => m.l + (ds.length === 1 ? iw / 2 : (k * iw) / (ds.length - 1));
    const Y = (v) => m.t + ih - ((v - lo) / (hi - lo)) * ih;

    let g = "";
    g += `<g class="grid">`;
    for (let v = lo; v <= hi + 1e-9; v += passo) g += `<line x1="${m.l}" x2="${m.l + iw}" y1="${Y(v)}" y2="${Y(v)}"/>`;
    g += `</g><g class="axis">`;
    for (let v = lo; v <= hi + 1e-9; v += passo) g += `<text x="${m.l - 10}" y="${Y(v) + 4}" text-anchor="end">${fmtNum(v, passo < 1 ? 1 : 0)}</text>`;
    ds.forEach((d, k) => (g += `<text x="${X(k)}" y="${H - m.b + 24}" text-anchor="${ds.length > 1 && k === 0 && estreito ? "start" : ds.length > 1 && k === ds.length - 1 && estreito ? "end" : "middle"}">${estreito ? fmtDataCurta(d) : fmtData(d)}</text>`));
    g += `<text x="${m.l}" y="${m.t - 8}" font-weight="700">${i.nome}${i.unidade ? " (" + i.unidade + ")" : ""}</text>`;
    g += `</g>`;
    lims.forEach((l) => {
      g += `<g class="threshold"><line x1="${m.l}" x2="${m.l + iw}" y1="${Y(l.v)}" y2="${Y(l.v)}"/><text x="${m.l + iw + 8}" y="${Y(l.v) + 4}">${l.t}</text></g>`;
    });

    const etiquetas = [];
    pontosSel.forEach((pid) => {
      const s = SERIE[pid];
      const pts = ds.map((d, k) => ({ d, k, x: medicao(pid, d) })).filter((o) => o.x && o.x[cod] != null);
      if (!pts.length) return;
      const path = pts.map((o, j) => `${j ? "L" : "M"}${X(o.k)} ${Y(o.x[cod])}`).join(" ");
      g += `<path d="${path}" fill="none" stroke="${s.cor}" stroke-width="3" stroke-dasharray="${s.traco}" stroke-linejoin="round" stroke-linecap="round"/>`;
      pts.forEach((o) => {
        const val = o.x[cod];
        const fora = ultrapassa(cod, val);
        const rot = `${pid}, ${fmtData(o.d)}: ${fmtNum(val, i.casas)}${i.unidade ? " " + i.unidade : ""}${fora ? ", fora do limite" : ""}`;
        g += `<g class="pt" data-tip="${rot}">${marcador(s.forma, X(o.k), Y(val), s.cor)}</g>`;
      });
      const ult = pts[pts.length - 1];
      etiquetas.push({ pid, y: Y(ult.x[cod]), cor: s.cor, val: ult.x[cod] });
    });
    etiquetas.sort((a, b) => a.y - b.y);
    for (let k = 1; k < etiquetas.length; k++) if (etiquetas[k].y - etiquetas[k - 1].y < 18) etiquetas[k].y = etiquetas[k - 1].y + 18;
    etiquetas.forEach((e) => (g += `<text class="series-label" x="${m.l + iw + 12}" y="${e.y + 5}" fill="${e.cor}">${e.pid} · ${fmtNum(e.val, i.casas)}</text>`));

    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = g;
  }

  function initHistorico() {
    const ds = datas();
    const selInd = $("#sel-indicador");
    const selIni = $("#sel-inicio");
    const selFim = $("#sel-fim");
    const err = $("#filtro-erro");
    const opts = ds.map((d) => `<option value="${d}">${fmtData(d)}</option>`).join("");
    selIni.innerHTML = opts;
    selFim.innerHTML = opts;
    selIni.value = ds[0];
    selFim.value = ds[ds.length - 1];

    const params = new URLSearchParams(location.search);
    if (params.get("indicador") && IND[params.get("indicador")]) selInd.value = params.get("indicador");

    const tip = document.createElement("div");
    tip.className = "chart-tip";
    tip.hidden = true;
    document.body.appendChild(tip);

    const svg = $("#chart");
    const mostrarTip = (el, ev) => {
      tip.textContent = el.dataset.tip;
      tip.hidden = false;
      const r = el.getBoundingClientRect();
      tip.style.left = `${window.scrollX + r.left + r.width / 2 + 10}px`;
      tip.style.top = `${window.scrollY + r.top - 40}px`;
    };
    svg.addEventListener("mouseover", (ev) => { const p = ev.target.closest(".pt"); if (p) mostrarTip(p, ev); });
    svg.addEventListener("mouseout", (ev) => { if (ev.target.closest(".pt")) tip.hidden = true; });
    svg.addEventListener("focusin", (ev) => { const p = ev.target.closest(".pt"); if (p) mostrarTip(p, ev); });
    svg.addEventListener("focusout", () => (tip.hidden = true));

    const render = () => {
      const cod = selInd.value;
      const i = IND[cod];
      const pontosSel = $$("input[name='serie']:checked").map((c) => c.value);
      const ini = selIni.value, fim = selFim.value;
      const problemas = [];
      if (!pontosSel.length) problemas.push("Marque pelo menos um ponto para desenhar o gráfico.");
      if (ini > fim) problemas.push(`A data “De” (${fmtData(ini)}) ficou depois da data “Até” (${fmtData(fim)}). Escolha um “De” igual ou anterior ao “Até”.`);
      if (problemas.length) {
        err.hidden = false;
        err.innerHTML = `<h2>Não deu para montar o gráfico</h2><ul>${problemas.map((p) => `<li>${p}</li>`).join("")}</ul>`;
        selIni.setAttribute("aria-invalid", String(ini > fim));
        $("#chart-card").hidden = true;
        $("#data-section").hidden = true;
        $("#live").textContent = problemas.join(" ");
        return;
      }
      err.hidden = true;
      $("#chart-card").hidden = false;
      $("#data-section").hidden = false;
      selIni.removeAttribute("aria-invalid");
      const periodo = ds.filter((d) => d >= ini && d <= fim);

      $("#chart-title").textContent = `${i.nome} por ponto de coleta`;
      $("#chart-sub").innerHTML = `${fmtData(periodo[0])} a ${fmtData(periodo[periodo.length - 1])} · ${i.regra}${i.simulado ? ' · <span class="tag sim">Valores simulados pelo grupo</span>' : ""}`;
      desenharGrafico(svg, cod, pontosSel, periodo);
      svg.setAttribute("aria-label", `Gráfico de linhas: ${i.nome} em ${pontosSel.join(", ")} entre ${fmtData(periodo[0])} e ${fmtData(periodo[periodo.length - 1])}. Os valores estão na tabela abaixo do gráfico.`);

      $("#legend").innerHTML = pontosSel
        .map((pid) => {
          const s = SERIE[pid];
          return `<li><svg width="34" height="16" aria-hidden="true"><line x1="2" x2="32" y1="8" y2="8" stroke="${s.cor}" stroke-width="3" stroke-dasharray="${s.traco}"/>${marcador(s.forma, 17, 8, s.cor)}</svg>${pid} — ${esc(pontoPorId(pid).nome)} <span class="visually-hidden">(${s.nomeForma})</span></li>`;
        })
        .join("") + (i.min != null || i.max != null ? `<li><svg width="34" height="16" aria-hidden="true"><line x1="2" x2="32" y1="8" y2="8" stroke="var(--crit)" stroke-width="2" stroke-dasharray="8 5"/></svg>Limite de alerta (didático)</li>` : "");

      const frases = pontosSel.map((pid) => {
        const serie = periodo.map((d) => medicao(pid, d)).filter((x) => x && x[cod] != null);
        if (!serie.length) return `<li><strong>${pid}:</strong> não tem leituras neste período.</li>`;
        const a = serie[0][cod], b = serie[serie.length - 1][cod];
        const fora = serie.filter((x) => ultrapassa(cod, x[cod])).length;
        const dif = b - a;
        const pct = a ? Math.round((dif / a) * 100) : 0;
        const mov = serie.length === 1 ? `ficou em ${fmtNum(a, i.casas)}${i.unidade ? " " + i.unidade : ""}` : Math.abs(dif) < 1e-9 ? `ficou estável em ${fmtNum(a, i.casas)}` : `${dif > 0 ? "subiu" : "caiu"} de ${fmtNum(a, i.casas)} para ${fmtNum(b, i.casas)}${i.unidade ? " " + i.unidade : ""} (${dif > 0 ? "+" : ""}${pct}%)`;
        const lim = i.entraNoAlerta ? `; ${fora === 0 ? "nenhuma" : fora} de ${serie.length} medições ${fora > 1 ? "passaram" : "passou"} do limite` : "";
        return `<li><strong>${pid} — ${esc(pontoPorId(pid).nome)}:</strong> ${mov}${lim}.</li>`;
      });
      $("#chart-text").innerHTML = frases.join("");

      $("#data-head").innerHTML = `<tr><th scope="col">Data</th>${pontosSel.map((pid) => `<th scope="col" class="num">${pid} — ${esc(pontoPorId(pid).nome)}</th>`).join("")}</tr>`;
      $("#data-body").innerHTML = periodo
        .map((d) => `<tr><th scope="row">${fmtData(d)}</th>${pontosSel.map((pid) => {
          const x = medicao(pid, d);
          const v = x ? x[cod] : null;
          const o = ultrapassa(cod, v);
          return `<td data-label="${pid} — ${esc(pontoPorId(pid).nome)}" class="num ${o === "acima" ? "over" : o === "abaixo" ? "under" : ""}">${v == null ? "sem leitura" : fmtNum(v, i.casas)}${o ? '<span class="visually-hidden"> (fora do limite)</span>' : ""}</td>`;
        }).join("")}</tr>`)
        .join("");
      $("#data-caption").innerHTML = `Os números do gráfico: ${i.nome.toLowerCase() === "ph" ? "pH" : i.nome.toLowerCase()}${i.unidade ? " (" + i.unidade + ")" : ""}<small><span class="arrow-up" aria-hidden="true"></span> acima do limite · <span class="arrow-down" aria-hidden="true"></span> abaixo do limite · fonte: ${ECB.fontes[cod]}</small>`;

      const url = new URL(location.href);
      url.searchParams.set("indicador", cod);
      history.replaceState(null, "", url);
      $("#live").textContent = `Gráfico atualizado: ${i.nome}, ${pontosSel.join(", ")}.`;
    };

    $("#chart-form").addEventListener("submit", (ev) => { ev.preventDefault(); render(); });
    let larguraAnterior = svg.getBoundingClientRect().width;
    let espera;
    window.addEventListener("resize", () => {
      clearTimeout(espera);
      espera = setTimeout(() => {
        const w = svg.getBoundingClientRect().width;
        if (w && Math.abs(w - larguraAnterior) > 8) { larguraAnterior = w; render(); }
      }, 150);
    });
    [selInd, selIni, selFim].forEach((el) => el.addEventListener("change", render));
    $$("input[name='serie']").forEach((c) => c.addEventListener("change", render));

    $("#btn-csv").addEventListener("click", () => {
      const linhas = [["data", "ponto", "ph", "turbidez_ntu", "oxigenio_dissolvido_mg_l", "temperatura_c_simulada", "classificacao"]];
      ECB.medicoes.forEach((x) => linhas.push([fmtData(x.data), x.ponto, fmtNum(x.ph, 1), x.turbidez, fmtNum(x.od, 1), fmtNum(x.temperatura, 1), avaliar(x).rotulo]));
      baixarCSV("ecocidade-bio-medicoes-simuladas.csv", linhas);
      $("#live").textContent = "Pronto: a planilha CSV com todas as medições foi gerada.";
    });

    render();
  }

  function initConsultaProtocolo() {
    const f = $("#form-protocolo");
    if (!f) return;
    const campo = $("#protocolo"), erro = $("#protocolo-erro"), res = $("#protocolo-resultado");
    campo.addEventListener("input", () => { erro.textContent = ""; campo.removeAttribute("aria-invalid"); });
    f.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const v = campo.value.trim().toUpperCase().replace(/\s+/g, "");
      res.innerHTML = "";
      if (!/^ECB-\d{4}-\d{4}$/.test(v)) {
        erro.textContent = "Digite o protocolo assim: ECB-2026-0101 (as letras ECB, o ano e quatro números).";
        campo.setAttribute("aria-invalid", "true");
        campo.focus();
        return;
      }
      const o = Ocorrencias.todas().find((x) => x.protocolo === v);
      res.innerHTML = o
        ? `<p class="panel-inset"><strong>${v}</strong>: ${esc(o.tipo)}, visto em ${fmtData(o.data)}.<br>Como está agora: <strong>${o.status}</strong>.</p>`
        : `<p class="panel-inset">Não achamos o protocolo <strong>${v}</strong>. Confira os números ou procure o atendimento presencial.</p>`;
    });
  }

  function initOcorrencia() {
    initConsultaProtocolo();
    const form = $("#form-ocorrencia");
    if (!form) return;
    const sumario = $("#error-summary");
    const desc = $("#descricao");
    const cont = $("#descricao-contador");
    const MAX = 500, MIN = 10;
    const hoje = hojeISO();
    $("#data-fato").max = hoje;

    const contato = $("#bloco-contato");
    const atualizarContato = () => {
      const quer = $("input[name='retorno']:checked")?.value === "sim";
      contato.hidden = !quer;
      $("#email").required = quer;
      $("#consentimento").required = quer;
    };
    $$("input[name='retorno']").forEach((r) => r.addEventListener("change", atualizarContato));
    atualizarContato();

    const localSel = $("#local");
    const refHint = $("#referencia-dica");
    const atualizarLocal = () => {
      const outro = localSel.value === "outro";
      $("#referencia").required = outro;
      $("#ref-opt").textContent = outro ? "(obrigatório para “outro lugar”)" : "(opcional)";
      refHint.textContent = outro
        ? "Conte onde fica: rua, ponte, praça ou algo conhecido por perto."
        : "Ajuda a equipe a achar o lugar. Por exemplo: “margem perto da ponte da rua A”.";
    };
    localSel.addEventListener("change", atualizarLocal);
    atualizarLocal();

    const contar = () => {
      const n = desc.value.length;
      cont.textContent = `${n} de ${MAX} caracteres`;
      cont.classList.toggle("over", n > MAX);
    };
    desc.addEventListener("input", contar);
    contar();

    const setErro = (campo, msg) => {
      const el = $(`#${campo}-erro`);
      const alvo = campo === "tipo" ? $("input[name='tipo']") : campo === "retorno" ? null : $(`#${campo}`);
      if (el) el.textContent = msg || "";
      if (campo === "tipo") $$("input[name='tipo']").forEach((r) => (msg ? r.setAttribute("aria-invalid", "true") : r.removeAttribute("aria-invalid")));
      else if (alvo) msg ? alvo.setAttribute("aria-invalid", "true") : alvo.removeAttribute("aria-invalid");
    };

    const validar = () => {
      const erros = [];
      const tipo = $("input[name='tipo']:checked");
      if (!tipo) erros.push(["tipo", "Escolha o que você viu."]);
      if (!localSel.value) erros.push(["local", "Escolha onde foi."]);
      const ref = $("#referencia").value.trim();
      if (localSel.value === "outro" && ref.length < 5) erros.push(["referencia", "Conte onde fica com pelo menos 5 caracteres (por exemplo, a rua ou algo conhecido por perto)."]);
      if (ref.length > 120) erros.push(["referencia", "Use no máximo 120 caracteres no ponto de referência."]);
      const df = $("#data-fato").value;
      if (!df) erros.push(["data-fato", "Informe o dia em que você viu o problema."]);
      else if (df > hoje) erros.push(["data-fato", `Essa data ainda não chegou. Informe um dia até ${fmtData(hoje)}.`]);
      else if (df < "2025-01-01") erros.push(["data-fato", "Informe um dia a partir de 01/01/2025. Para casos mais antigos, procure o atendimento presencial."]);
      const d = desc.value.trim();
      if (d.length < MIN) erros.push(["descricao", `Conte o que viu com pelo menos ${MIN} caracteres. Até agora são ${d.length}.`]);
      else if (d.length > MAX) erros.push(["descricao", `O texto tem ${d.length} caracteres. Encurte para no máximo ${MAX}.`]);
      else if (/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/.test(d)) erros.push(["descricao", "Parece que o texto tem um CPF. Para proteger você, tire documentos e dados pessoais do texto."]);
      if ($("input[name='retorno']:checked")?.value === "sim") {
        const em = $("#email").value.trim();
        if (!em) erros.push(["email", "Informe um e-mail para receber o retorno, ou escolha “Não, quero avisar sem me identificar”."]);
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) erros.push(["email", "Escreva o e-mail assim: nome@exemplo.com."]);
        if (!$("#consentimento").checked) erros.push(["consentimento", "Para usarmos seu e-mail, marque a autorização. Se preferir, escolha “Não, quero avisar sem me identificar”."]);
      }
      return erros;
    };

    ["tipo", "local", "referencia", "data-fato", "descricao", "email", "consentimento"].forEach((c) => setErro(c, ""));

    const campoDe = (el) => (el.name === "tipo" ? "tipo" : el.name === "retorno" ? null : el.id);
    form.addEventListener("input", (ev) => { const c = campoDe(ev.target); if (c) setErro(c, ""); });
    form.addEventListener("change", (ev) => {
      const c = campoDe(ev.target);
      if (c) setErro(c, "");
      if (ev.target.name === "retorno") { setErro("email", ""); setErro("consentimento", ""); }
      if (c === "local") setErro("referencia", "");
    });

    const localParam = (new URLSearchParams(location.search).get("local") || "").toUpperCase();
    if (pontoPorId(localParam)) { localSel.value = localParam; atualizarLocal(); }

    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      ["tipo", "local", "referencia", "data-fato", "descricao", "email", "consentimento"].forEach((c) => setErro(c, ""));
      const erros = validar();
      if (erros.length) {
        const vistos = new Set();
        erros.forEach(([c, m]) => { if (!vistos.has(c)) { setErro(c, m); vistos.add(c); } });
        sumario.hidden = false;
        sumario.innerHTML = `<h2 id="error-summary-title">Falta ajustar ${erros.length === 1 ? "1 coisa" : erros.length + " coisas"} para enviar</h2><ul>${erros
          .map(([c, m]) => `<li><a href="#${c === "tipo" ? "tipo-1" : c}">${m}</a></li>`)
          .join("")}</ul>`;
        sumario.focus();
        return;
      }
      sumario.hidden = true;
      const btn = $("#btn-enviar");
      btn.disabled = true;
      btn.textContent = "Enviando seu aviso…";

      const quer = $("input[name='retorno']:checked")?.value === "sim";
      const o = {
        protocolo: Ocorrencias.proximoProtocolo(),
        data: $("#data-fato").value,
        registradoEm: hoje,
        tipo: $("input[name='tipo']:checked").value,
        ponto: localSel.value === "outro" ? null : localSel.value,
        referencia: $("#referencia").value.trim(),
        descricao: desc.value.trim(),
        contato: quer ? $("#email").value.trim() : null,
        status: "Recebida"
      };
      setTimeout(() => {
        const ok = Ocorrencias.salvar(o);
        form.hidden = true;
        $("#form-intro").hidden = true;
        const painel = $("#success");
        painel.hidden = false;
        painel.innerHTML = `
          <h2 tabindex="-1" id="success-title">Pronto! Recebemos seu aviso.</h2>
          <p>Guarde este número de protocolo para acompanhar o atendimento:</p>
          <p><span class="protocol">${o.protocolo}</span></p>
          <dl class="summary-list">
            <dt>O que foi visto</dt><dd>${esc(o.tipo)}</dd>
            <dt>Onde</dt><dd>${o.ponto ? `${o.ponto} — ${esc(pontoPorId(o.ponto).nome)}` : "Outro lugar do córrego"}${o.referencia ? ` (${esc(o.referencia)})` : ""}</dd>
            <dt>Quando</dt><dd>${fmtData(o.data)}</dd>
            <dt>Retorno</dt><dd>${o.contato ? "Por e-mail (autorizado)" : "Sem retorno: aviso sem identificação"}</dd>
          </dl>
          <p><strong>E agora?</strong> A equipe de fiscalização ambiental vai analisar o aviso. Ele começa como <em>Recebida</em>. ${o.contato ? "Você também vai receber notícias no e-mail informado." : ""} Para ver como está, use “Já avisou? Acompanhe aqui” nesta página, com o número do protocolo.</p>
          ${ok ? "" : '<p class="callout caution">Não deu para salvar neste navegador (por exemplo, numa janela anônima). Anote o protocolo; no sistema real o aviso iria para o servidor.</p>'}
          <p class="small muted">Protótipo: o aviso fica salvo só neste navegador e aparece no Painel e na Área do agente.</p>
          <div class="actions"><a class="btn" href="ocorrencia.html">Avisar outro problema</a><a class="btn btn-secondary" href="index.html">Voltar ao Painel</a></div>`;
        $("#success-title").focus();
      }, 450);
    });
  }

  function initBiotecnologia() {
    const corpo = $("#edna-body");
    if (corpo)
      corpo.innerHTML = ECB.edna
        .map((e) => `<tr><th scope="row">${e.ponto} — ${esc(pontoPorId(e.ponto).nome)}</th><td data-label="Marcador de peixe nativo">${badgeEdna(e.peixe)}</td><td data-label="Marcador de cianobactéria">${badgeEdna(e.ciano)}</td><td data-label="Data da coleta">${fmtData(e.dataColeta)}</td></tr>`)
        .join("");

    const integ = $("#integrated");
    if (!integ) return;
    const d = ultimaData();
    integ.innerHTML = ECB.pontos
      .map((p) => {
        const m = medicao(p.id, d);
        const av = avaliar(m);
        const e = ednaDo(p.id);
        const leitura = (marc, res) => {
          const M = ECB.marcadores[marc];
          return res === "Detectado" ? M.leituraDetectado : res === "Não detectado" ? M.leituraNaoDetectado : M.leituraIndeterminado;
        };
        const fora = (cod) => (ultrapassa(cod, m[cod]) ? " — passou do limite" : "");
        let sintese;
        if (p.id === "P1") sintese = "Os números físicos e químicos estão dentro dos limites e foi achado DNA de peixe nativo. Por enquanto, os dados não pedem investigação prioritária aqui.";
        else if (p.id === "P2") sintese = "Dois limites passaram do ponto na última medição, e o resultado para cianobactéria ficou indeterminado. O recomendado é repetir a análise de eDNA e acompanhar a piora da turbidez e do oxigênio.";
        else sintese = "Três limites passaram do ponto, não foi achado DNA de peixe nativo e foi achado DNA de cianobactéria. É o ponto que mais pede investigação. Os dados mostram uma condição crítica, mas não dizem de onde vem a poluição.";
        return `
        <article class="panel" id="ponto-${p.id}" aria-labelledby="int-${p.id}">
          <div class="panel-head">
            <h3 id="int-${p.id}" class="mt-0">${p.id} — ${esc(p.nome)}</h3>
            ${badge(av.nivel, true)}
          </div>
          <div class="table-wrap" role="region" aria-label="Indicadores do ${p.id}" tabindex="0">
            <table class="table-stack">
              <caption class="visually-hidden">Indicadores físicos, químicos e biológicos do ${p.id} em ${fmtData(d)}</caption>
              <thead><tr><th scope="col">Tipo</th><th scope="col">Indicador</th><th scope="col">Resultado</th></tr></thead>
              <tbody>
                <tr><th scope="row" rowspan="2">Físico</th><td data-label="Indicador">Turbidez</td><td data-label="Resultado">${fmtNum(m.turbidez, 0)} NTU${fora("turbidez")}</td></tr>
                <tr><td data-label="Indicador">Temperatura <span class="tag sim">simulado</span></td><td data-label="Resultado">${fmtNum(m.temperatura, 1)} °C</td></tr>
                <tr><th scope="row" rowspan="2">Químico</th><td data-label="Indicador">pH</td><td data-label="Resultado">${fmtNum(m.ph, 1)}${fora("ph")}</td></tr>
                <tr><td data-label="Indicador">Oxigênio dissolvido</td><td data-label="Resultado">${fmtNum(m.od, 1)} mg/L${fora("od")}</td></tr>
                <tr><th scope="row" rowspan="2">Biológico (eDNA)</th><td data-label="Indicador">Peixe nativo</td><td data-label="Resultado">${badgeEdna(e.peixe)}</td></tr>
                <tr><td data-label="Indicador">Cianobactéria</td><td data-label="Resultado">${badgeEdna(e.ciano)}</td></tr>
              </tbody>
            </table>
          </div>
          <h4>Como ler o DNA deste ponto <span class="tag">resultado simulado</span></h4>
          <ul>
            <li><strong>Peixe nativo:</strong> ${leitura("peixe", e.peixe)}</li>
            <li><strong>Cianobactéria:</strong> ${leitura("ciano", e.ciano)}</li>
          </ul>
          <p class="callout limits"><strong>Juntando tudo <span class="tag">interpretação</span>:</strong> ${sintese}</p>
        </article>`;
      })
      .join("");
  }

  function initAdmin() {
    const d = ultimaData();
    const avs = ECB.pontos.map((p) => ({ p, av: avaliar(medicao(p.id, d)) }));
    const todas = () => Ocorrencias.todas();

    const kpis = () => {
      const oc = todas();
      const abertas = oc.filter((o) => o.status !== "Concluída").length;
      const crit = avs.filter((x) => x.av.nivel === "crit").length;
      const indet = ECB.edna.reduce((n, e) => n + (e.peixe === "Indeterminado") + (e.ciano === "Indeterminado"), 0);
      const ids = avs.filter((x) => x.av.nivel === "crit").map((x) => x.p.id);
      const abertasPrio = oc.filter((o) => o.status !== "Concluída" && nivelDo(o.ponto) === "crit").length;
      $("#kpis").innerHTML = `
        <li><strong>${crit} de 3 pontos</strong> estão em prioridade de investigação na medição de ${fmtData(d)}${ids.length ? `: ${ids.join(" e ")}` : ""}.</li>
        <li><strong>${abertas} ${abertas === 1 ? "aviso está" : "avisos estão"} em aberto</strong>, ${abertasPrio} deles em pontos prioritários (de ${oc.length} recebidos; ${ECB.ocorrenciasDemo.length} são fictícios, de demonstração).</li>
        <li><strong>${indet} resultado de eDNA ${indet === 1 ? "ficou" : "ficaram"} indeterminado</strong>: cianobactéria no P2. É preciso pedir nova análise.</li>`;
    };

    const nivelDo = (pid) => (pid ? (avs.find((x) => x.p.id === pid) || {}).av?.nivel : null);
    const PESO_TIPO = { "Animais mortos": 3, "Água com cor ou cheiro diferente": 3, "Espuma ou mancha na água": 2, "Descarte irregular de resíduos": 2, "Erosão ou assoreamento": 2, "Outro problema": 1 };
    const PESO_NIVEL = { crit: 2, warn: 1 };
    const urgencia = (o) => (o.status === "Concluída" ? -10 : 0) + (PESO_TIPO[o.tipo] || 1) + (PESO_NIVEL[nivelDo(o.ponto)] || 0);

    const renderAlertas = () => {
      const oc = todas();
      $("#adm-alert-body").innerHTML = avs
        .slice()
        .sort((a, b) => b.av.ultrapassados.length - a.av.ultrapassados.length)
        .map(({ p, av }) => {
          const m = medicao(p.id, d);
          const abertas = oc.filter((o) => o.ponto === p.id && o.status !== "Concluída").length;
          const acao = av.nivel === "crit" ? "Programar vistoria de campo e nova coleta" : av.nivel === "warn" ? "Acompanhar na próxima medição" : "Manter rotina";
          return `<tr><th scope="row">${p.id} — ${esc(p.nome)}</th><td data-label="Classificação">${badge(av.nivel, true)}</td><td data-label="Motivo">${av.ultrapassados.length ? av.ultrapassados.map((c) => descreverExcesso(c, m[c])).join("; ") : "Nenhum limite passou do ponto"}</td><td data-label="Ocorrências abertas">${abertas ? `<button type="button" class="btn btn-small btn-secondary" data-filtrar="${p.id}">Ver ${abertas}<span class="visually-hidden"> ${abertas === 1 ? "aviso aberto" : "avisos abertos"} no ${p.id}</span></button>` : "Nenhuma"}</td><td data-label="Ação sugerida">${acao}</td></tr>`;
        })
        .join("");
    };
    $("#adm-alert-body").addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-filtrar]");
      if (!b) return;
      $("#f-ponto").value = b.dataset.filtrar;
      $("#f-status").value = "";
      renderOc();
      $("#oc-titulo").scrollIntoView();
      $("#f-ponto").focus();
    });

    const STATUS = ["Recebida", "Em análise", "Encaminhada", "Concluída"];
    const fStatus = $("#f-status");
    const fPonto = $("#f-ponto");
    const tbody = $("#oc-body");
    const vazio = $("#oc-empty");
    const contagem = $("#oc-count");

    const renderOc = () => {
      const lista = todas()
        .filter((o) => (!fStatus.value || o.status === fStatus.value) && (!fPonto.value || (fPonto.value === "outro" ? !o.ponto : o.ponto === fPonto.value)))
        .sort((a, b) => urgencia(b) - urgencia(a) || b.data.localeCompare(a.data));
      contagem.textContent = `${lista.length} ${lista.length === 1 ? "aviso" : "avisos"}`;
      vazio.hidden = lista.length > 0;
      tbody.innerHTML = lista
        .map(
          (o) => `<tr>
            <th scope="row"><span class="nowrap">${o.protocolo}</span>${o.demo ? ' <span class="tag">demo</span>' : ' <span class="tag sim">novo</span>'}</th>
            <td class="nowrap" data-label="Data">${fmtData(o.data)}</td>
            <td data-label="Tipo">${esc(o.tipo)}</td>
            <td data-label="Local">${o.ponto ? `${o.ponto} — ${esc(pontoPorId(o.ponto).nome)}` : "Outro lugar"}${o.referencia ? `<br><small class="muted">${esc(o.referencia)}</small>` : ""}</td>
            <td data-label="Descrição">${esc(o.descricao)}</td>
            <td data-label="Situação"><label class="visually-hidden" for="st-${o.protocolo}">Situação do aviso ${o.protocolo}</label>
              <select id="st-${o.protocolo}" class="status-select" data-protocolo="${o.protocolo}">${STATUS.map((s) => `<option${s === o.status ? " selected" : ""}>${s}</option>`).join("")}</select></td>
          </tr>`
        )
        .join("");
    };

    let desfazer = null;
    tbody.addEventListener("focusin", (ev) => {
      const s = ev.target.closest(".status-select");
      if (s) s.dataset.anterior = s.value;
    });
    tbody.addEventListener("change", (ev) => {
      const s = ev.target.closest(".status-select");
      if (!s) return;
      const anterior = (todas().find((o) => o.protocolo === s.dataset.protocolo) || {}).status || s.dataset.anterior;
      Ocorrencias.mudarStatus(s.dataset.protocolo, s.value);
      desfazer = { protocolo: s.dataset.protocolo, status: anterior };
      $("#adm-live").innerHTML = `<p class="toast">O aviso ${s.dataset.protocolo} mudou de “${anterior}” para “${s.value}”. <button type="button" class="btn btn-small btn-secondary" id="btn-desfazer">Desfazer</button></p>`;
      s.dataset.anterior = s.value;
      kpis();
      renderAlertas();
    });
    $("#adm-live").addEventListener("click", (ev) => {
      if (ev.target.id !== "btn-desfazer" || !desfazer) return;
      Ocorrencias.mudarStatus(desfazer.protocolo, desfazer.status);
      $("#adm-live").innerHTML = `<p class="toast">Pronto, desfeito: o aviso ${desfazer.protocolo} voltou para “${desfazer.status}”.</p>`;
      const sel = $(`#st-${desfazer.protocolo}`);
      desfazer = null;
      kpis();
      renderAlertas();
      renderOc();
      if (sel) $(`#st-${sel.dataset.protocolo}`)?.focus();
    });
    [fStatus, fPonto].forEach((el) => el.addEventListener("change", () => { renderOc(); $("#adm-live").textContent = ""; }));
    $("#btn-limpar").addEventListener("click", () => { fStatus.value = ""; fPonto.value = ""; renderOc(); fStatus.focus(); });
    $("#btn-oc-csv").addEventListener("click", () => {
      const linhas = [["protocolo", "data", "tipo", "ponto", "referencia", "descricao", "situacao"]];
      todas().forEach((o) => linhas.push([o.protocolo, fmtData(o.data), o.tipo, o.ponto || "Outro lugar", o.referencia, o.descricao, o.status]));
      baixarCSV("ecocidade-bio-ocorrencias.csv", linhas);
    });

    kpis();
    renderAlertas();
    renderOc();
  }

  function initIndice() {
    const barra = $(".jump");
    const links = $$(".jump a[href^='#']");
    if (!barra || !links.length) return;
    const alvos = links.map((a) => document.getElementById(a.getAttribute("href").slice(1))).filter(Boolean);
    const marcar = (id) => links.forEach((a) => {
      if (a.getAttribute("href") === "#" + id) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
    let altura = 0;
    const medir = () => {
      altura = getComputedStyle(barra).position === "sticky" ? barra.offsetHeight : 0;
      document.documentElement.style.setProperty("--jump-h", altura + "px");
    };
    let pedido = 0;
    const atualizar = () => {
      pedido = 0;
      const limite = altura + 48;
      let atual = null;
      alvos.forEach((el) => { if (el.getBoundingClientRect().top <= limite) atual = el.id; });
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) atual = alvos[alvos.length - 1].id;
      if (atual) marcar(atual);
      else links.forEach((a) => a.removeAttribute("aria-current"));
    };
    medir();
    atualizar();
    addEventListener("scroll", () => { if (!pedido) pedido = requestAnimationFrame(atualizar); }, { passive: true });
    addEventListener("resize", () => { medir(); atualizar(); });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initPreferencias();
    initMenu();
    initIndice();
    const pagina = document.body.dataset.page;
    const init = { inicio: initInicio, monitoramento: initMonitoramento, historico: initHistorico, ocorrencia: initOcorrencia, biotecnologia: initBiotecnologia, admin: initAdmin }[pagina];
    try {
      if (init) init();
    } catch (e) {
      const main = $("main");
      const div = document.createElement("div");
      div.className = "callout caution";
      div.setAttribute("role", "alert");
      div.innerHTML = "<h2>Não conseguimos carregar os dados desta página</h2><p>Recarregue a página. Se continuar assim, os números também estão na tabela da página Gráficos.</p>";
      main.prepend(div);
      console.error(e);
    }
  });

  window.ECB.avaliar = avaliar;
})();
