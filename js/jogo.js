/**
 * Controlador principal do jogo de cruzadinha.
 * Gerencia seleção de nível, geração de partida, conferência e reinício.
 */

(() => {
  const estadoJogo = {
    nivelAtual: "facil",
    dadosTabuleiro: null,
  };

  const elementos = {
    modalNivel: document.getElementById("modal-nivel"),
    btnFecharModal: document.getElementById("btn-fechar-modal"),
    botoesNivelModal: document.querySelectorAll("[data-selecionar-nivel]"),
    badgeNivelAtual: document.getElementById("badge-nivel-atual"),
    contadorAcertos: document.getElementById("contador-acertos"),
    btnConferir: document.getElementById("btn-conferir"),
    btnReiniciar: document.getElementById("btn-reiniciar"),
    btnNovoTabuleiro: document.getElementById("btn-novo-tabuleiro"),
    btnTrocarNivel: document.getElementById("btn-trocar-nivel"),
    bannerResultado: document.getElementById("banner-resultado"),
    bannerTexto: document.getElementById("banner-resultado-texto"),
  };

  /**
   * Atualiza o texto do contador no formato exigido: "X de Y palavras".
   */
  function atualizarContador(acertos, total) {
    if (elementos.contadorAcertos) {
      elementos.contadorAcertos.textContent = `${acertos} de ${total} palavras`;
    }
  }

  /**
   * Atualiza o badge de dificuldade no cabeçalho.
   */
  function atualizarBadgeNivel(nivel) {
    const config = CONFIG_NIVEIS[nivel];
    if (!elementos.badgeNivelAtual || !config) return;

    elementos.badgeNivelAtual.textContent = `Nível ${config.rotulo} (${config.quantidade} palavras)`;
    elementos.badgeNivelAtual.className = `badge-nivel-header badge-${nivel}`;
  }

  /**
   * Oculta a mensagem de feedback ao editar ou reiniciar o tabuleiro.
   */
  function ocultarBannerResultado() {
    if (!elementos.bannerResultado) return;
    elementos.bannerResultado.hidden = true;
    elementos.bannerResultado.classList.remove(
      "banner-vitoria",
      "banner-parcial",
    );
  }

  /**
   * Exibe o banner com o resultado da conferência.
   */
  function exibirBannerResultado(acertos, total) {
    if (!elementos.bannerResultado || !elementos.bannerTexto) return;

    elementos.bannerResultado.hidden = false;
    elementos.bannerResultado.classList.remove(
      "banner-vitoria",
      "banner-parcial",
    );

    if (acertos === total) {
      elementos.bannerResultado.classList.add("banner-vitoria");
      elementos.bannerTexto.textContent = `Parabéns! Você completou todas as ${total} palavras corretamente!`;
    } else {
      elementos.bannerResultado.classList.add("banner-parcial");
      elementos.bannerTexto.textContent = `Você acertou ${acertos} de ${total} palavras. As palavras em vermelho precisam de revisão.`;
    }
  }

  /**
   * Abre o modal de seleção de nível.
   */
  function abrirModalNivel() {
    if (!elementos.modalNivel) return;
    elementos.modalNivel.hidden = false;
    if (elementos.btnFecharModal) {
      elementos.btnFecharModal.hidden = !estadoJogo.dadosTabuleiro;
    }
  }

  /**
   * Fecha o modal de seleção de nível quando já existe um tabuleiro ativo.
   */
  function fecharModalNivel() {
    if (!elementos.modalNivel || !estadoJogo.dadosTabuleiro) return;
    elementos.modalNivel.hidden = true;
  }

  /**
   * Inicia uma nova partida sorteando as palavras e montando o cruzamento.
   * @param {"facil"|"medio"|"dificil"} nivel
   */
  function iniciarPartida(nivel) {
    estadoJogo.nivelAtual = nivel;
    const palavrasSelecionadas = sortearPalavrasPorNivel(nivel);
    const dadosTabuleiro = gerarTabuleiroCruzadinha(palavrasSelecionadas);
    estadoJogo.dadosTabuleiro = dadosTabuleiro;

    TabuleiroUI.renderizar(dadosTabuleiro, {
      aoAlterarEntrada: ocultarBannerResultado,
    });

    atualizarBadgeNivel(nivel);
    atualizarContador(0, dadosTabuleiro.palavrasPosicionadas.length);
    ocultarBannerResultado();

    if (elementos.modalNivel) {
      elementos.modalNivel.hidden = true;
    }
  }

  /**
   * Confere todas as palavras do tabuleiro e destaca certas e erradas.
   */
  function conferirRespostas() {
    if (!estadoJogo.dadosTabuleiro) return;

    const palavras = estadoJogo.dadosTabuleiro.palavrasPosicionadas;
    let acertos = 0;

    const resultados = palavras.map((palavra) => {
      const dr = palavra.direcao === "vertical" ? 1 : 0;
      const dc = palavra.direcao === "horizontal" ? 1 : 0;
      let respostaDigitada = "";

      for (let i = 0; i < palavra.palavra.length; i++) {
        respostaDigitada += TabuleiroUI.lerLetra(
          palavra.linha + dr * i,
          palavra.coluna + dc * i,
        );
      }

      const correta = respostaDigitada === palavra.palavra;
      if (correta) {
        acertos++;
      }

      return { palavra, correta };
    });

    TabuleiroUI.aplicarValidacao(resultados);
    atualizarContador(acertos, palavras.length);
    exibirBannerResultado(acertos, palavras.length);
  }

  /**
   * Limpa todas as letras digitadas mantendo a mesma cruzadinha.
   */
  function reiniciarTabuleiro() {
    if (!estadoJogo.dadosTabuleiro) return;
    TabuleiroUI.limparTudo();
    atualizarContador(0, estadoJogo.dadosTabuleiro.palavrasPosicionadas.length);
    ocultarBannerResultado();
  }

  // Vincula eventos dos botões da interface
  elementos.botoesNivelModal.forEach((botao) => {
    botao.addEventListener("click", () => {
      const nivel = botao.dataset.selecionarNivel;
      if (nivel) {
        iniciarPartida(nivel);
      }
    });
  });

  if (elementos.btnFecharModal) {
    elementos.btnFecharModal.addEventListener("click", fecharModalNivel);
  }

  if (elementos.btnConferir) {
    elementos.btnConferir.addEventListener("click", conferirRespostas);
  }

  if (elementos.btnReiniciar) {
    elementos.btnReiniciar.addEventListener("click", reiniciarTabuleiro);
  }

  if (elementos.btnNovoTabuleiro) {
    elementos.btnNovoTabuleiro.addEventListener("click", () => {
      iniciarPartida(estadoJogo.nivelAtual);
    });
  }

  if (elementos.btnTrocarNivel) {
    elementos.btnTrocarNivel.addEventListener("click", abrirModalNivel);
  }

  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      elementos.modalNivel &&
      !elementos.modalNivel.hidden
    ) {
      fecharModalNivel();
    }
  });

  // Garante que o jogador escolha o nível ao carregar a página
  abrirModalNivel();
})();
