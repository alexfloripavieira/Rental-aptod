import * as yup from 'yup';

function validarCpf(cpf: string | undefined): boolean {
  if (!cpf) return false;
  const numeros = cpf.replace(/\D/g, '');
  if (numeros.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numeros)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(numeros.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(numeros.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(numeros.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(numeros.charAt(10))) return false;

  return true;
}

export const contratoSchema = yup.object({
  locador: yup.object({
    nomeCompleto: yup.string().required('Campo obrigatório').max(200, 'Máximo 200 caracteres'),
    nacionalidade: yup.string().required('Campo obrigatório').max(50, 'Máximo 50 caracteres'),
    estadoCivil: yup.string().required('Campo obrigatório').max(30, 'Máximo 30 caracteres'),
    profissao: yup.string().required('Campo obrigatório').max(100, 'Máximo 100 caracteres'),
    cpf: yup
      .string()
      .required('Campo obrigatório')
      .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'Formato inválido: XXX.XXX.XXX-XX')
      .test('cpf-valido', 'CPF inválido', validarCpf),
    endereco: yup.object({
      rua: yup.string().required('Campo obrigatório').max(200),
      numero: yup.string().required('Campo obrigatório').max(20),
      bairro: yup.string().required('Campo obrigatório').max(100),
      cidade: yup.string().required('Campo obrigatório').max(100),
      estado: yup
        .string()
        .required('Campo obrigatório')
        .length(2, 'UF deve ter 2 letras'),
      cep: yup
        .string()
        .required('Campo obrigatório')
        .matches(/^\d{5}-\d{3}$/, 'Formato inválido: XXXXX-XXX'),
    }),
  }),
  locatario: yup.object({
    nomeCompleto: yup.string().required('Campo obrigatório').max(200),
    nacionalidade: yup.string().required('Campo obrigatório').max(50),
    profissao: yup.string().required('Campo obrigatório').max(100),
    cpf: yup
      .string()
      .required('Campo obrigatório')
      .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'Formato inválido')
      .test('cpf-valido', 'CPF inválido', validarCpf),
    rg: yup.string().required('Campo obrigatório').max(20),
    rgOrgao: yup.string().required('Campo obrigatório').max(20),
    enderecoCompleto: yup.string().required('Campo obrigatório').max(300),
    telefone: yup
      .string()
      .required('Campo obrigatório')
      .matches(/^\(\d{2}\) \d{5}-\d{4}$/, 'Formato inválido: (XX) XXXXX-XXXX'),
    email: yup.string().required('Campo obrigatório').email('Email inválido'),
  }),
  contrato: yup.object({
    dataInicio: yup
      .string()
      .required('Campo obrigatório')
      .matches(/^\d{4}-\d{2}-\d{2}$/, 'Formato inválido para data. Use um dos formatos a seguir: YYYY-MM-DD'),
    valorCaucao: yup
      .number()
      .required('Campo obrigatório')
      .positive('Valor deve ser positivo')
      .max(999999.99, 'Valor máximo excedido'),
    clausulaSegunda: yup
      .string()
      .required('Campo obrigatório')
      .min(50, 'Mínimo 50 caracteres')
      .max(5000, 'Máximo 5000 caracteres'),
  }),
  inventarioMoveis: yup
    .string()
    .required('Campo obrigatório')
    .min(20, 'Mínimo 20 caracteres')
    .max(2000, 'Máximo 2000 caracteres'),
});
