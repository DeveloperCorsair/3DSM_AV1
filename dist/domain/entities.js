"use strict";
/**
 * Entidades centrais do dominio do microsservico de recomendacao e
 * orquestracao de equipes da plataforma CineBridge.
 *
 * Estas classes representam a "arvore de dados" do projeto sobre a qual
 * os Visitors (ver src/visitors) irao operar, alem de servirem de base
 * para as Strategies de recomendacao (ver src/strategies).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Recomendacao = exports.ItemRecomendacao = exports.Convite = exports.Projeto = exports.Profissional = exports.Avaliacao = exports.VetorCompetencia = exports.PapelRequerido = void 0;
/** Papel tecnico obrigatorio exigido por um projeto, com peso de importancia. */
class PapelRequerido {
    constructor(nome, 
    /** Peso relativo de importancia do papel para o sucesso do projeto (0 a 1). */
    peso) {
        this.nome = nome;
        this.peso = peso;
        if (peso < 0 || peso > 1) {
            throw new Error(`Peso invalido para o papel ${nome}: ${peso}`);
        }
    }
}
exports.PapelRequerido = PapelRequerido;
/** Vetor de competencias tecnicas normalizado (0 a 1 por dimensao). */
class VetorCompetencia {
    constructor(pesos) {
        this.pesos = pesos;
    }
    pesoPara(papel) {
        return this.pesos.get(papel) ?? 0;
    }
    /** Similaridade de cosseno entre este vetor e outro, restrito aos papeis informados. */
    similaridadeCosseno(outro, papeis) {
        let produtoInterno = 0;
        let normaA = 0;
        let normaB = 0;
        for (const papel of papeis) {
            const a = this.pesoPara(papel);
            const b = outro.pesoPara(papel);
            produtoInterno += a * b;
            normaA += a * a;
            normaB += b * b;
        }
        if (normaA === 0 || normaB === 0)
            return 0;
        return produtoInterno / (Math.sqrt(normaA) * Math.sqrt(normaB));
    }
}
exports.VetorCompetencia = VetorCompetencia;
class Avaliacao {
    constructor(projetoId, 
    /** Nota de 0 a 5 atribuida ao profissional ao final de um projeto anterior. */
    nota, comentario) {
        this.projetoId = projetoId;
        this.nota = nota;
        this.comentario = comentario;
        if (nota < 0 || nota > 5) {
            throw new Error(`Nota de avaliacao invalida: ${nota}`);
        }
    }
}
exports.Avaliacao = Avaliacao;
class Profissional {
    constructor(id, nome, especialidades, faixaPreco, disponibilidade, localizacao, competencias, historico = []) {
        this.id = id;
        this.nome = nome;
        this.especialidades = especialidades;
        this.faixaPreco = faixaPreco;
        this.disponibilidade = disponibilidade;
        this.localizacao = localizacao;
        this.competencias = competencias;
        this.historico = historico;
    }
    notaMedia() {
        if (this.historico.length === 0)
            return 0;
        const soma = this.historico.reduce((acc, a) => acc + a.nota, 0);
        return soma / this.historico.length;
    }
    atendePapel(papel) {
        return this.especialidades.includes(papel);
    }
    estaDisponivelEntre(inicio, fim) {
        return this.disponibilidade.some((periodo) => periodo.inicio <= inicio && periodo.fim >= fim);
    }
    dentroDoOrcamento(valorMaximoPorPapel) {
        return this.faixaPreco.minimo <= valorMaximoPorPapel;
    }
}
exports.Profissional = Profissional;
class Projeto {
    constructor(id, genero, duracaoEstimadaMinutos, orcamentoTotal, dataEntrega, tipoCaptacao, localizacao, papeisRequeridos) {
        this.id = id;
        this.genero = genero;
        this.duracaoEstimadaMinutos = duracaoEstimadaMinutos;
        this.orcamentoTotal = orcamentoTotal;
        this.dataEntrega = dataEntrega;
        this.tipoCaptacao = tipoCaptacao;
        this.localizacao = localizacao;
        this.papeisRequeridos = papeisRequeridos;
    }
    orcamentoPorPapel() {
        const pesoTotal = this.papeisRequeridos.reduce((acc, p) => acc + p.peso, 0);
        if (pesoTotal === 0)
            return 0;
        return this.orcamentoTotal / this.papeisRequeridos.length;
    }
}
exports.Projeto = Projeto;
class Convite {
    constructor(id, projetoId, profissionalId, papel) {
        this.id = id;
        this.projetoId = projetoId;
        this.profissionalId = profissionalId;
        this.papel = papel;
        this.status = "pendente";
    }
    aceitar() {
        this.status = "aceito";
    }
    recusar() {
        this.status = "recusado";
    }
}
exports.Convite = Convite;
/** Sugestao de profissional para um papel especifico, com pontuacao do motor de recomendacao. */
class ItemRecomendacao {
    constructor(papel, profissional, pontuacao) {
        this.papel = papel;
        this.profissional = profissional;
        this.pontuacao = pontuacao;
    }
}
exports.ItemRecomendacao = ItemRecomendacao;
class Recomendacao {
    constructor(id, projetoId, itensIniciais) {
        this.id = id;
        this.projetoId = projetoId;
        this.status = "gerada";
        this.itens = new Map(itensIniciais.map((item) => [item.papel, item]));
    }
    listarItens() {
        return Array.from(this.itens.values());
    }
    itemDoPapel(papel) {
        return this.itens.get(papel);
    }
    substituirPapel(item) {
        this.itens.set(item.papel, item);
        this.status = "em_ajuste";
    }
    marcarConsensual() {
        this.status = "consensual";
    }
    marcarRegistrada() {
        this.status = "registrada";
    }
    papeisPreenchidos() {
        return Array.from(this.itens.keys());
    }
    custoTotalEstimado() {
        return this.listarItens().reduce((acc, item) => acc + item.profissional.faixaPreco.minimo, 0);
    }
}
exports.Recomendacao = Recomendacao;
//# sourceMappingURL=entities.js.map