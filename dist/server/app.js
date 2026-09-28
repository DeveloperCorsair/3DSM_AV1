"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.construirApp = construirApp;
const fastify_1 = __importDefault(require("fastify"));
const crypto_1 = require("crypto");
const composition_root_1 = require("./composition-root");
const dto_1 = require("./dto");
function construirApp(dependencias = (0, composition_root_1.construirDependencias)()) {
    const app = (0, fastify_1.default)({ logger: true });
    const { servico } = dependencias;
    app.get("/saude", async () => ({ status: "ok" }));
    /**
     * Endpoint principal: aceita um projeto, aplica a estrategia
     * configurada (Strategy) atraves do orquestrador (Template Method),
     * retorna a equipe recomendada e, como efeito colateral, notifica
     * os observadores (Observer) e publica eventos de dominio.
     */
    app.post("/projetos/recomendacoes", async (request, reply) => {
        try {
            const dto = request.body;
            const projeto = (0, dto_1.dtoParaProjeto)(dto, (0, crypto_1.randomUUID)());
            const nomeEstrategia = dto.estrategia ?? "similaridade_cosseno";
            const resultado = await servico.gerarRecomendacao({
                projeto,
                nomeEstrategia,
            });
            return reply.status(201).send({
                recomendacaoId: resultado.recomendacao.id,
                projetoId: projeto.id,
                status: resultado.recomendacao.status,
                itens: resultado.recomendacao.listarItens().map((item) => ({
                    papel: item.papel,
                    profissionalId: item.profissional.id,
                    profissionalNome: item.profissional.nome,
                    pontuacao: item.pontuacao,
                })),
                validacao: resultado.validacao,
                relatorio: resultado.relatorio,
            });
        }
        catch (erro) {
            request.log.error(erro);
            return reply.status(400).send({
                erro: erro instanceof Error ? erro.message : "Erro desconhecido",
            });
        }
    });
    return app;
}
/* istanbul ignore next -- ponto de entrada do processo, nao coberto por testes unitarios */
if (require.main === module) {
    const app = construirApp();
    const porta = Number(process.env.PORT ?? 3000);
    app.listen({ port: porta, host: "0.0.0.0" }).catch((erro) => {
        app.log.error(erro);
        process.exit(1);
    });
}
//# sourceMappingURL=app.js.map