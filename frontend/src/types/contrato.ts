export interface EnderecoLocador {
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface Locador {
  nomeCompleto: string;
  nacionalidade: string;
  estadoCivil: string;
  profissao: string;
  cpf: string;
  endereco: EnderecoLocador;
}

export interface Locatario {
  nomeCompleto: string;
  nacionalidade: string;
  profissao: string;
  cpf: string;
  rg: string;
  rgOrgao: string;
  enderecoCompleto: string;
  telefone: string;
  email: string;
}

export interface ContratoDetalhes {
  dataInicio: string;
  valorCaucao: number;
  clausulaSegunda: string;
}

export interface ContratoFormData {
  locador: Locador;
  locatario: Locatario;
  contrato: ContratoDetalhes;
  inventarioMoveis: string;
}

export interface ContratoApiPayload {
  locador: {
    nomeCompleto: string;
    nacionalidade: string;
    estadoCivil: string;
    profissao: string;
    cpf: string;
    endereco: {
      rua: string;
      numero: string;
      bairro: string;
      cidade: string;
      estado: string;
      cep: string;
    };
  };
  locatario: {
    nomeCompleto: string;
    nacionalidade: string;
    profissao: string;
    cpf: string;
    rg: string;
    rgOrgao: string;
    enderecoCompleto: string;
    telefone: string;
    email: string;
  };
  contrato: {
    dataInicio: string;
    valorCaucao: number;
    clausulaSegunda: string;
  };
  inventarioMoveis: string;
}
