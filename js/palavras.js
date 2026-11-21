/**
 * Banco oficial das 16 palavras da Cruzadinha de Arquitetura Computacional.
 * Classificadas de forma equilibrada em: fácil (6), médio (5) e difícil (5).
 * As pistas estão com texto genérico (Lorem ipsum) para preenchimento posterior.
 */
const PALAVRAS_CRUZADINHA = [
  // Nível Fácil (6 palavras)
  {
    id: 1,
    termo: "CPU",
    palavra: "CPU",
    nivel: "facil",
    pista: "Responsável por executar instruções.",
  },
  {
    id: 2,
    termo: "ULA",
    palavra: "ULA",
    nivel: "facil",
    pista: "Faz contas aritméticas e lógicas",
  },
  {
    id: 3,
    termo: "UC (Unidade de Controle)",
    palavra: "UC",
    nivel: "facil",
    pista:
      "Lê cada instrução, descobre o que ela pede e envia as ordens para as outras partes",
  },
  {
    id: 5,
    termo: "RAM",
    palavra: "RAM",
    nivel: "facil",
    pista: "Memória temporária que guarda os programas que estão rodando.",
  },
  {
    id: 6,
    termo: "ROM",
    palavra: "ROM",
    nivel: "facil",
    pista:
      "Memória não volátil que guarda o que o computador precisa para iniciar",
  },
  {
    id: 8,
    termo: "Flash",
    palavra: "FLASH",
    nivel: "facil",
    pista:
      "Tipo de armazenamento não volátil, regravável em blocos, usado em SSDs e pendrives",
  },

  // Nível Médio (5 palavras)
  {
    id: 4,
    termo: "registradores",
    palavra: "REGISTRADORES",
    nivel: "medio",
    pista: "Uma memória pequena que guarda o dado que esta sendo usado.",
  },
  {
    id: 9,
    termo: "cache",
    palavra: "CACHE",
    nivel: "medio",
    pista: "Memória rápida e pequena que fica dentro da CPU.",
  },
  {
    id: 11,
    termo: "DMA",
    palavra: "DMA",
    nivel: "medio",
    pista: "Permite que um dispositivo tenha acesso direto a memória RAM.",
  },
  {
    id: 15,
    termo: "dual core",
    palavra: "DUALCORE",
    nivel: "medio",
    pista: "Um processador com dois núcleos.",
  },
  {
    id: 16,
    termo: "quad core",
    palavra: "QUADCORE",
    nivel: "medio",
    pista: "Um processador com quatro núcleos.",
  },

  // Nível Difícil (5 palavras)
  {
    id: 7,
    termo: "EEPROM",
    palavra: "EEPROM",
    nivel: "dificil",
    pista:
      "Memória pequena não volátil que guarda dados que sobrevivem ao desligamento utilizada no arduino",
  },
  {
    id: 10,
    termo: "memória de massa (armazenamento)",
    palavra: "MEMORIADEMASSA",
    nivel: "dificil",
    pista: "Memória reposável por fazer a persistência dos dados.",
  },
  {
    id: 12,
    termo: "address bus (barramento de endereço)",
    palavra: "ADDRESSBUS",
    nivel: "dificil",
    pista:
      "Conjunto de linhas de comunicação físicas que permite à CPU especificar a localização exata na memória RAM",
  },
  {
    id: 13,
    termo: "data bus (barramento de dados)",
    palavra: "DATABUS",
    nivel: "dificil",
    pista:
      "Canal de comunicação bidirecional dentro de um computador responsável por transportar as informações.",
  },
  {
    id: 14,
    termo: "microcontrolador",
    palavra: "MICROCONTROLADOR",
    nivel: "dificil",
    pista:
      "Conjunto de um único chip CPU, memórias e dispositivos de entrada e saída.",
  },
];

const CONFIG_NIVEIS = {
  facil: {
    rotulo: "Fácil",
    quantidade: 12,
    prioridade: ["facil", "medio", "dificil"],
  },
  medio: {
    rotulo: "Médio",
    quantidade: 14,
    prioridade: ["medio", "facil", "dificil"],
  },
  dificil: {
    rotulo: "Difícil",
    quantidade: 16,
    prioridade: ["dificil", "medio", "facil"],
  },
};

/**
 * Embaralha uma cópia do array usando o algoritmo de Fisher-Yates.
 * @param {Array} lista
 * @returns {Array}
 */
function embaralharLista(lista) {
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
 * Sorteia a quantidade exata de palavras para o nível selecionado,
 * priorizando os termos da dificuldade escolhida.
 * @param {"facil"|"medio"|"dificil"} nivel
 * @returns {Array<Object>}
 */
function sortearPalavrasPorNivel(nivel) {
  const config = CONFIG_NIVEIS[nivel] || CONFIG_NIVEIS.facil;
  const porNivel = {
    facil: embaralharLista(
      PALAVRAS_CRUZADINHA.filter((item) => item.nivel === "facil"),
    ),
    medio: embaralharLista(
      PALAVRAS_CRUZADINHA.filter((item) => item.nivel === "medio"),
    ),
    dificil: embaralharLista(
      PALAVRAS_CRUZADINHA.filter((item) => item.nivel === "dificil"),
    ),
  };

  const selecionadas = [];
  for (const grupo of config.prioridade) {
    for (const item of porNivel[grupo]) {
      if (selecionadas.length < config.quantidade) {
        selecionadas.push(item);
      }
    }
  }

  return selecionadas;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    PALAVRAS_CRUZADINHA,
    CONFIG_NIVEIS,
    embaralharLista,
    sortearPalavrasPorNivel,
  };
}
