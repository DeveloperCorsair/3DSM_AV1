"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitanteRelatorioEquipe = exports.VisitanteCompatibilidadeEquipe = exports.VisitanteValidacaoConsistencia = void 0;
/** Verifica se todos os papeis obrigatorios estao preenchidos e se o orcamento e suficiente. */
class VisitanteValidacaoConsistencia {
    visitarProjeto(projeto, recomendacao) {
        const erros = [];
        for (const papel of projeto.papeisRequeridos) {
            const item = recomendacao.itemDoPapel(papel.nome);
            if (!item) {
                erros.push(`Papel obrigatorio nao preenchido: ${papel.nome}`);
            }
        }
        const custoTotal = recomendacao.custoTotalEstimado();
        if (custoTotal > projeto.orcamentoTotal) {
            erros.push(`Orcamento insuficiente: custo estimado ${custoTotal} excede o orcamento total ${projeto.orcamentoTotal}`);
        }
        return { valido: erros.length === 0, erros };
    }
}
exports.VisitanteValidacaoConsistencia = VisitanteValidacaoConsistencia;
/** Calcula uma metrica agregada de compatibilidade geral da equipe. */
class VisitanteCompatibilidadeEquipe {
    visitarProjeto(projeto, recomendacao) {
        const pesoPorPapel = new Map(projeto.papeisRequeridos.map((p) => [p.nome, p.peso]));
        let somaPonderada = 0;
        let somaPesos = 0;
        for (const item of recomendacao.listarItens()) {
            const peso = pesoPorPapel.get(item.papel) ?? 0;
            somaPonderada += item.pontuacao * peso;
            somaPesos += peso;
        }
        if (somaPesos === 0)
            return 0;
        return somaPonderada / somaPesos;
    }
}
exports.VisitanteCompatibilidadeEquipe = VisitanteCompatibilidadeEquipe;
/** Gera um relatorio completo da equipe para apresentacao ao produtor. */
class VisitanteRelatorioEquipe {
    constructor(visitanteCompatibilidade = new VisitanteCompatibilidadeEquipe()) {
        this.visitanteCompatibilidade = visitanteCompatibilidade;
    }
    visitarProjeto(projeto, recomendacao) {
        const custoTotal = recomendacao.custoTotalEstimado();
        return {
            projetoId: projeto.id,
            recomendacaoId: recomendacao.id,
            quantidadePapeis: projeto.papeisRequeridos.length,
            papeisPreenchidos: recomendacao.papeisPreenchidos(),
            custoTotalEstimado: custoTotal,
            orcamentoTotal: projeto.orcamentoTotal,
            margemOrcamentaria: projeto.orcamentoTotal - custoTotal,
            compatibilidadeMedia: this.visitanteCompatibilidade.visitarProjeto(projeto, recomendacao),
        };
    }
}
exports.VisitanteRelatorioEquipe = VisitanteRelatorioEquipe;
//# sourceMappingURL=recommendation-visitor.js.map