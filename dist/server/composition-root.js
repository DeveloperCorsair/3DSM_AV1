"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.construirDependencias = construirDependencias;
const entities_1 = require("../domain/entities");
const professional_repository_1 = require("../repository/professional-repository");
const event_bus_1 = require("../events/event-bus");
const notification_observer_1 = require("../observers/notification-observer");
const recommendation_service_1 = require("./recommendation-service");
function criarProfissionalExemplo(id, nome, especialidades, precoMinimo, precoMaximo, notaMedia, competenciaPorPapel) {
    const historico = notaMedia > 0
        ? [new entities_1.Avaliacao("projeto-seed", notaMedia), new entities_1.Avaliacao("projeto-seed-2", notaMedia)]
        : [];
    return new entities_1.Profissional(id, nome, especialidades, { minimo: precoMinimo, maximo: precoMaximo }, [{ inicio: new Date("2026-01-01"), fim: new Date("2027-12-31") }], { cidade: "Sao Paulo", estado: "SP", pais: "Brasil" }, new entities_1.VetorCompetencia(new Map(Object.entries(competenciaPorPapel))), historico);
}
/** Cria o container de dependencias com dados de exemplo para desenvolvimento local. */
function construirDependencias() {
    const repositorioProfissionaisSeed = new professional_repository_1.RepositorioProfissionaisEmMemoria([
        criarProfissionalExemplo("prof-1", "Ana Ribeiro", ["diretor"], 8000, 15000, 4.5, { diretor: 0.9 }),
        criarProfissionalExemplo("prof-2", "Bruno Alves", ["diretor_fotografia"], 6000, 12000, 4.2, { diretor_fotografia: 0.85 }),
        criarProfissionalExemplo("prof-3", "Camila Souza", ["sonoplasta"], 3000, 6000, 4.0, { sonoplasta: 0.8 }),
        criarProfissionalExemplo("prof-4", "Daniel Nogueira", ["editor"], 4000, 8000, 3.8, { editor: 0.75 }),
        criarProfissionalExemplo("prof-5", "Elisa Martins", ["roteirista"], 5000, 9000, 4.7, { roteirista: 0.92 }),
        criarProfissionalExemplo("prof-6", "Fabio Teixeira", ["efeitos_visuais"], 7000, 14000, 4.1, { efeitos_visuais: 0.82 }),
        criarProfissionalExemplo("prof-7", "Gabriela Lima", ["diretor", "roteirista"], 3000, 6000, 3.5, { diretor: 0.6, roteirista: 0.65 }),
    ]);
    const repositorioTolerante = new professional_repository_1.RepositorioProfissionaisTolerranteAFalhas(repositorioProfissionaisSeed, (erro) => console.error("Falha no repositorio de profissionais:", erro));
    const barramento = new event_bus_1.BarramentoEmMemoria();
    const sujeitoRecomendacao = new notification_observer_1.SujeitoRecomendacao();
    const observadorEmail = new notification_observer_1.ObservadorEmail();
    const observadorMensagemInterna = new notification_observer_1.ObservadorMensagemInterna();
    const observadorAuditoria = new notification_observer_1.ObservadorAuditoria();
    sujeitoRecomendacao.inscrever(observadorEmail);
    sujeitoRecomendacao.inscrever(observadorMensagemInterna);
    sujeitoRecomendacao.inscrever(observadorAuditoria);
    const servico = new recommendation_service_1.ServicoRecomendacaoEquipe(repositorioTolerante, sujeitoRecomendacao, barramento);
    return {
        servico,
        observadorEmail,
        observadorMensagemInterna,
        observadorAuditoria,
        repositorioProfissionaisSeed,
    };
}
//# sourceMappingURL=composition-root.js.map