// Calculadora 3D PRO - Lógica de Cálculo
// Convertida de Python para TypeScript/JavaScript

// --- TABELAS DE CONFIGURAÇÃO ---
export const custoEnergiaKwh: Record<string, number> = {
  "Média Nacional": 0.72,
  "AC": 0.82,
  "AL": 0.75,
  "AP": 0.70,
  "AM": 0.83,
  "BA": 0.78,
  "CE": 0.79,
  "DF": 0.68,
  "ES": 0.65,
  "GO": 0.72,
  "MA": 0.74,
  "MT": 0.80,
  "MS": 0.85,
  "MG": 0.75,
  "PA": 0.88,
  "PB": 0.72,
  "PR": 0.64,
  "PE": 0.77,
  "PI": 0.76,
  "RJ": 0.85,
  "RN": 0.73,
  "RS": 0.72,
  "RO": 0.78,
  "RR": 0.70,
  "SC": 0.62,
  "SP": 0.70,
  "SE": 0.75,
  "TO": 0.77,
};

export const aliquotasIcms: Record<string, number> = {
  "Média Nacional": 18,
  "AC": 17,
  "AL": 19,
  "AP": 18,
  "AM": 18,
  "BA": 19,
  "CE": 18,
  "DF": 18,
  "ES": 17,
  "GO": 17,
  "MA": 20,
  "MT": 17,
  "MS": 17,
  "MG": 18,
  "PA": 17,
  "PB": 18,
  "PR": 19,
  "PE": 18,
  "PI": 18,
  "RJ": 20,
  "RN": 18,
  "RS": 17,
  "RO": 17,
  "RR": 17,
  "SC": 17,
  "SP": 18,
  "SE": 18,
  "TO": 18,
};

export const maquinasBrasil: Record<string, [number, number]> = {
  "Bambu Lab A1": [0.95, 1.0],
  "Bambu Lab A1 Mini": [0.75, 0.8],
  "Creality K1 / K1C": [1.5, 1.4],
  "Bambu Lab P1P / P1S": [1.6, 1.3],
  "Bambu Lab X1 Carbon": [2.5, 1.5],
  "Creality Ender 3 V3": [0.7, 0.9],
  "Outra / Personalizada": [0.9, 1.0],
};

// Função para arredondar com psicologia de preço
export function arredondarPsicologico(valor: number): number {
  const inteiro = Math.floor(valor);
  const centavos = valor - inteiro;
  return inteiro + (centavos <= 0.49 ? 0.49 : 0.99);
}

// Interface para os parâmetros de cálculo
export interface ParametrosCalculo {
  material: string;
  peso: number;
  precoKg: number;
  tImp: number;
  tPosHoras: number;
  tPosMinutos: number;
  exclusivo: boolean;
  qtdKit: number;
  descKit: number;
  vHora: number;
  cMaq: number;
  estado: string;
  mkpShopee: boolean;
  mkpMl: boolean;
  chkFrete: boolean;
  vFrete: number;
  chkRisco: boolean;
  multExcl: number;
  nomeMaquina: string;
  chkIcms: boolean;
  chkIss: boolean;
  nomeCliente: string;
  nomePeca: string;
}

// Interface para o resultado
export interface ResultadoCalculo {
  resUn: string;  // Apenas valor sugerido (para histórico)
  resKit: string; // Apenas valor sugerido (para histórico)
  resUnCompleto: string;  // Mínimo | Sugerido | Premium (para resultados)
  resKitCompleto: string; // Mínimo | Sugerido | Premium (para resultados)
  resZap: string;
  valoresUnitarios: number[];
  valoresKit: number[];
  custoUnitario: number;
  custoTotal: number;
  resCustoTotal: string;
}

