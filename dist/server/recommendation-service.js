"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicoRecomendacaoEquipe = void 0;
const crypto_1 = require("crypto");
const entities_1 = require("../domain/entities");
const recommendation_strategy_1 = require("../strategies/recommendation-strategy");
const team_composition_orchestrator_1 = require("../orchestrator/team-composition-orchestrator");
const recommendation_visitor_1 = require("../visitors/recommendation-visitor");
const event_bus_1 = require("../events/event-bus");
/**
 * Servico de aplicacao (fachada) que orquestra a colaboracao entre os
 * quatro padroes de projeto exigidos:
 *  - Strategy: escolhe o algoritmo de recomendacao.
 *  - Template Method: executa o fluxo fixo de composicao de equipe.
 *  - Observer: notifica interessados a cada recomendacao/convite.
 *  - Visitor: valida consistencia e gera metricas/relatorios.
 *
 * Tambem e responsavel por publicar eventos de dominio no barramento
 * para os demais microsservicos (gerenciamento de projetos, financeiro).
 */
class ServicoRecomendacaoEquipe {
    constructor(repositorioProfissionais, sujeitoRecomendacao, barramento, orquestrador = new team_composition_orchestrator_1.OrquestradorPadrao(), visitanteValidacao = new recommendation_visitor_1.VisitanteValidacaoConsistencia(), visitanteRelatorio = new recommendation_visitor_1.VisitanteRelatorioEquipe(new recommendation_visitor_1.VisitanteCompatibilidadeEquipe())) {
        this.repositorioProfissionais = repositorioProfissionais;
        this.sujeitoRecomendacao = sujeitoRecomendacao;
        this.barramento = barramento;
        this.orquestrador = orquestrador;
        this.visitanteValidacao = visitanteValidacao;
        this.visitanteRelatorio = visitanteRelatorio;
    }
    async gerarRecomendacao(entrada) {
        const { projeto, nomeEstrategia } = entrada;
        const estrategia = recommendation_strategy_1.FabricaEstrategiaRecomendacao.obter(nomeEstrategia);
        const todosProfissionais = await this.repositorioProfissionais.buscarTodos();
        const candidatosPorPapel = this.agruparCandidatosPorPapel(projeto.papeisRequeridos, todosProfissionais);
        const recomendacao = this.orquestrador.compor(projeto, candidatosPorPapel, estrategia);
        this.sujeitoRecomendacao.notificarRecomendacaoGerada(recomendacao);
        this.barramento.publicar(event_bus_1.NomeEvento.RECOMENDACAO_GERADA, {
            recomendacaoId: recomendacao.id,
            projetoId: projeto.id,
        });
        for (const item of recomendacao.listarItens()) {
            this.barramento.publicar(event_bus_1.NomeEvento.CONVITE_ENVIADO, {
                recomendacaoId: recomendacao.id,
                profissionalId: item.profissional.id,
                papel: item.papel,
            });
        }
        const validacao = this.visitanteValidacao.visitarProjeto(projeto, recomendacao);
        const relatorio = this.visitanteRelatorio.visitarProjeto(projeto, recomendacao);
        return { recomendacao, validacao, relatorio };
    }
    /**
     * Substitui o membro sugerido para um papel especifico, disparando
     * uma nova rodada de recomendacao apenas para o papel afetado
     * (as demais escolhas permanecem fixas).
     */
    async substituirPapel(projeto, recomendacao, papelAfetado, nomeEstrategia) {
        const papelRequerido = projeto.papeisRequeridos.find((p) => p.nome === papelAfetado);
        if (!papelRequerido) {
            throw new Error(`Papel nao pertence ao projeto: ${papelAfetado}`);
        }
        const estrategia = recommendation_strategy_1.FabricaEstrategiaRecomendacao.obter(nomeEstrategia);
        const todosProfissionais = await this.repositorioProfissionais.buscarTodos();
        // Exclui tanto os profissionais ja escolhidos para os demais papeis
        // quanto o profissional atualmente sugerido para o proprio papel
        // afetado, pois uma substituicao busca uma alternativa a ele.
        const profissionalAtualDoPapel = recomendacao.itemDoPapel(papelAfetado)
            ?.profissional.id;
        const idsAExcluir = new Set(recomendacao
            .listarItens()
            .filter((i) => i.papel !== papelAfetado)
            .map((i) => i.profissional.id));
        if (profissionalAtualDoPapel) {
            idsAExcluir.add(profissionalAtualDoPapel);
        }
        const candidatos = todosProfissionais.filter((p) => p.atendePapel(papelAfetado) && !idsAExcluir.has(p.id));
        const ranqueados = estrategia.recomendar(projeto, papelRequerido, candidatos);
        const escolhido = ranqueados[0];
        if (escolhido) {
            recomendacao.substituirPapel(escolhido);
        }
        this.barramento.publicar(event_bus_1.NomeEvento.PAPEL_SUBSTITUIDO, {
            recomendacaoId: recomendacao.id,
            papel: papelAfetado,
        });
        return recomendacao;
    }
    registrarRespostaConvite(convite, aceitar) {
        if (aceitar) {
            convite.aceitar();
            this.barramento.publicar(event_bus_1.NomeEvento.CONVITE_ACEITO, { conviteId: convite.id });
        }
        else {
            convite.recusar();
            this.barramento.publicar(event_bus_1.NomeEvento.CONVITE_RECUSADO, {
                conviteId: convite.id,
            });
        }
        this.sujeitoRecomendacao.notificarConviteAtualizado(convite);
    }
    /**
     * Registra a composicao final da equipe (equipe consensual) e dispara
     * eventos para os microsservicos de gerenciamento de projetos e
     * processamento financeiro, iniciando o fluxo de trabalho seguinte.
     */
    registrarComposicaoFinal(projeto, recomendacao) {
        recomendacao.marcarConsensual();
        this.barramento.publicar(event_bus_1.NomeEvento.EQUIPE_CONSENSUAL, {
            projetoId: projeto.id,
            recomendacaoId: recomendacao.id,
        });
        recomendacao.marcarRegistrada();
        this.barramento.publicar(event_bus_1.NomeEvento.EQUIPE_REGISTRADA, {
            projetoId: projeto.id,
            recomendacaoId: recomendacao.id,
            papeis: recomendacao.papeisPreenchidos(),
            custoTotalEstimado: recomendacao.custoTotalEstimado(),
        });
    }
    criarConvitesParaRecomendacao(recomendacao) {
        return recomendacao.listarItens().map((item) => new entities_1.Convite((0, crypto_1.randomUUID)(), recomendacao.projetoId, item.profissional.id, item.papel));
    }
    agruparCandidatosPorPapel(papeisRequeridos, profissionais) {
        const mapa = new Map();
        for (const papel of papeisRequeridos) {
            mapa.set(papel.nome, profissionais.filter((p) => p.atendePapel(papel.nome)));
        }
        return mapa;
    }
}
exports.ServicoRecomendacaoEquipe = ServicoRecomendacaoEquipe;
//# sourceMappingURL=recommendation-service.js.map