import Fastify, { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { construirDependencias, Dependencias } from "./composition-root";
import { CriarProjetoDTO, dtoParaProjeto } from "./dto";

export function construirApp(dependencias: Dependencias = construirDependencias()): FastifyInstance {
  const app = Fastify({ logger: true });
  const { servico } = dependencias;

  app.get("/saude", async () => ({ status: "ok" }));

  /**
   * Endpoint principal: aceita um projeto, aplica a estrategia
   * configurada (Strategy) atraves do orquestrador (Template Method),
   * retorna a equipe recomendada e, como efeito colateral, notifica
   * os observadores (Observer) e publica eventos de dominio.
   */
  app.post<{ Body: CriarProjetoDTO }>("/projetos/recomendacoes", async (request, reply) => {
    try {
      const dto = request.body;
      const projeto = dtoParaProjeto(dto, randomUUID());
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
    } catch (erro) {
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
