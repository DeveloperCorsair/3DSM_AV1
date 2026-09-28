import { randomUUID } from "crypto";
import {
  Convite,
  NomePapel,
  PapelRequerido,
  Profissional,
  Projeto,
  Recomendacao,
} from "../domain/entities";
import { RepositorioProfissionais } from "../repository/professional-repository";
import {
  FabricaEstrategiaRecomendacao,
} from "../strategies/recommendation-strategy";
import {
  OrquestradorComposicaoEquipe,
  OrquestradorPadrao,
} from "../orchestrator/team-composition-orchestrator";
import { SujeitoRecomendacao } from "../observers/notification-observer";
import {
  ResultadoValidacao,
  VisitanteCompatibilidadeEquipe,
  VisitanteRelatorioEquipe,
  VisitanteValidacaoConsistencia,
  RelatorioEquipe,
} from "../visitors/recommendation-visitor";
import { Barramento, NomeEvento } from "../events/event-bus";

export interface EntradaGerarRecomendacao {
  projeto: Projeto;
  nomeEstrategia: string;
}

export interface SaidaGerarRecomendacao {
  recomendacao: Recomendacao;
  validacao: ResultadoValidacao;
  relatorio: RelatorioEquipe;
}

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
export class ServicoRecomendacaoEquipe {
  constructor(
    private readonly repositorioProfissionais: RepositorioProfissionais,
    private readonly sujeitoRecomendacao: SujeitoRecomendacao,
    private readonly barramento: Barramento,
    private readonly orquestrador: OrquestradorComposicaoEquipe = new OrquestradorPadrao(),
    private readonly visitanteValidacao: VisitanteValidacaoConsistencia = new VisitanteValidacaoConsistencia(),
    private readonly visitanteRelatorio: VisitanteRelatorioEquipe = new VisitanteRelatorioEquipe(
      new VisitanteCompatibilidadeEquipe()
    )
  ) {}

  async gerarRecomendacao(
    entrada: EntradaGerarRecomendacao
  ): Promise<SaidaGerarRecomendacao> {
    const { projeto, nomeEstrategia } = entrada;
    const estrategia = FabricaEstrategiaRecomendacao.obter(nomeEstrategia);

    const todosProfissionais = await this.repositorioProfissionais.buscarTodos();
    const candidatosPorPapel = this.agruparCandidatosPorPapel(
      projeto.papeisRequeridos,
      todosProfissionais
    );

    const recomendacao = this.orquestrador.compor(
      projeto,
      candidatosPorPapel,
      estrategia
    );

    this.sujeitoRecomendacao.notificarRecomendacaoGerada(recomendacao);
    this.barramento.publicar(NomeEvento.RECOMENDACAO_GERADA, {
      recomendacaoId: recomendacao.id,
      projetoId: projeto.id,
    });

    for (const item of recomendacao.listarItens()) {
      this.barramento.publicar(NomeEvento.CONVITE_ENVIADO, {
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
  async substituirPapel(
    projeto: Projeto,
    recomendacao: Recomendacao,
    papelAfetado: NomePapel,
    nomeEstrategia: string
  ): Promise<Recomendacao> {
    const papelRequerido = projeto.papeisRequeridos.find(
      (p) => p.nome === papelAfetado
    );
    if (!papelRequerido) {
      throw new Error(`Papel nao pertence ao projeto: ${papelAfetado}`);
    }

    const estrategia = FabricaEstrategiaRecomendacao.obter(nomeEstrategia);
    const todosProfissionais = await this.repositorioProfissionais.buscarTodos();

    // Exclui tanto os profissionais ja escolhidos para os demais papeis
    // quanto o profissional atualmente sugerido para o proprio papel
    // afetado, pois uma substituicao busca uma alternativa a ele.
    const profissionalAtualDoPapel = recomendacao.itemDoPapel(papelAfetado)
      ?.profissional.id;
    const idsAExcluir = new Set(
      recomendacao
        .listarItens()
        .filter((i) => i.papel !== papelAfetado)
        .map((i) => i.profissional.id)
    );
    if (profissionalAtualDoPapel) {
      idsAExcluir.add(profissionalAtualDoPapel);
    }

    const candidatos = todosProfissionais.filter(
      (p) => p.atendePapel(papelAfetado) && !idsAExcluir.has(p.id)
    );

    const ranqueados = estrategia.recomendar(projeto, papelRequerido, candidatos);
    const escolhido = ranqueados[0];
    if (escolhido) {
      recomendacao.substituirPapel(escolhido);
    }

    this.barramento.publicar(NomeEvento.PAPEL_SUBSTITUIDO, {
      recomendacaoId: recomendacao.id,
      papel: papelAfetado,
    });

    return recomendacao;
  }

  registrarRespostaConvite(convite: Convite, aceitar: boolean): void {
    if (aceitar) {
      convite.aceitar();
      this.barramento.publicar(NomeEvento.CONVITE_ACEITO, { conviteId: convite.id });
    } else {
      convite.recusar();
      this.barramento.publicar(NomeEvento.CONVITE_RECUSADO, {
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
  registrarComposicaoFinal(projeto: Projeto, recomendacao: Recomendacao): void {
    recomendacao.marcarConsensual();
    this.barramento.publicar(NomeEvento.EQUIPE_CONSENSUAL, {
      projetoId: projeto.id,
      recomendacaoId: recomendacao.id,
    });

    recomendacao.marcarRegistrada();
    this.barramento.publicar(NomeEvento.EQUIPE_REGISTRADA, {
      projetoId: projeto.id,
      recomendacaoId: recomendacao.id,
      papeis: recomendacao.papeisPreenchidos(),
      custoTotalEstimado: recomendacao.custoTotalEstimado(),
    });
  }

  criarConvitesParaRecomendacao(recomendacao: Recomendacao): Convite[] {
    return recomendacao.listarItens().map(
      (item) =>
        new Convite(randomUUID(), recomendacao.projetoId, item.profissional.id, item.papel)
    );
  }

  private agruparCandidatosPorPapel(
    papeisRequeridos: PapelRequerido[],
    profissionais: Profissional[]
  ): Map<string, Profissional[]> {
    const mapa = new Map<string, Profissional[]>();
    for (const papel of papeisRequeridos) {
      mapa.set(
        papel.nome,
        profissionais.filter((p) => p.atendePapel(papel.nome))
      );
    }
    return mapa;
  }
}