export function calcularPro(params: ParametrosCalculo): ResultadoCalculo {
  const {
    material,
    peso,
    precoKg,
    tImp,
    tPosHoras,
    tPosMinutos,
    exclusivo,
    qtdKit,
    descKit,
    vHora,
    cMaq,
    estado,
    mkpShopee,
    mkpMl,
    chkFrete,
    vFrete,
    chkRisco,
    multExcl,
    nomeMaquina,
    chkIcms,
    chkIss,
    nomeCliente,
  } = params;

  // Converter tempo de acabamento para horas decimais
  const tPosTotal = tPosHoras + tPosMinutos / 60;

  // 1. Custos de Produção (sem incluir trabalho de acabamento)
  const valorKwh = custoEnergiaKwh[estado] || 0.72;
  const fatorCons = maquinasBrasil[nomeMaquina]?.[1] || 1.0;
  const multMat: Record<string, number> = {
    PLA: 0.8,
    PETG: 1.0,
    ABS: 1.4,
  };
  const eReal = valorKwh * (multMat[material] || 1.0) * fatorCons;

  const cMaterial = (precoKg / 1000) * peso;
  const cOperacional = (eReal + cMaq) * tImp;

  let custoBase = cMaterial + cOperacional;
  if (chkRisco) custoBase *= 1.1;

  // 2. Cálculo das Margens (Mínimo, Sugerido, Premium) - SEM trabalho de acabamento
  const margens = exclusivo
    ? [multExcl, multExcl * 1.3, multExcl * 1.6]
    : [2.5, 3.5, 5.0];

  const vBase = margens.map((m) => custoBase * m);

  // 3. Markup de Taxas e Impostos
  const pIcms = (aliquotasIcms[estado] || 18) / 100;
  const pIss = 0.05;
  const taxas =
    (mkpShopee ? 0.15 : 0) +
    (mkpMl ? 0.17 : 0) +
    (chkIcms ? pIcms : 0) +
    (chkIss ? pIss : 0);

  // 4. Custo unitario de trabalho (acabamento por unidade)
  const custoTrabalhoUnitario = tPosTotal * vHora;

  // 5. Processamento Final (Taxas -> Arredondamento -> Adicionar acabamento e frete)
  const vFinais: number[] = [];
  for (const v of vBase) {
    const vComTaxa = taxas < 1 ? v / (1 - taxas) : v;
    const vArredondado = arredondarPsicologico(vComTaxa);
    let vFinal = vArredondado + custoTrabalhoUnitario;
    if (chkFrete) vFinal += vFrete;
    vFinais.push(vFinal);
  }

  // 6. Cálculos do Lote (Kit)
  const fatorDesc = qtdKit > 1 ? 1 - descKit / 100 : 1.0;
  // Remover frete dos unitários antes de multiplicar (frete será adicionado uma única vez)
  const vSemFrete = vFinais.map((v) => chkFrete ? v - vFrete : v);
  let kFinais = vSemFrete.map((v) => v * qtdKit * fatorDesc);
  
  // Adicionar frete apenas uma vez no total do lote
  if (chkFrete) {
    kFinais[0] += vFrete;
    kFinais[1] += vFrete;
    kFinais[2] += vFrete;
  }

  // Aplicar arredondamento psicologico aos valores do lote
  kFinais = kFinais.map((v) => arredondarPsicologico(v));

  // Formatação das Strings de saída - apenas valor sugerido (índice 1)
  const resUn = `R$ ${vFinais[1].toFixed(2)}`;
  const resKit = `R$ ${kFinais[1].toFixed(2)}`;

  // Cálculo de custos totais (com todas as taxas)
  // Custo base: material + energia
  let custoBaseSemRisco = cMaterial + cOperacional;
  
  // Adicionar risco se marcado
  let custoComRisco = custoBaseSemRisco;
  if (chkRisco) custoComRisco *= 1.1;
  
  // Adicionar trabalho de acabamento
  let custoComAcabamento = custoComRisco + custoTrabalhoUnitario;
  
  // Adicionar taxas (ICMS, ISS, Shopee, ML)
  const taxasCusto = 
    (chkIcms ? (aliquotasIcms[estado] || 18) / 100 : 0) +
    (chkIss ? 0.05 : 0) +
    (mkpShopee ? 0.15 : 0) +
    (mkpMl ? 0.17 : 0);
  
  // Adicionar modelagem própria (multiplica por 1.5)
  let custoComTaxas = custoComAcabamento;
  if (taxasCusto < 1) {
    custoComTaxas = custoComAcabamento / (1 - taxasCusto);
  }
  
  if (exclusivo) {
    custoComTaxas *= 1.5;
  }
  
  // Adicionar frete (sem desconto)
  let custoUnitario = custoComTaxas;
  if (chkFrete) custoUnitario += vFrete;
  
  // Custo total do lote
  let custoTotal = custoComTaxas * qtdKit;
  if (chkFrete) custoTotal += vFrete;
  
  // Formatação para exibição
  const resCustoTotal = qtdKit === 1 
    ? `Unidade: R$ ${custoUnitario.toFixed(2)}`
    : `Unidade: R$ ${custoUnitario.toFixed(2)} | Lote: R$ ${custoTotal.toFixed(2)}`;

  // Texto WhatsApp (Usa o valor Sugerido como padrão)
  const dataE = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const dataFormatada = `${String(dataE.getDate()).padStart(2, "0")}/${String(dataE.getMonth() + 1).padStart(2, "0")}`;
  const txt = `📄 ORÇAMENTO: ${nomeCliente || "Peça 3D"}
💰 Unitário: R$ ${vFinais[1].toFixed(2)}
💰 Lote: R$ ${kFinais[1].toFixed(2)}
📅 Entrega estimada: ${dataFormatada}
⚙️ ${material} | ${nomeMaquina}`;

  // Strings com os três valores para exibição nos resultados
  const resUnCompleto = `Mínimo: R$ ${vFinais[0].toFixed(2)} | Sugerido: R$ ${vFinais[1].toFixed(2)} | Premium: R$ ${vFinais[2].toFixed(2)}`;
  const resKitCompleto = `Mínimo: R$ ${kFinais[0].toFixed(2)} | Sugerido: R$ ${kFinais[1].toFixed(2)} | Premium: R$ ${kFinais[2].toFixed(2)}`;

  return {
    resUn,
    resKit,
    resUnCompleto,
    resKitCompleto,
    resZap: txt,
    valoresUnitarios: vFinais,
    valoresKit: kFinais,
    custoUnitario: vFinais[1],
    custoTotal: kFinais[1],
    resCustoTotal,
  };
}
