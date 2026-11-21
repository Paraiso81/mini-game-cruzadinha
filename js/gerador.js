/**
 * Motor gerador automático de cruzadinha em matriz 2D.
 * Posiciona todas as palavras recebidas na horizontal e vertical garantindo
 * cruzamentos válidos, sem colisões inválidas ou palavras coladas lateralmente.
 */

const TAMANHO_GRADE_VIRTUAL = 70;
const MAX_TENTATIVAS_GERACAO = 200;
const META_MELHORES_TABULEIROS = 5;

/**
 * Cria uma matriz vazia preenchida com null.
 * @param {number} linhas
 * @param {number} colunas
 * @returns {Array<Array<null|Object>>}
 */
function criarGradeVazia(linhas, colunas) {
  const grade = [];
  for (let r = 0; r < linhas; r++) {
    grade.push(new Array(colunas).fill(null));
  }
  return grade;
}

/**
 * Verifica se uma palavra pode ser posicionada na grade respeitando
 * cruzamentos e espaçamento entre palavras paralelas.
 * @returns {null|{cruzamentos: number}}
 */
function validarPosicaoPalavra(
  grade,
  palavraStr,
  linhaIni,
  colIni,
  direcao,
  ehPrimeira,
) {
  const len = palavraStr.length;
  const dr = direcao === "vertical" ? 1 : 0;
  const dc = direcao === "horizontal" ? 1 : 0;

  const linhaFim = linhaIni + dr * (len - 1);
  const colFim = colIni + dc * (len - 1);

  // Garante margem de 1 célula ao redor para checar extremidades e vizinhos
  if (
    linhaIni < 1 ||
    colIni < 1 ||
    linhaFim >= TAMANHO_GRADE_VIRTUAL - 1 ||
    colFim >= TAMANHO_GRADE_VIRTUAL - 1
  ) {
    return null;
  }

  // As casas imediatamente antes e depois da palavra precisam estar vazias
  if (grade[linhaIni - dr][colIni - dc] !== null) {
    return null;
  }
  if (grade[linhaFim + dr][colFim + dc] !== null) {
    return null;
  }

  let cruzamentos = 0;

  for (let i = 0; i < len; i++) {
    const r = linhaIni + dr * i;
    const c = colIni + dc * i;
    const celula = grade[r][c];
    const letra = palavraStr[i];

    if (celula !== null) {
      if (celula.letra !== letra) {
        return null;
      }
      if (direcao === "horizontal" && celula.horizontalId !== null) {
        return null;
      }
      if (direcao === "vertical" && celula.verticalId !== null) {
        return null;
      }
      cruzamentos++;
    } else {
      // Se não há cruzamento nesta casa, as vizinhas perpendiculares devem estar vazias
      if (direcao === "horizontal") {
        if (grade[r - 1][c] !== null || grade[r + 1][c] !== null) {
          return null;
        }
      } else {
        if (grade[r][c - 1] !== null || grade[r][c + 1] !== null) {
          return null;
        }
      }
    }
  }

  if (!ehPrimeira && cruzamentos === 0) {
    return null;
  }

  return { cruzamentos };
}

/**
 * Grava a palavra na grade virtual e atualiza os limites ocupados e o índice de letras.
 */
function aplicarPalavraNaGrade(
  grade,
  indiceLetras,
  limites,
  item,
  linhaIni,
  colIni,
  direcao,
) {
  const dr = direcao === "vertical" ? 1 : 0;
  const dc = direcao === "horizontal" ? 1 : 0;
  const palavraStr = item.palavra;

  for (let i = 0; i < palavraStr.length; i++) {
    const r = linhaIni + dr * i;
    const c = colIni + dc * i;
    const letra = palavraStr[i];

    if (grade[r][c] === null) {
      grade[r][c] = {
        letra,
        horizontalId: null,
        verticalId: null,
        numero: null,
      };
      if (!indiceLetras[letra]) {
        indiceLetras[letra] = [];
      }
      indiceLetras[letra].push({ r, c });
    }

    if (direcao === "horizontal") {
      grade[r][c].horizontalId = item.id;
    } else {
      grade[r][c].verticalId = item.id;
    }

    if (r < limites.minR) limites.minR = r;
    if (r > limites.maxR) limites.maxR = r;
    if (c < limites.minC) limites.minC = c;
    if (c > limites.maxC) limites.maxC = c;
  }
}

/**
 * Avalia o melhor encaixe possível para uma palavra na grade atual.
 */
