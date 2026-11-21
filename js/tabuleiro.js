/**
 * Módulo de renderização e interatividade do tabuleiro e painel de pistas.
 */

const ROTULOS_NIVEL_PISTA = {
  facil: "Fácil",
  medio: "Médio",
  dificil: "Difícil",
};

const TabuleiroUI = (() => {
  const estado = {
    dados: null,
    inputs: [],
    celulas: [],
    elementosPista: new Map(),
    direcaoAtiva: "horizontal",
    palavraAtivaId: null,
    ultimaCelulaFocada: null,
    aoAlterarEntrada: null,
  };

  /**
   * Normaliza um caractere digitado para letra maiúscula A-Z sem acento.
   * @param {string} texto
   * @returns {string}
   */
  function normalizarLetra(texto) {
    if (!texto) return "";
    const limpo = texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z]/g, "");
    return limpo ? limpo.charAt(limpo.length - 1) : "";
  }

  /**
   * Retorna uma chave única para identificar uma palavra posicionada.
   */
  function chavePalavra(id, direcao) {
    return `${id}-${direcao}`;
  }

  /**
   * Busca o objeto da palavra posicionada pelo id e direção.
   */
  function obterPalavra(id, direcao) {
    if (!estado.dados) return null;
    return (
      estado.dados.palavrasPosicionadas.find(
        (p) => p.id === id && p.direcao === direcao,
      ) || null
    );
  }

  /**
   * Atualiza a barra de pista ativa e os destaques visuais no tabuleiro e na lista.
   */
  function atualizarDestaqueAtivo() {
    document.querySelectorAll(".celula-destacada").forEach((el) => {
      el.classList.remove("celula-destacada");
    });
    document.querySelectorAll(".pista-ativa").forEach((el) => {
      el.classList.remove("pista-ativa");
    });

    const dicaBarra = document.getElementById("dica-ativa-texto");
    const dicaMeta = document.getElementById("dica-ativa-meta");

    if (!estado.palavraAtivaId || !estado.dados) {
      if (dicaBarra)
        dicaBarra.textContent =
          "Selecione uma casa ou pista para começar a digitar.";
      if (dicaMeta) dicaMeta.textContent = "—";
      return;
    }

    const palavra = obterPalavra(estado.palavraAtivaId, estado.direcaoAtiva);
    if (!palavra) return;

    const dr = palavra.direcao === "vertical" ? 1 : 0;
    const dc = palavra.direcao === "horizontal" ? 1 : 0;

    for (let i = 0; i < palavra.palavra.length; i++) {
      const r = palavra.linha + dr * i;
      const c = palavra.coluna + dc * i;
      const celEl = estado.celulas[r]?.[c];
      if (celEl) {
        celEl.classList.add("celula-destacada");
      }
    }

    const pistaEl = estado.elementosPista.get(
      chavePalavra(palavra.id, palavra.direcao),
    );
    if (pistaEl) {
      pistaEl.classList.add("pista-ativa");
      pistaEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    if (dicaMeta) {
      const dirRotulo =
        palavra.direcao === "horizontal" ? "Horizontal" : "Vertical";
      dicaMeta.textContent = `${palavra.numero}. ${dirRotulo} (${palavra.palavra.length} letras)`;
    }
    if (dicaBarra) {
      dicaBarra.textContent = palavra.pista;
    }
  }

  /**
   * Define qual palavra está ativa a partir de uma célula (r, c).
   */
  function selecionarPalavraDaCelula(r, c, alternarSeMesmaCelula) {
    const celDados = estado.dados?.matriz[r]?.[c];
    if (!celDados) return;

    const temH = celDados.horizontalId !== null;
    const temV = celDados.verticalId !== null;

    if (alternarSeMesmaCelula && temH && temV) {
      estado.direcaoAtiva =
        estado.direcaoAtiva === "horizontal" ? "vertical" : "horizontal";
    } else if (estado.direcaoAtiva === "horizontal" && !temH && temV) {
      estado.direcaoAtiva = "vertical";
    } else if (estado.direcaoAtiva === "vertical" && !temV && temH) {
      estado.direcaoAtiva = "horizontal";
    }

    estado.palavraAtivaId =
      estado.direcaoAtiva === "horizontal"
        ? celDados.horizontalId
        : celDados.verticalId;

    atualizarDestaqueAtivo();
  }

  /**
   * Move o foco para a casa anterior ou próxima dentro da palavra ativa.
   */
  function moverNaPalavraAtiva(rAtual, cAtual, passo) {
    const palavra = obterPalavra(estado.palavraAtivaId, estado.direcaoAtiva);
    if (!palavra) return;

    const dr = palavra.direcao === "vertical" ? 1 : 0;
    const dc = palavra.direcao === "horizontal" ? 1 : 0;

    const indiceAtual =
      palavra.direcao === "horizontal"
        ? cAtual - palavra.coluna
        : rAtual - palavra.linha;
    const proximoIndice = indiceAtual + passo;

    if (proximoIndice >= 0 && proximoIndice < palavra.palavra.length) {
      const proxR = palavra.linha + dr * proximoIndice;
      const proxC = palavra.coluna + dc * proximoIndice;
      const proxInput = estado.inputs[proxR]?.[proxC];
      if (proxInput) {
        estado.ultimaCelulaFocada = `${proxR},${proxC}`;
        proxInput.focus();
      }
    }
  }

  /**
   * Navega pelas setas do teclado para a casa ativa adjacente.
   */
  function moverPorSeta(rAtual, cAtual, dr, dc) {
    const novaDirecao = dr !== 0 ? "vertical" : "horizontal";
    const proxR = rAtual + dr;
    const proxC = cAtual + dc;
    const celDestino = estado.dados?.matriz[proxR]?.[proxC];

    if (celDestino) {
      estado.direcaoAtiva = novaDirecao;
      estado.ultimaCelulaFocada = `${proxR},${proxC}`;
      const proxInput = estado.inputs[proxR]?.[proxC];
      if (proxInput) {
        proxInput.focus();
      }
    } else {
      // Se não houver casa naquela direção, apenas alinha a direção se a célula atual suportar
      const celAtual = estado.dados?.matriz[rAtual]?.[cAtual];
      if (celAtual) {
        if (novaDirecao === "horizontal" && celAtual.horizontalId !== null) {
          estado.direcaoAtiva = "horizontal";
          estado.palavraAtivaId = celAtual.horizontalId;
          atualizarDestaqueAtivo();
        } else if (novaDirecao === "vertical" && celAtual.verticalId !== null) {
          estado.direcaoAtiva = "vertical";
          estado.palavraAtivaId = celAtual.verticalId;
          atualizarDestaqueAtivo();
        }
      }
    }
  }

  /**
   * Limpa a marcação de validação da célula quando o jogador edita a letra.
   */
  function limparStatusCelula(r, c) {
    const celEl = estado.celulas[r]?.[c];
    if (celEl) {
      celEl.classList.remove("casa-correta", "casa-errada");
    }
    if (typeof estado.aoAlterarEntrada === "function") {
      estado.aoAlterarEntrada();
    }
  }

  /**
   * Configura os eventos de teclado, clique e foco de cada casa do tabuleiro.
   */
  function vincularEventosInput(input, r, c) {
    input.addEventListener("mousedown", () => {
      const chaveAtual = `${r},${c}`;
      const jaEstavaFocado =
        document.activeElement === input &&
        estado.ultimaCelulaFocada === chaveAtual;
      if (jaEstavaFocado) {
        selecionarPalavraDaCelula(r, c, true);
      }
    });

    input.addEventListener("focus", () => {
      estado.ultimaCelulaFocada = `${r},${c}`;
      selecionarPalavraDaCelula(r, c, false);
    });

    input.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "Backspace") {
        e.preventDefault();
        if (input.value !== "") {
          input.value = "";
          limparStatusCelula(r, c);
        } else {
          moverNaPalavraAtiva(r, c, -1);
          const foco = document.activeElement;
          if (foco && foco.classList.contains("input-letra")) {
            const fr = Number(foco.dataset.linha);
            const fc = Number(foco.dataset.coluna);
            foco.value = "";
            limparStatusCelula(fr, fc);
          }
        }
        return;
      }

      if (e.key === "Delete") {
        e.preventDefault();
        input.value = "";
        limparStatusCelula(r, c);
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        moverPorSeta(r, c, 0, 1);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        moverPorSeta(r, c, 0, -1);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        moverPorSeta(r, c, 1, 0);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        moverPorSeta(r, c, -1, 0);
        return;
      }

      // Trata digitação de letras diretamente para substituir conteúdo existente e avançar
      if (e.key.length === 1) {
        const letra = normalizarLetra(e.key);
        e.preventDefault();
        if (letra) {
          input.value = letra;
          limparStatusCelula(r, c);
          moverNaPalavraAtiva(r, c, 1);
        }
      }
    });

    // Fallback para teclados virtuais (mobile) ou colagem
    input.addEventListener("input", () => {
      const letra = normalizarLetra(input.value);
      input.value = letra;
      if (letra) {
        limparStatusCelula(r, c);
        moverNaPalavraAtiva(r, c, 1);
      }
    });
  }

  /**
   * Foca na primeira casa vazia (ou na primeira casa) da palavra clicada na lista de pistas.
   */
  function focarPalavraPorPista(palavra) {
    estado.direcaoAtiva = palavra.direcao;
    estado.palavraAtivaId = palavra.id;

    const dr = palavra.direcao === "vertical" ? 1 : 0;
    const dc = palavra.direcao === "horizontal" ? 1 : 0;

    let alvoR = palavra.linha;
    let alvoC = palavra.coluna;

    for (let i = 0; i < palavra.palavra.length; i++) {
      const r = palavra.linha + dr * i;
      const c = palavra.coluna + dc * i;
      const input = estado.inputs[r]?.[c];
      if (input && input.value === "") {
        alvoR = r;
        alvoC = c;
        break;
      }
    }

    const inputAlvo = estado.inputs[alvoR]?.[alvoC];
    if (inputAlvo) {
      estado.ultimaCelulaFocada = `${alvoR},${alvoC}`;
      inputAlvo.focus();
      atualizarDestaqueAtivo();
    }
  }

  /**
   * Renderiza uma lista de pistas (Horizontais ou Verticais).
   */
  function renderizarListaPistas(containerId, listaPalavras) {
    const ul = document.getElementById(containerId);
    if (!ul) return;
    ul.innerHTML = "";

    for (const palavra of listaPalavras) {
      const li = document.createElement("li");
      li.className = "item-pista";
      li.dataset.palavraId = String(palavra.id);
      li.dataset.direcao = palavra.direcao;
      li.tabIndex = 0;

      const spanNumero = document.createElement("span");
      spanNumero.className = "pista-numero";
      spanNumero.textContent = String(palavra.numero);

      const divConteudo = document.createElement("div");
      divConteudo.className = "pista-conteudo";

      const pTexto = document.createElement("p");
      pTexto.className = "pista-texto";
      pTexto.textContent = palavra.pista;

      const divMeta = document.createElement("div");
      divMeta.className = "pista-meta";

      const spanBadge = document.createElement("span");
      spanBadge.className = `badge-nivel badge-${palavra.nivel}`;
      spanBadge.textContent =
        ROTULOS_NIVEL_PISTA[palavra.nivel] || palavra.nivel;

      const spanTamanho = document.createElement("span");
      spanTamanho.className = "pista-tamanho";
      spanTamanho.textContent = `${palavra.palavra.length} letras`;

      divMeta.appendChild(spanBadge);
      divMeta.appendChild(spanTamanho);

      divConteudo.appendChild(pTexto);
      divConteudo.appendChild(divMeta);

      li.appendChild(spanNumero);
      li.appendChild(divConteudo);

      li.addEventListener("click", () => focarPalavraPorPista(palavra));
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          focarPalavraPorPista(palavra);
        }
      });

      ul.appendChild(li);
      estado.elementosPista.set(chavePalavra(palavra.id, palavra.direcao), li);
    }
  }

  /**
   * Renderiza o tabuleiro completo e as listas de pistas no DOM.
   */
  function renderizar(dadosTabuleiro, opcoes = {}) {
    estado.dados = dadosTabuleiro;
    estado.inputs = [];
    estado.celulas = [];
    estado.elementosPista.clear();
    estado.aoAlterarEntrada = opcoes.aoAlterarEntrada || null;

    const gridEl = document.getElementById("tabuleiro-grid");
    if (!gridEl) return;

    gridEl.innerHTML = "";
    gridEl.style.gridTemplateColumns = `repeat(${dadosTabuleiro.colunas}, var(--tamanho-celula))`;

    // Ajusta dinamicamente o tamanho da célula para grades maiores no nível Difícil
    if (dadosTabuleiro.colunas >= 20) {
      gridEl.style.setProperty("--tamanho-celula", "30px");
    } else if (dadosTabuleiro.colunas >= 16) {
      gridEl.style.setProperty("--tamanho-celula", "34px");
    } else {
      gridEl.style.setProperty("--tamanho-celula", "38px");
    }

    for (let r = 0; r < dadosTabuleiro.linhas; r++) {
      const linhaInputs = new Array(dadosTabuleiro.colunas).fill(null);
      const linhaCelulas = new Array(dadosTabuleiro.colunas).fill(null);

      for (let c = 0; c < dadosTabuleiro.colunas; c++) {
        const celDados = dadosTabuleiro.matriz[r][c];

        if (!celDados) {
          const vazia = document.createElement("div");
          vazia.className = "celula-vazia";
          vazia.setAttribute("aria-hidden", "true");
          gridEl.appendChild(vazia);
          continue;
        }

        const celula = document.createElement("div");
        celula.className = "celula-ativa";

        if (celDados.numero !== null) {
          const numSpan = document.createElement("span");
          numSpan.className = "numero-celula";
          numSpan.textContent = String(celDados.numero);
          celula.appendChild(numSpan);
        }

        const input = document.createElement("input");
        input.type = "text";
        input.maxLength = 1;
        input.className = "input-letra";
        input.dataset.linha = String(r);
        input.dataset.coluna = String(c);
        input.autocomplete = "off";
        input.spellcheck = false;
        input.setAttribute("aria-label", `Linha ${r + 1}, Coluna ${c + 1}`);

        vincularEventosInput(input, r, c);

        celula.appendChild(input);
        gridEl.appendChild(celula);

        linhaInputs[c] = input;
        linhaCelulas[c] = celula;
      }

      estado.inputs.push(linhaInputs);
      estado.celulas.push(linhaCelulas);
    }

    renderizarListaPistas("lista-horizontais", dadosTabuleiro.horizontais);
    renderizarListaPistas("lista-verticais", dadosTabuleiro.verticais);

    // Seleciona a primeira palavra horizontal (ou vertical) inicialmente
    const primeira =
      dadosTabuleiro.horizontais[0] || dadosTabuleiro.verticais[0];
    if (primeira) {
      estado.direcaoAtiva = primeira.direcao;
      estado.palavraAtivaId = primeira.id;
      atualizarDestaqueAtivo();
    }
  }

  /**
   * Lê a letra digitada em uma casa específica.
   */
  function lerLetra(r, c) {
    return estado.inputs[r]?.[c]?.value?.toUpperCase() || "";
  }

  /**
   * Remove apenas as classes visuais de certo/errado.
   */
  function limparValidacaoVisual() {
    for (const linha of estado.celulas) {
      for (const celEl of linha) {
        if (celEl) {
          celEl.classList.remove("casa-correta", "casa-errada");
        }
      }
    }
    estado.elementosPista.forEach((li) => {
      li.classList.remove("pista-correta", "pista-errada");
    });
  }

  /**
   * Aplica o feedback visual de palavras certas e erradas no tabuleiro e nas pistas.
   */
  function aplicarValidacao(resultadosPalavras) {
    limparValidacaoVisual();

    // Primeiro marca palavras erradas, depois sobrepõe palavras certas para não manchar palavras completas
    for (const res of resultadosPalavras) {
      const { palavra, correta } = res;
      const pistaEl = estado.elementosPista.get(
        chavePalavra(palavra.id, palavra.direcao),
      );
      if (pistaEl) {
        pistaEl.classList.add(correta ? "pista-correta" : "pista-errada");
      }

      if (!correta) {
        const dr = palavra.direcao === "vertical" ? 1 : 0;
        const dc = palavra.direcao === "horizontal" ? 1 : 0;
        for (let i = 0; i < palavra.palavra.length; i++) {
          const celEl =
            estado.celulas[palavra.linha + dr * i]?.[palavra.coluna + dc * i];
          if (celEl) {
            celEl.classList.add("casa-errada");
          }
        }
      }
    }

    for (const res of resultadosPalavras) {
      const { palavra, correta } = res;
      if (correta) {
        const dr = palavra.direcao === "vertical" ? 1 : 0;
        const dc = palavra.direcao === "horizontal" ? 1 : 0;
        for (let i = 0; i < palavra.palavra.length; i++) {
          const celEl =
            estado.celulas[palavra.linha + dr * i]?.[palavra.coluna + dc * i];
          if (celEl) {
            celEl.classList.remove("casa-errada");
            celEl.classList.add("casa-correta");
          }
        }
      }
    }
  }

  /**
   * Limpa todas as letras digitadas e classes de validação mantendo o mesmo tabuleiro.
   */
  function limparTudo() {
    for (const linha of estado.inputs) {
      for (const input of linha) {
        if (input) {
          input.value = "";
        }
      }
    }
    limparValidacaoVisual();
  }

  return {
    renderizar,
    lerLetra,
    limparValidacaoVisual,
    aplicarValidacao,
    limparTudo,
  };
})();
