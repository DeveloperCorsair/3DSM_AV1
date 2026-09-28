"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObservadorAuditoria = exports.ObservadorMensagemInterna = exports.ObservadorEmail = exports.SujeitoRecomendacao = void 0;
class SujeitoRecomendacao {
    constructor() {
        this.observadores = [];
    }
    inscrever(observador) {
        this.observadores.push(observador);
    }
    desinscrever(observador) {
        const indice = this.observadores.indexOf(observador);
        if (indice >= 0)
            this.observadores.splice(indice, 1);
    }
    notificarRecomendacaoGerada(recomendacao) {
        for (const observador of this.observadores) {
            observador.aoGerarRecomendacao(recomendacao);
        }
    }
    notificarConviteAtualizado(convite) {
        for (const observador of this.observadores) {
            observador.aoAtualizarConvite(convite);
        }
    }
}
exports.SujeitoRecomendacao = SujeitoRecomendacao;
/** Registra o envio de e-mails aos profissionais e ao produtor. */
class ObservadorEmail {
    constructor() {
        this.enviados = [];
    }
    aoGerarRecomendacao(recomendacao) {
        for (const item of recomendacao.listarItens()) {
            this.enviados.push(`email:convite:${item.profissional.id}:${item.papel}:${recomendacao.projetoId}`);
        }
    }
    aoAtualizarConvite(convite) {
        this.enviados.push(`email:status_convite:${convite.id}:${convite.status}`);
    }
}
exports.ObservadorEmail = ObservadorEmail;
/** Simula o envio de mensagens internas da plataforma (ex.: notificacoes push/in-app). */
class ObservadorMensagemInterna {
    constructor() {
        this.mensagens = [];
    }
    aoGerarRecomendacao(recomendacao) {
        this.mensagens.push(`mensagem:nova_recomendacao:${recomendacao.id}:${recomendacao.projetoId}`);
    }
    aoAtualizarConvite(convite) {
        this.mensagens.push(`mensagem:convite_atualizado:${convite.id}:${convite.status}`);
    }
}
exports.ObservadorMensagemInterna = ObservadorMensagemInterna;
class ObservadorAuditoria {
    constructor() {
        this.registros = [];
    }
    aoGerarRecomendacao(recomendacao) {
        this.registros.push({
            timestamp: new Date(),
            tipo: "recomendacao_gerada",
            detalhes: {
                recomendacaoId: recomendacao.id,
                projetoId: recomendacao.projetoId,
                papeis: recomendacao.papeisPreenchidos(),
            },
        });
    }
    aoAtualizarConvite(convite) {
        this.registros.push({
            timestamp: new Date(),
            tipo: "convite_atualizado",
            detalhes: {
                conviteId: convite.id,
                profissionalId: convite.profissionalId,
                status: convite.status,
            },
        });
    }
}
exports.ObservadorAuditoria = ObservadorAuditoria;
//# sourceMappingURL=notification-observer.js.map