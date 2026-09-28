"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dtoParaProjeto = dtoParaProjeto;
const entities_1 = require("../domain/entities");
function dtoParaProjeto(dto, idGerado) {
    if (!dto.papeisRequeridos || dto.papeisRequeridos.length === 0) {
        throw new Error("O projeto deve informar ao menos um papel requerido.");
    }
    const papeis = dto.papeisRequeridos.map((p) => new entities_1.PapelRequerido(p.nome, p.peso));
    return new entities_1.Projeto(dto.id ?? idGerado, dto.genero, dto.duracaoEstimadaMinutos, dto.orcamentoTotal, new Date(dto.dataEntrega), dto.tipoCaptacao, dto.localizacao, papeis);
}
//# sourceMappingURL=dto.js.map