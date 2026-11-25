window.ECB = window.ECB || {};

ECB.meta = {
  plataforma: "EcoCidade Bio",
  municipio: "Santa Aurora (município fictício)",
  corpoHidrico: "Córrego das Palmeiras",
  ultimaAtualizacao: "2026-10-16",
  aviso:
    "Dados simulados para atividade didática. Não constituem diagnóstico ambiental oficial nem recomendação sobre uso ou consumo da água."
};

ECB.pontos = [
  {
    id: "P1",
    nome: "Nascente",
    descricao: "Área próxima à nascente do córrego.",
    trecho: "Montante (início do córrego)",
    ordem: 1
  },
  {
    id: "P2",
    nome: "Trecho urbano",
    descricao: "Trecho urbano com ocupação residencial.",
    trecho: "Trecho intermediário",
    ordem: 2
  },
  {
    id: "P3",
    nome: "Trecho industrial",
    descricao: "Trecho situado a jusante (rio abaixo) de uma área industrial fictícia.",
    trecho: "Jusante (fim do trecho monitorado)",
    ordem: 3
  }
];

ECB.indicadores = {
  ph: {
    nome: "pH",
    nomeLongo: "pH da água",
    unidade: "",
    casas: 1,
    tipo: "Químico",
    regra: "Alerta se for inferior a 6,0 ou superior a 9,0",
    min: 6.0,
    max: 9.0,
    entraNoAlerta: true,
    explicacao:
      "Mede se a água está ácida (abaixo de 7), neutra (7) ou básica (acima de 7). Mudanças bruscas podem indicar lançamento de efluentes."
  },
  turbidez: {
    nome: "Turbidez",
    nomeLongo: "Turbidez",
    unidade: "NTU",
    casas: 0,
    tipo: "Físico",
    regra: "Alerta se for superior a 25 NTU",
    max: 25,
    entraNoAlerta: true,
    explicacao:
      "Indica quanto a água está turva, com partículas em suspensão (terra, resíduos, algas). Quanto maior o número, mais turva."
  },
  od: {
    nome: "Oxigênio dissolvido",
    nomeLongo: "Oxigênio dissolvido",
    unidade: "mg/L",
    casas: 1,
    tipo: "Químico",
    regra: "Alerta se for inferior a 5,0 mg/L",
    min: 5.0,
    entraNoAlerta: true,
    explicacao:
      "Quantidade de oxigênio disponível na água para peixes e outros organismos. Valores baixos dificultam a vida aquática."
  },
  temperatura: {
    nome: "Temperatura",
    nomeLongo: "Temperatura da água",
    unidade: "°C",
    casas: 1,
    tipo: "Físico",
    regra: "Sem limiar de alerta definido (indicador de contexto)",
    entraNoAlerta: false,
    simulado: true,
    explicacao:
      "Água mais quente retém menos oxigênio. Aqui a temperatura é usada apenas como contexto e não gera alerta."
  }
};

ECB.medicoes = [
  { data: "2026-10-02", ponto: "P1", ph: 7.1, turbidez: 9, od: 7.5, temperatura: 19.4 },
  { data: "2026-10-09", ponto: "P1", ph: 7.2, turbidez: 11, od: 7.3, temperatura: 19.8 },
  { data: "2026-10-16", ponto: "P1", ph: 7.0, turbidez: 12, od: 7.1, temperatura: 20.1 },
  { data: "2026-10-02", ponto: "P2", ph: 6.8, turbidez: 25, od: 5.8, temperatura: 21.2 },
  { data: "2026-10-09", ponto: "P2", ph: 6.9, turbidez: 33, od: 5.2, temperatura: 21.9 },
  { data: "2026-10-16", ponto: "P2", ph: 6.7, turbidez: 38, od: 4.8, temperatura: 22.4 },
  { data: "2026-10-02", ponto: "P3", ph: 6.4, turbidez: 35, od: 4.6, temperatura: 22.6 },
  { data: "2026-10-09", ponto: "P3", ph: 6.1, turbidez: 48, od: 4.1, temperatura: 23.5 },
  { data: "2026-10-16", ponto: "P3", ph: 5.8, turbidez: 62, od: 3.4, temperatura: 24.3 }
];

