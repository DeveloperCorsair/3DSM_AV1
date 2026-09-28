"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrquestradorComDiversidade = exports.OrquestradorPadrao = exports.OrquestradorComposicaoEquipe = void 0;
const crypto_1 = require("crypto");
const entities_1 = require("../domain/entities");
/**
 * Padrao Template Method.
 *
 * O metodo `compor` define o esqueleto FIXO e imutavel do processo de
 * composicao de equipe: validar restricoes -> normalizar entrada ->
 * gerar recomendacoes por papel (via Strategy) -> pos-processar.
 * As subclasses concretas customizam apenas os "hooks" (etapas
 * especificas), sem poder alterar a ordem/existencia das etapas do
 * fluxo principal - o que torna o fluxo facilmente testavel: um teste
 * pode garantir que a ordem das chamadas nunca muda, independente da
 * subclasse usada.
 */
class OrquestradorComposicaoEquipe {
    /**
     * Metodo template - NAO deve ser sobrescrito pelas subclasses.
     * Executa as etapas na ordem fixa definida pelo processo de negocio.
     */
    compor(projeto, candidatosPorPapel, estrategia) {
        this.validarRestricoes(projeto);
        const candidatosNormalizados = this.normalizarEntrada(candidatosPorPapel);
        const itens = [];
        for (const papel of projeto.papeisRequeridos) {
            const candidatos = candidatosNormalizados.get(papel.nome) ?? [];
            const melhoresParaOPapel = estrategia.recomendar(projeto, papel, candidatos);
            const escolhido = this.selecionarMelhorCandidato(papel, melhoresParaOPapel);
            if (escolhido) {
                itens.push(escolhido);
            }
        }
        const recomendacao = new entities_1.Recomendacao((0, crypto_1.randomUUID)(), projeto.id, itens);
        return this.posProcessar(recomendacao, projeto);
    }
    /**
     * Hook: valida restricoes orcamentarias e de prazo do projeto.
     * Implementacao padrao verifica invariantes minimas; subclasses
     * podem estender com regras adicionais (ex.: restricoes regionais).
     */
    validarRestricoes(projeto) {
        if (projeto.orcamentoTotal <= 0) {
            throw new Error("Orcamento total do projeto deve ser maior que zero.");
        }
        if (projeto.papeisRequeridos.length === 0) {
            throw new Error("Projeto deve ter ao menos um papel requerido.");
        }
        if (projeto.dataEntrega.getTime() <= Date.now()) {
            throw new Error("Data de entrega deve estar no futuro.");
        }
    }
    /** Hook: normaliza os dados de entrada (ex.: remove duplicados, ordena). */
    normalizarEntrada(candidatosPorPapel) {
        const normalizado = new Map();
        for (const [papel, lista] of candidatosPorPapel.entries()) {
            const idsVistos = new Set();
            const semDuplicados = lista.filter((p) => {
                if (idsVistos.has(p.id))
                    return false;
                idsVistos.add(p.id);
                return true;
            });
            normalizado.set(papel, semDuplicados);
        }
        return normalizado;
    }
}
exports.OrquestradorComposicaoEquipe = OrquestradorComposicaoEquipe;
/**
 * Implementacao concreta padrao: seleciona sempre o candidato com maior
 * pontuacao e marca a recomendacao como "gerada" ao final.
 */
class OrquestradorPadrao extends OrquestradorComposicaoEquipe {
    selecionarMelhorCandidato(_papel, ranqueados) {
        return ranqueados[0];
    }
    posProcessar(recomendacao) {
        // Status inicial ja e "gerada" por padrao na construcao da entidade;
        // aqui poderiam ser disparados calculos adicionais de metricas.
        return recomendacao;
    }
}
exports.OrquestradorPadrao = OrquestradorPadrao;
/**
 * Variante que evita sugerir sempre o mesmo profissional em primeiro
 * lugar quando ha empate tecnico, promovendo diversidade de equipe
 * (ex.: para produtoras que qu [querem] dar oportunidade a novos talentos).
 */
class OrquestradorComDiversidade extends OrquestradorComposicaoEquipe {
    selecionarMelhorCandidato(_papel, ranqueados) {
        if (ranqueados.length === 0)
            return undefined;
        const melhorPontuacao = ranqueados[0].pontuacao;
        const empatados = ranqueados.filter((item) => melhorPontuacao - item.pontuacao < 0.01);
        const indiceAleatorio = Math.floor(Math.random() * empatados.length);
        return empatados[indiceAleatorio];
    }
    posProcessar(recomendacao) {
        return recomendacao;
    }
}
exports.OrquestradorComDiversidade = OrquestradorComDiversidade;
//# sourceMappingURL=team-composition-orchestrator.js.map