function buscarMelhorEncaixe(
  grade,
  indiceLetras,
  limites,
  palavraStr,
  contagemDirecoes,
  usarAleatorio,
) {
  const candidatos = [];
  const chavesCandidatas = new Set();
  const centro = Math.floor(TAMANHO_GRADE_VIRTUAL / 2);

  for (let i = 0; i < palavraStr.length; i++) {
    const letra = palavraStr[i];
    const ocorrencias = indiceLetras[letra];
    if (!ocorrencias) continue;

    for (const pos of ocorrencias) {
      const celula = grade[pos.r][pos.c];
      // Tenta cruzar na direção perpendicular à já existente na célula
      const direcoesPossiveis = [];
      if (celula.horizontalId === null) direcoesPossiveis.push("horizontal");
      if (celula.verticalId === null) direcoesPossiveis.push("vertical");

      for (const direcao of direcoesPossiveis) {
        const linhaIni = direcao === "vertical" ? pos.r - i : pos.r;
        const colIni = direcao === "horizontal" ? pos.c - i : pos.c;
        const chave = `${linhaIni},${colIni},${direcao}`;

        if (chavesCandidatas.has(chave)) continue;
        chavesCandidatas.add(chave);

        const validacao = validarPosicaoPalavra(
          grade,
          palavraStr,
          linhaIni,
          colIni,
          direcao,
          false,
        );
        if (!validacao) continue;

        const dr = direcao === "vertical" ? 1 : 0;
        const dc = direcao === "horizontal" ? 1 : 0;
        const linhaFim = linhaIni + dr * (palavraStr.length - 1);
        const colFim = colIni + dc * (palavraStr.length - 1);

        const novoMinR = Math.min(limites.minR, linhaIni);
        const novoMaxR = Math.max(limites.maxR, linhaFim);
        const novoMinC = Math.min(limites.minC, colIni);
        const novoMaxC = Math.max(limites.maxC, colFim);

        const areaAntiga =
          (limites.maxR - limites.minR + 1) * (limites.maxC - limites.minC + 1);
        const areaNova = (novoMaxR - novoMinR + 1) * (novoMaxC - novoMinC + 1);
        const crescimentoArea = areaNova - areaAntiga;

        const distCentro =
          Math.abs((linhaIni + linhaFim) / 2 - centro) +
          Math.abs((colIni + colFim) / 2 - centro);

        // Incentiva equilíbrio entre palavras horizontais e verticais
        const bonusEquilibrio =
          contagemDirecoes[direcao] <
          contagemDirecoes[direcao === "horizontal" ? "vertical" : "horizontal"]
            ? 8
            : 0;

        const ruido = usarAleatorio ? Math.random() * 6 : 0;
        const pontuacao =
          validacao.cruzamentos * 35 +
          bonusEquilibrio -
          crescimentoArea * 0.6 -
          distCentro * 0.4 +
          ruido;

        candidatos.push({
          linhaIni,
          colIni,
          direcao,
          pontuacao,
        });
      }
    }
  }

  if (candidatos.length === 0) {
    return null;
  }

  candidatos.sort((a, b) => b.pontuacao - a.pontuacao);
  return candidatos[0];
}

/**
 * Executa uma tentativa completa de posicionamento para a ordem informada.
 */
function tentarConstruirCruzadinha(
  listaOrdenada,
  direcaoInicial,
  usarAleatorio,
) {
  const grade = criarGradeVazia(TAMANHO_GRADE_VIRTUAL, TAMANHO_GRADE_VIRTUAL);
  const indiceLetras = {};
  const posicionadas = [];
  const contagemDirecoes = { horizontal: 0, vertical: 0 };

  const primeira = listaOrdenada[0];
  const centro = Math.floor(TAMANHO_GRADE_VIRTUAL / 2);
  const linhaIni0 =
    direcaoInicial === "horizontal"
      ? centro
      : centro - Math.floor(primeira.palavra.length / 2);
  const colIni0 =
    direcaoInicial === "horizontal"
      ? centro - Math.floor(primeira.palavra.length / 2)
      : centro;

  const limites = {
    minR: linhaIni0,
    maxR: linhaIni0,
    minC: colIni0,
    maxC: colIni0,
  };

  aplicarPalavraNaGrade(
    grade,
    indiceLetras,
    limites,
    primeira,
    linhaIni0,
    colIni0,
    direcaoInicial,
  );
  contagemDirecoes[direcaoInicial]++;
  posicionadas.push({
    ...primeira,
    linha: linhaIni0,
    coluna: colIni0,
    direcao: direcaoInicial,
  });

  let pendentes = listaOrdenada.slice(1);
  let houveProgresso = true;

  // Faz múltiplas passagens pois palavras posicionadas abrem novos cruzamentos
  while (pendentes.length > 0 && houveProgresso) {
    houveProgresso = false;
    const aindaPendentes = [];

    for (const item of pendentes) {
      const encaixe = buscarMelhorEncaixe(
        grade,
        indiceLetras,
        limites,
        item.palavra,
        contagemDirecoes,
        usarAleatorio,
      );

      if (encaixe) {
        aplicarPalavraNaGrade(
          grade,
          indiceLetras,
          limites,
          item,
          encaixe.linhaIni,
          encaixe.colIni,
          encaixe.direcao,
        );
        contagemDirecoes[encaixe.direcao]++;
        posicionadas.push({
          ...item,
          linha: encaixe.linhaIni,
          coluna: encaixe.colIni,
          direcao: encaixe.direcao,
        });
        houveProgresso = true;
      } else {
        aindaPendentes.push(item);
      }
    }

    pendentes = aindaPendentes;
  }

  if (pendentes.length > 0) {
    return null;
  }

  // Confirma que todas as palavras cruzam com pelo menos outra palavra
  for (const p of posicionadas) {
    const dr = p.direcao === "vertical" ? 1 : 0;
    const dc = p.direcao === "horizontal" ? 1 : 0;
    let temCruzamento = false;
    for (let i = 0; i < p.palavra.length; i++) {
      const cel = grade[p.linha + dr * i][p.coluna + dc * i];
      if (cel.horizontalId !== null && cel.verticalId !== null) {
        temCruzamento = true;
        break;
      }
    }
    if (!temCruzamento) {
      return null;
    }
  }

  const altura = limites.maxR - limites.minR + 1;
  const largura = limites.maxC - limites.minC + 1;
  const pontuacaoCompactacao =
    altura * largura + Math.abs(altura - largura) * 4;

  return {
    grade,
    limites,
    posicionadas,
    pontuacaoCompactacao,
  };
}