ECB.fontes = {
  ph: "Enunciado do projeto (dados simulados)",
  turbidez: "Enunciado do projeto (dados simulados)",
  od: "Enunciado do projeto (dados simulados)",
  temperatura: "Simulação do grupo (valores criados para completar a base)"
};

ECB.marcadores = {
  peixe: {
    nome: "Marcador de peixe nativo",
    oQueIndica:
      "Presença de DNA atribuído a espécies de peixes nativos do córrego.",
    leituraDetectado:
      "Foi encontrado DNA de peixe nativo na amostra. Sugere que esses peixes estiveram no trecho ou rio acima, mas não informa quantos são nem se estavam vivos no momento da coleta.",
    leituraNaoDetectado:
      "Não foi encontrado DNA de peixe nativo. Pode indicar ausência ou redução dessas espécies, mas também pode ocorrer por pouco DNA na amostra ou limitação do método.",
    leituraIndeterminado:
      "O laboratório não conseguiu concluir. É necessário repetir a análise."
  },
  ciano: {
    nome: "Marcador de cianobactéria",
    oQueIndica:
      "Presença de DNA de cianobactérias, microrganismos que podem se multiplicar em água com excesso de nutrientes e alguns tipos podem produzir toxinas.",
    leituraDetectado:
      "Foi encontrado DNA de cianobactéria. Não comprova produção de toxinas nem quantidade de células; indica que o trecho merece investigação.",
    leituraNaoDetectado:
      "Não foi encontrado DNA de cianobactéria nesta amostra.",
    leituraIndeterminado:
      "O resultado ficou inconclusivo (por exemplo, sinal fraco ou falha de controle de qualidade). É necessário repetir a análise antes de qualquer interpretação."
  }
};

ECB.edna = [
  { ponto: "P1", peixe: "Detectado", ciano: "Não detectado", dataColeta: null, laboratorio: "Laboratório parceiro (fictício)" },
  { ponto: "P2", peixe: "Detectado", ciano: "Indeterminado", dataColeta: null, laboratorio: "Laboratório parceiro (fictício)" },
  { ponto: "P3", peixe: "Não detectado", ciano: "Detectado", dataColeta: null, laboratorio: "Laboratório parceiro (fictício)" }
];

ECB.ocorrenciasDemo = [
  {
    protocolo: "ECB-2026-0101",
    data: "2026-10-05",
    tipo: "Descarte irregular de resíduos",
    ponto: "P2",
    referencia: "Margem próxima à ponte da rua fictícia A",
    descricao: "Sacos de lixo e entulho acumulados na margem do córrego.",
    status: "Encaminhada",
    demo: true
  },
  {
    protocolo: "ECB-2026-0102",
    data: "2026-10-11",
    tipo: "Água com cor ou cheiro diferente",
    ponto: "P3",
    referencia: "Trecho abaixo da área industrial",
    descricao: "Água escura e com cheiro forte durante a manhã.",
    status: "Em análise",
    demo: true
  },
  {
    protocolo: "ECB-2026-0103",
    data: "2026-10-14",
    tipo: "Animais mortos",
    ponto: "P3",
    referencia: "Próximo ao ponto de monitoramento P3",
    descricao: "Alguns peixes pequenos mortos na margem.",
    status: "Recebida",
    demo: true
  },
  {
    protocolo: "ECB-2026-0104",
    data: "2026-10-15",
    tipo: "Outro problema",
    ponto: "P1",
    referencia: "Trilha de acesso à nascente",
    descricao: "Placa de identificação do ponto de monitoramento caída.",
    status: "Concluída",
    demo: true
  }
];
