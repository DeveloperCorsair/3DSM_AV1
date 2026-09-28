import { NomePapel, PapelRequerido, Projeto, TipoCaptacao } from "../domain/entities";

export interface PapelRequeridoDTO {
  nome: NomePapel;
  peso: number;
}

export interface CriarProjetoDTO {
  id?: string;
  genero: string;
  duracaoEstimadaMinutos: number;
  orcamentoTotal: number;
  dataEntrega: string; // ISO 8601
  tipoCaptacao: TipoCaptacao;
  localizacao: { cidade: string; estado: string; pais: string };
  papeisRequeridos: PapelRequeridoDTO[];
  estrategia?: string;
}

export function dtoParaProjeto(dto: CriarProjetoDTO, idGerado: string): Projeto {
  if (!dto.papeisRequeridos || dto.papeisRequeridos.length === 0) {
    throw new Error("O projeto deve informar ao menos um papel requerido.");
  }

  const papeis = dto.papeisRequeridos.map(
    (p) => new PapelRequerido(p.nome, p.peso)
  );

  return new Projeto(
    dto.id ?? idGerado,
    dto.genero,
    dto.duracaoEstimadaMinutos,
    dto.orcamentoTotal,
    new Date(dto.dataEntrega),
    dto.tipoCaptacao,
    dto.localizacao,
    papeis
  );
}