/**
 * Embaralha localmente um array sem depender de outro arquivo.
 */
function embaralharParaTentativa(lista) {
  const copia = lista.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copia[i];
    copia[i] = copia[j];
    copia[j] = temp;
  }
  return copia;
}

/**
 * Recorta a matriz aos limites ocupados e numera as palavras no padrão clássico.
 */
function finalizarTabuleiro(resultado) {
  const { grade, limites, posicionadas } = resultado;
  const linhas = limites.maxR - limites.minR + 1;
  const colunas = limites.maxC - limites.minC + 1;

  const matriz = [];
  for (let r = 0; r < linhas; r++) {
    const linha = [];
    for (let c = 0; c < colunas; c++) {
      const cel = grade[limites.minR + r][limites.minC + c];
      linha.push(cel ? { ...cel, numero: null } : null);
    }
    matriz.push(linha);
  }

  const palavrasAjustadas = posicionadas.map((p) => ({
    ...p,
    linha: p.linha - limites.minR,
    coluna: p.coluna - limites.minC,
    numero: 0,
  }));

  let proximoNumero = 1;
  for (let r = 0; r < linhas; r++) {
    for (let c = 0; c < colunas; c++) {
      const iniciamAqui = palavrasAjustadas.filter(
        (p) => p.linha === r && p.coluna === c,
      );
      if (iniciamAqui.length > 0) {
        matriz[r][c].numero = proximoNumero;
        for (const p of iniciamAqui) {
          p.numero = proximoNumero;
        }
        proximoNumero++;
      }
    }
  }

  const horizontais = palavrasAjustadas
    .filter((p) => p.direcao === "horizontal")
    .sort((a, b) => a.numero - b.numero);

  const verticais = palavrasAjustadas
    .filter((p) => p.direcao === "vertical")
    .sort((a, b) => a.numero - b.numero);

  return {
    linhas,
    colunas,
    matriz,
    palavrasPosicionadas: palavrasAjustadas,
    horizontais,
    verticais,
  };
}

/**
 * Gera uma cruzadinha conectada contendo 100% das palavras fornecidas.
 * @param {Array<Object>} palavrasSelecionadas
 * @returns {Object}
 */
function gerarTabuleiroCruzadinha(palavrasSelecionadas) {
  const ordenadasPorTamanho = palavrasSelecionadas
    .slice()
    .sort((a, b) => b.palavra.length - a.palavra.length);

  const solucoesValidas = [];

  for (let tentativa = 0; tentativa < MAX_TENTATIVAS_GERACAO; tentativa++) {
    let ordemAtual;

    if (tentativa === 0) {
      ordemAtual = ordenadasPorTamanho;
    } else {
      // Mantém uma palavra longa como âncora inicial e varia o restante
      const topAncoras = ordenadasPorTamanho.slice(
        0,
        Math.min(3, ordenadasPorTamanho.length),
      );
      const ancora = topAncoras[tentativa % topAncoras.length];
      const restantes = embaralharParaTentativa(
        ordenadasPorTamanho.filter((item) => item.id !== ancora.id),
      );
      ordemAtual = [ancora, ...restantes];
    }

    const direcaoInicial = tentativa % 2 === 0 ? "horizontal" : "vertical";
    const resultado = tentarConstruirCruzadinha(
      ordemAtual,
      direcaoInicial,
      tentativa > 0,
    );

    if (resultado) {
      solucoesValidas.push(resultado);
      if (solucoesValidas.length >= META_MELHORES_TABULEIROS) {
        break;
      }
    }
  }

  if (solucoesValidas.length === 0) {
    throw new Error(
      "Não foi possível gerar cruzadinha com todas as palavras selecionadas.",
    );
  }

  solucoesValidas.sort(
    (a, b) => a.pontuacaoCompactacao - b.pontuacaoCompactacao,
  );
  return finalizarTabuleiro(solucoesValidas[0]);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    gerarTabuleiroCruzadinha,
  };
}
