"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FabricaEstrategiaRecomendacao = exports.EstrategiaOrcamentoReduzido = exports.EstrategiaFiltragemColaborativa = exports.EstrategiaSimilaridadeCosseno = void 0;
const entities_1 = require("../domain/entities");
/** Estrategia baseada em similaridade de cosseno sobre os vetores de competencia. */
class EstrategiaSimilaridadeCosseno {
    constructor() {
        this.nome = "similaridade_cosseno";
    }
    recomendar(_projeto, papel, candidatos) {
        return candidatos
            .filter((c) => c.atendePapel(papel.nome))
            .map((c) => {
            const base = c.competencias.pesoPara(papel.nome);
            const pontuacao = base * papel.peso;
            return new entities_1.ItemRecomendacao(papel.nome, c, pontuacao);
        })
            .sort((a, b) => b.pontuacao - a.pontuacao);
    }
}
exports.EstrategiaSimilaridadeCosseno = EstrategiaSimilaridadeCosseno;
/** Estrategia baseada em filtragem colaborativa usando avaliacoes historicas. */
class EstrategiaFiltragemColaborativa {
    constructor() {
        this.nome = "filtragem_colaborativa";
    }
    recomendar(_projeto, papel, candidatos) {
        return candidatos
            .filter((c) => c.atendePapel(papel.nome))
            .map((c) => {
            // Normaliza a nota media (0-5) para 0-1 e pondera pelo peso do papel
            // e pelo volume de historico (profissionais com mais avaliacoes
            // tem maior confianca na pontuacao).
            const notaNormalizada = c.notaMedia() / 5;
            const confianca = Math.min(c.historico.length / 10, 1);
            const pontuacao = notaNormalizada * (0.7 + 0.3 * confianca) * papel.peso;
            return new entities_1.ItemRecomendacao(papel.nome, c, pontuacao);
        })
            .sort((a, b) => b.pontuacao - a.pontuacao);
    }
}
exports.EstrategiaFiltragemColaborativa = EstrategiaFiltragemColaborativa;
/** Estrategia baseada em regras de negocio para projetos com orcamento reduzido. */
class EstrategiaOrcamentoReduzido {
    constructor() {
        this.nome = "orcamento_reduzido";
    }
    recomendar(projeto, papel, candidatos) {
        const orcamentoPorPapel = projeto.orcamentoPorPapel();
        return candidatos
            .filter((c) => c.atendePapel(papel.nome) && c.dentroDoOrcamento(orcamentoPorPapel))
            .map((c) => {
            // Prioriza o menor preco dentro do orcamento, com pequeno ajuste
            // pela nota media, para nao sacrificar totalmente a qualidade.
            const economiaRelativa = orcamentoPorPapel > 0
                ? 1 - c.faixaPreco.minimo / orcamentoPorPapel
                : 0;
            const pontuacao = Math.max(economiaRelativa, 0) * 0.7 + (c.notaMedia() / 5) * 0.3;
            return new entities_1.ItemRecomendacao(papel.nome, c, pontuacao * papel.peso);
        })
            .sort((a, b) => b.pontuacao - a.pontuacao);
    }
}
exports.EstrategiaOrcamentoReduzido = EstrategiaOrcamentoReduzido;
/** Fabrica simples para resolver a estrategia pelo nome (selecao dinamica). */
class FabricaEstrategiaRecomendacao {
    static obter(nome) {
        const estrategia = this.registro.get(nome);
        if (!estrategia) {
            throw new Error(`Estrategia de recomendacao desconhecida: ${nome}`);
        }
        return estrategia;
    }
    static registrar(estrategia) {
        this.registro.set(estrategia.nome, estrategia);
    }
}
exports.FabricaEstrategiaRecomendacao = FabricaEstrategiaRecomendacao;
FabricaEstrategiaRecomendacao.registro = new Map([
    ["similaridade_cosseno", new EstrategiaSimilaridadeCosseno()],
    ["filtragem_colaborativa", new EstrategiaFiltragemColaborativa()],
    ["orcamento_reduzido", new EstrategiaOrcamentoReduzido()],
]);
//# sourceMappingURL=recommendation-strategy.js.map