import type { BitstrumMessage } from "../types";

export const BITSTRUM_MESSAGES: BitstrumMessage[] = [
    // Categoria: Apoio (Suporte emocional direto)
    {
        id: "msg-support-01",
        text: "Tudo bem não estar bem o tempo todo.",
        category: "apoio"
    },
    {
        id: "msg-support-02",
        text: "Respire fundo. Você está segura aqui.",
        category: "apoio"
    },
    {
        id: "msg-support-03",
        text: "Um passo de cada vez, no seu ritmo.",
        category: "apoio"
    },
    {
        id: "msg-support-04",
        text: "O caos lá fora não precisa entrar aqui.",
        category: "apoio"
    },

    // Categoria: Admiração (Reforço positivo)
    {
        id: "msg-admiration-01",
        text: "Sua sensibilidade é sua maior força.",
        category: "admiração"
    },
    {
        id: "msg-admiration-02",
        text: "O mundo tem sorte de ter você.",
        category: "admiração"
    },
    {
        id: "msg-admiration-03",
        text: "Você cria beleza onde toca.",
        category: "admiração"
    },

    // Categoria: Saudade (Conexão e memória)
    {
        id: "msg-saudade-01",
        text: "A música é nossa ponte invisível.",
        category: "saudade"
    },
    {
        id: "msg-saudade-02",
        text: "Estou aqui, em cada acorde.",
        category: "saudade"
    },
    {
        id: "msg-saudade-03",
        text: "Feche os olhos e sinta.",
        category: "saudade"
    },

    // Easter Egg Messages (Conditionals)
    {
        id: "msg-ee-falling-down",
        text: "Nossas memórias nunca caem...",
        category: "saudade",
        unlockCondition: "falling-down"
    },
    {
        id: "msg-ee-creep",
        text: "You're so very special.",
        category: "admiração",
        unlockCondition: "creep"
    }
];
