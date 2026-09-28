"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositorioProfissionaisTolerranteAFalhas = exports.RepositorioProfissionaisEmMemoria = void 0;
class RepositorioProfissionaisEmMemoria {
    constructor(profissionais = []) {
        this.profissionais = profissionais;
    }
    async buscarTodos() {
        return this.profissionais;
    }
    async buscarPorId(id) {
        return this.profissionais.find((p) => p.id === id);
    }
    adicionar(profissional) {
        this.profissionais.push(profissional);
    }
}
exports.RepositorioProfissionaisEmMemoria = RepositorioProfissionaisEmMemoria;
/**
 * Decorator de tolerancia a falhas: encapsula um repositorio real e,
 * em caso de erro (timeout, indisponibilidade, etc.), retorna um
 * fallback definido (por padrao, lista vazia / undefined) em vez de
 * propagar a excecao, permitindo que o motor de recomendacao degrade
 * graciosamente (recomendacoes parciais).
 */
class RepositorioProfissionaisTolerranteAFalhas {
    constructor(interno, aoFalhar) {
        this.interno = interno;
        this.aoFalhar = aoFalhar;
    }
    async buscarTodos() {
        try {
            return await this.interno.buscarTodos();
        }
        catch (erro) {
            this.aoFalhar?.(erro);
            return [];
        }
    }
    async buscarPorId(id) {
        try {
            return await this.interno.buscarPorId(id);
        }
        catch (erro) {
            this.aoFalhar?.(erro);
            return undefined;
        }
    }
}
exports.RepositorioProfissionaisTolerranteAFalhas = RepositorioProfissionaisTolerranteAFalhas;
//# sourceMappingURL=professional-repository.js.map