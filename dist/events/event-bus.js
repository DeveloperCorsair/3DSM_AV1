"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarramentoEmMemoria = exports.NomeEvento = void 0;
const events_1 = require("events");
/**
 * Nomes de eventos de dominio emitidos pelo microsservico.
 * Mantidos em um enum de strings para facilitar a futura migracao
 * para um sistema de filas (ex.: RabbitMQ) sem alterar a logica de negocio:
 * o "topico" da fila poderia mapear 1:1 para estes nomes.
 */
var NomeEvento;
(function (NomeEvento) {
    NomeEvento["RECOMENDACAO_GERADA"] = "recomendacao.gerada";
    NomeEvento["PAPEL_SUBSTITUIDO"] = "recomendacao.papel_substituido";
    NomeEvento["CONVITE_ENVIADO"] = "convite.enviado";
    NomeEvento["CONVITE_ACEITO"] = "convite.aceito";
    NomeEvento["CONVITE_RECUSADO"] = "convite.recusado";
    NomeEvento["EQUIPE_CONSENSUAL"] = "equipe.consensual";
    NomeEvento["EQUIPE_REGISTRADA"] = "equipe.registrada";
})(NomeEvento || (exports.NomeEvento = NomeEvento = {}));
class BarramentoEmMemoria {
    constructor() {
        this.emissor = new events_1.EventEmitter();
        // Suporta muitos observadores simultaneos (notificacoes, auditoria, etc.)
        this.emissor.setMaxListeners(50);
    }
    publicar(nome, payload) {
        const evento = { nome, ocorridoEm: new Date(), payload };
        this.emissor.emit(nome, evento);
    }
    assinar(nome, ouvinte) {
        this.emissor.on(nome, ouvinte);
    }
}
exports.BarramentoEmMemoria = BarramentoEmMemoria;
//# sourceMappingURL=event-bus.js.map