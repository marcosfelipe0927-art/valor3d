/**
 * Sistema de Autenticação e Controle de Acesso
 * - Lista de tokens autorizados com validade
 * - Função para gerar fingerprint do dispositivo
 * - Validação de expiração de tokens
 */

// Calcula data de expiração (30 dias a partir de hoje)
const calcularDataExpiracao = (diasValidade: number = 30): string => {
  const data = new Date();
  data.setDate(data.getDate() + diasValidade);
  return data.toISOString().split('T')[0]; // Formato AAAA-MM-DD
};

// Lista de Tokens Cadastrados com Validade
export const listaTokens: Record<string, { nome: string; email: string; dataExpiracao: string }> = {
  "TOKEN123": { nome: "Cliente 1", email: "cliente1@email.com", dataExpiracao: "2026-02-26" },
  "TOKEN456": { nome: "Cliente 2", email: "cliente2@email.com", dataExpiracao: "2026-03-15" },
  "TOKEN789": { nome: "Cliente 3", email: "cliente3@email.com", dataExpiracao: "2026-04-10" },
};

/**
 * Gera um fingerprint único do dispositivo/navegador
 * Combina: userAgent, resolução de tela, idioma e timezone
 * @returns String codificada em base64 representando o fingerprint
 */
export const generateFingerprint = (): string => {
  const ua = navigator.userAgent;
  const screen = `${window.screen.width}x${window.screen.height}`;
  const lang = navigator.language;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const fingerprintData = `${ua}|${screen}|${lang}|${tz}`;
  return btoa(fingerprintData);
};

/**
 * Verifica se um token é válido e não expirou
 * @param token - Token a ser verificado
 * @returns Objeto com { valido: boolean, motivo?: string }
 */
export const isTokenValid = (token: string): { valido: boolean; motivo?: string } => {
  if (!(token in listaTokens)) {
    return { valido: false, motivo: "Token inválido" };
  }

  const tokenData = listaTokens[token];
  const dataExpiracao = new Date(tokenData.dataExpiracao);
  const dataAtual = new Date();
  dataAtual.setHours(0, 0, 0, 0);

  if (dataAtual > dataExpiracao) {
    return { valido: false, motivo: "Token expirado. Entre em contato para renovação" };
  }

  return { valido: true };
};

/**
 * Obtém informações do cliente a partir do token
 * @param token - Token do cliente
 * @returns Objeto com nome, email e data de expiração, ou null se token inválido
 */
export const getClientInfo = (token: string): { nome: string; email: string; dataExpiracao: string } | null => {
  const validacao = isTokenValid(token);
  if (validacao.valido && token in listaTokens) {
    return listaTokens[token];
  }
  return null;
};

/**
 * Salva o token e fingerprint no localStorage
 * @param token - Token a ser salvo
 * @param fingerprint - Fingerprint do dispositivo
 */
export const saveAuthToLocalStorage = (token: string, fingerprint: string): void => {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_fingerprint', fingerprint);
};

/**
 * Recupera o token do localStorage
 * @returns Token salvo ou null se não existir
 */
export const getTokenFromLocalStorage = (): string | null => {
  return localStorage.getItem('auth_token');
};

/**
 * Recupera o fingerprint do localStorage
 * @returns Fingerprint salvo ou null se não existir
 */
export const getFingerprintFromLocalStorage = (): string | null => {
  return localStorage.getItem('auth_fingerprint');
};

/**
 * Verifica se o dispositivo é o mesmo (fingerprint match)
 * @param savedFingerprint - Fingerprint salvo no localStorage
 * @param currentFingerprint - Fingerprint atual do dispositivo
 * @returns true se os fingerprints correspondem, false caso contrário
 */
export const isSameDevice = (savedFingerprint: string, currentFingerprint: string): boolean => {
  return savedFingerprint === currentFingerprint;
};

/**
 * Limpa os dados de autenticação do localStorage
 */
export const clearAuthFromLocalStorage = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_fingerprint');
};

/**
 * Calcula quantos dias faltam para expiração do token
 * @param token - Token a ser verificado
 * @returns Número de dias restantes, ou -1 se expirado
 */
export const diasRestantesToken = (token: string): number => {
  if (!(token in listaTokens)) return -1;

  const dataExpiracao = new Date(listaTokens[token].dataExpiracao);
  const dataAtual = new Date();
  dataAtual.setHours(0, 0, 0, 0);

  const diffTime = dataExpiracao.getTime() - dataAtual.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};
