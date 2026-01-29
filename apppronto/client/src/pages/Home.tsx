import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Download, Share2, Clock, Lock, Save, Eye, EyeOff, Edit2, Trash2, AlertCircle } from "lucide-react";
import { TimeMaskInput } from "@/components/TimeMaskInput";
import { toast } from "sonner";
import {
  calcularPro,
  custoEnergiaKwh,
  maquinasBrasil,
  aliquotasIcms,
  type ParametrosCalculo,
} from "@/lib/calculadora";
import {
  generateFingerprint,
  isTokenValid,
  saveAuthToLocalStorage,
  getTokenFromLocalStorage,
  getFingerprintFromLocalStorage,
  isSameDevice,
  clearAuthFromLocalStorage,
} from "@/lib/auth";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  // Estado de Autenticação
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [tokenInput, setTokenInput] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [userType, setUserType] = useState<'guest' | 'pro'>('guest');
  const [calculosRealizados, setCalculosRealizados] = useState<number>(0);
  const [showToken, setShowToken] = useState<boolean>(false);
  
  // Ref para scroll automático
  const resultadosRef = useRef<HTMLDivElement>(null);

  // Estado da Calculadora
  const [nomeCliente, setNomeCliente] = useState("");
  const [nomePeca, setNomePeca] = useState("");
  const [material, setMaterial] = useState("PLA");
  const [peso, setPeso] = useState<number>(0);
  const [precoKg, setPrecoKg] = useState<number>(69.99);
  const [tImp, setTImp] = useState<number>(0);
  const [tPosHoras, setTPosHoras] = useState<number>(0);
  const [tPosMinutos, setTPosMinutos] = useState<number>(0);
  const [qtdKit, setQtdKit] = useState<number>(1);

  // Taxas e Impostos
  const [chkIcms, setChkIcms] = useState<boolean>(false);
  const [chkIss, setChkIss] = useState<boolean>(false);
  const [chkRisco, setChkRisco] = useState<boolean>(true);
  const [exclusivo, setExclusivo] = useState<boolean>(false);
  const [mkpShopee, setMkpShopee] = useState<boolean>(false);
  const [mkpMl, setMkpMl] = useState<boolean>(false);
  const [chkFrete, setChkFrete] = useState<boolean>(false);
  const [descKit, setDescKit] = useState<number>(10);

  // Configurações
  const [nomeMaquina, setNomeMaquina] = useState<string>("Bambu Lab A1");
  const [cMaq, setCMaq] = useState<number>(0.9);
  const [estado, setEstado] = useState<string>("SP");
  const [vHora, setVHora] = useState<number>(40);
  const [vFrete, setVFrete] = useState<number>(25);
  const [multExcl, setMultExcl] = useState<number>(4.5);

  const [resUn, setResUn] = useState<string>("");
  const [resKit, setResKit] = useState<string>("");
  const [resUnCompleto, setResUnCompleto] = useState<string>("");
  const [resKitCompleto, setResKitCompleto] = useState<string>("");
  const [resZap, setResZap] = useState<string>("");
  const [resCustoTotal, setResCustoTotal] = useState<string>("");
  const [historico, setHistorico] = useState<any[]>([]);
  const [buscaHistorico, setBuscaHistorico] = useState<string>("");
  
  // Estado de Insumos
  const [materiais, setMateriais] = useState<any[]>([]);
  const [novoMaterial, setNovoMaterial] = useState({ nome: '', marca: '', precoPago: 0, pesoTotal: 0 });
  const [abaterDoEstoque, setAbaterDoEstoque] = useState<boolean>(true);

  useEffect(() => {
    // Verificar autenticacao no carregamento
    const savedToken = getTokenFromLocalStorage();
    const savedFingerprint = getFingerprintFromLocalStorage();
    const currentFingerprint = generateFingerprint();

    if (savedToken) {
      const validacao = isTokenValid(savedToken);
      if (validacao.valido) {
        if (savedFingerprint && isSameDevice(savedFingerprint, currentFingerprint)) {
          setIsAuthenticated(true);
        } else if (!savedFingerprint) {
          setIsAuthenticated(true);
        } else {
          toast.error("Este token ja esta em uso em outro dispositivo");
          clearAuthFromLocalStorage();
        }
      } else {
        toast.error(validacao.motivo || "Token invalido");
        clearAuthFromLocalStorage();
      }
    }

    const savedConfig = localStorage.getItem('calculadora_config');
    const savedHistorico = localStorage.getItem('calculadora_historico');
    
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setNomeMaquina(config.nomeMaquina || 'Bambu Lab A1');
      setCMaq(config.cMaq || 0.9);
      setEstado(config.estado || 'SP');
      setVHora(config.vHora || 40);
      setVFrete(config.vFrete || 25);
      setMultExcl(config.multExcl || 4.5);
      setChkIcms(config.chkIcms || false);
      setChkIss(config.chkIss || false);
      setChkRisco(config.chkRisco !== undefined ? config.chkRisco : true);
      setExclusivo(config.exclusivo || false);
      setMkpShopee(config.mkpShopee || false);
      setMkpMl(config.mkpMl || false);
      setChkFrete(config.chkFrete || false);
      setDescKit(config.descKit || 10);
    }
    
    if (savedHistorico) {
      setHistorico(JSON.parse(savedHistorico));
    }
    
    // Carregar materiais
    const savedMateriais = localStorage.getItem('calculadora_materiais');
    if (savedMateriais) {
      setMateriais(JSON.parse(savedMateriais));
    }

    // Carregar userType e contador de cálculos com reset automático
    const savedUserType = localStorage.getItem('userType') as 'guest' | 'pro' | null;
    const savedCalculos = localStorage.getItem('calculos_realizados');
    const lastResetDate = localStorage.getItem('calculos_last_reset_date');
    const lastResetWeek = localStorage.getItem('calculos_last_reset_week');
    
    const today = new Date().toDateString();
    const currentWeek = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    
    // Reset diário se mudou o dia
    if (lastResetDate !== today) {
      localStorage.setItem('calculos_realizados', '0');
      localStorage.setItem('calculos_last_reset_date', today);
      setCalculosRealizados(0);
    } else if (savedCalculos) {
      setCalculosRealizados(parseInt(savedCalculos, 10));
    }
    
    // Reset semanal se mudou a semana
    if (lastResetWeek && parseInt(lastResetWeek, 10) !== currentWeek) {
      localStorage.setItem('calculos_semanais', '0');
      localStorage.setItem('calculos_last_reset_week', currentWeek.toString());
    } else if (!lastResetWeek) {
      localStorage.setItem('calculos_last_reset_week', currentWeek.toString());
    }
    
    if (savedUserType) {
      setUserType(savedUserType);
    }
  }, []);

  const handleTokenLogin = () => {
    if (!tokenInput.trim()) {
      toast.error("Digite um token valido");
      return;
    }

    const validacao = isTokenValid(tokenInput);
    if (!validacao.valido) {
      toast.error(validacao.motivo || "Token invalido");
      return;
    }

    const currentFingerprint = generateFingerprint();
    const savedFingerprint = getFingerprintFromLocalStorage();
    const savedToken = getTokenFromLocalStorage();

    // Se ja existe um token salvo e nao eh o mesmo
    if (savedToken && savedToken !== tokenInput) {
      toast.error("Outro token ja esta em uso neste dispositivo");
      return;
    }

    // Se ja existe um fingerprint salvo e nao corresponde
    if (savedFingerprint && !isSameDevice(savedFingerprint, currentFingerprint)) {
      toast.error("Este token ja esta em uso em outro dispositivo");
      return;
    }

    saveAuthToLocalStorage(tokenInput, currentFingerprint);
    setIsAuthenticated(true);
    setUserType('pro');
    localStorage.setItem('userType', 'pro');
    localStorage.setItem('calculos_realizados', '0');
    setCalculosRealizados(0);
    setTokenInput("");
    toast.success("Acesso concedido!");
  };

  const handleLogout = () => {
    clearAuthFromLocalStorage();
    setIsAuthenticated(false);
    setUserType('guest');
    localStorage.setItem('userType', 'guest');
    setTokenInput("");
    toast.success("Desconectado com sucesso");
  };
  
  const handleSalvarMaterial = () => {
    if (userType === 'guest') {
      toast.error('Para gerenciar seu estoque, usar o abate automatico e salvar seus materiais, adquira a versao PRO!');
      return;
    }
    if (!novoMaterial.nome.trim() || !novoMaterial.marca.trim() || novoMaterial.pesoTotal <= 0) {
      toast.error('Preencha todos os campos corretamente');
      return;
    }
    const novoId = Date.now().toString();
    const materialNovo = {
      id: novoId,
      nome: novoMaterial.nome,
      marca: novoMaterial.marca,
      precoPago: novoMaterial.precoPago,
      pesoTotal: novoMaterial.pesoTotal,
      pesoRestante: novoMaterial.pesoTotal,
      emUso: true,
      dataCadastro: new Date().toLocaleDateString('pt-BR')
    };
    const materiaisAtualizados = materiais.map(m => ({ ...m, emUso: false }));
    materiaisAtualizados.push(materialNovo);
    setMateriais(materiaisAtualizados);
    localStorage.setItem('calculadora_materiais', JSON.stringify(materiaisAtualizados));
    setMaterial(novoMaterial.nome);
    setPrecoKg(novoMaterial.precoPago / (novoMaterial.pesoTotal / 1000));
    setNovoMaterial({ nome: '', marca: '', precoPago: 0, pesoTotal: 0 });
    toast.success('Material salvo com sucesso!');
  };
  
  const handleAtivarMaterial = (id: string) => {
    const materiaisAtualizados = materiais.map(m => ({
      ...m,
      emUso: m.id === id
    }));
    setMateriais(materiaisAtualizados);
    localStorage.setItem('calculadora_materiais', JSON.stringify(materiaisAtualizados));
    const materialAtivo = materiaisAtualizados.find(m => m.id === id);
    if (materialAtivo) {
      setMaterial(materialAtivo.nome);
      setPrecoKg(materialAtivo.precoPago / (materialAtivo.pesoTotal / 1000));
      toast.success('Material ativado!');
    }
  };
  
  const handleDeletarMaterial = (id: string) => {
    const materiaisAtualizados = materiais.filter(m => m.id !== id);
    setMateriais(materiaisAtualizados);
    localStorage.setItem('calculadora_materiais', JSON.stringify(materiaisAtualizados));
    toast.success('Material removido!');
  };

  const handleCalcular = () => {
    // Verificar limite de cálculos para usuários guest
    if (userType === 'guest' && calculosRealizados >= 3) {
      toast.error('Limite diário de teste atingido (3/3). Insira um token para acesso ilimitado!');
      return;
    }

    const params: ParametrosCalculo = {
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
      nomePeca,
    };

    const resultado = calcularPro(params);
    setResUn(resultado.resUn);
    setResKit(resultado.resKit);
    setResUnCompleto(resultado.resUnCompleto);
    setResKitCompleto(resultado.resKitCompleto);
    setResZap(resultado.resZap);
    setResCustoTotal(resultado.resCustoTotal);
    addToHistorico(resultado);
    
    // Abater do estoque se PRO e checkbox marcado
    if (userType === 'pro' && abaterDoEstoque && materiais.length > 0) {
      const materialAtivo = materiais.find(m => m.emUso);
      if (materialAtivo && peso > 0) {
        const novoSaldo = materialAtivo.pesoRestante - peso;
        if (novoSaldo < 0) {
          toast.error('Peso insuficiente no material ativo!');
        } else {
          const materiaisAtualizados = materiais.map(m => 
            m.id === materialAtivo.id 
              ? { ...m, pesoRestante: novoSaldo }
              : m
          );
          setMateriais(materiaisAtualizados);
          localStorage.setItem('calculadora_materiais', JSON.stringify(materiaisAtualizados));
          toast.success(`Abatido ${peso}g do material ${materialAtivo.nome}`);
        }
      }
    }
    
    // Incrementar contador para usuários guest
    if (userType === 'guest') {
      const novoContador = calculosRealizados + 1;
      setCalculosRealizados(novoContador);
      localStorage.setItem('calculos_realizados', novoContador.toString());
      
      // Mostrar aviso se chegou perto do limite
      if (novoContador === 2) {
        toast.info('Você já usou 2 de 3 cálculos de teste. Insira um token para acesso ilimitado!');
      }
    }
    
    // Scroll automatico para resultados em dispositivos moveis
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        resultadosRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const saveConfig = () => {
    if (userType === 'guest') {
      toast.error('Função exclusiva para assinantes PRO! Adquira seu token.');
      return;
    }
    const config = {
      nomeMaquina,
      cMaq,
      estado,
      vHora,
      vFrete,
      multExcl,
      chkIcms,
      chkIss,
      chkRisco,
      exclusivo,
      mkpShopee,
      mkpMl,
      chkFrete,
      descKit,
    };
    localStorage.setItem('calculadora_config', JSON.stringify(config));
    toast.success('Configuração salva com sucesso!');
  };

  const handleSaveDefaults = () => {
    if (userType === 'guest') {
      toast.error('Função exclusiva para assinantes PRO! Adquira seu token.');
      return;
    }
    saveConfig();
  };
  const savePecaPreferences = () => {
    const pecaPreferences = {
      material,
      peso,
      precoKg,
      tImp,
      tPosHoras,
      tPosMinutos,
      qtdKit,
    };
    localStorage.setItem('calculadora_peca_preferences', JSON.stringify(pecaPreferences));
    toast.success('Preferencias de peca salvas!');
  };

  const loadPecaPreferences = () => {
    const saved = localStorage.getItem('calculadora_peca_preferences');
    if (saved) {
      const prefs = JSON.parse(saved);
      setMaterial(prefs.material || 'PLA');
      setPeso(prefs.peso || 0);
      setPrecoKg(prefs.precoKg || 69.99);
      setTImp(prefs.tImp || 0);
      setTPosHoras(prefs.tPosHoras || 0);
      setTPosMinutos(prefs.tPosMinutos || 0);
      setQtdKit(prefs.qtdKit || 1);
    }
  };

  const reorcarItem = (item: any) => {
    setNomeCliente(item.cliente === 'Cliente' ? '' : item.cliente);
    setNomePeca(item.peca === 'Peca' ? '' : item.peca);
    setMaterial(item.material || 'PLA');
    setPeso(item.peso || 0);
    setPrecoKg(item.precoKg || 69.99);
    setTImp(item.tImp || 0);
    setTPosHoras(item.tPosHoras || 0);
    setTPosMinutos(item.tPosMinutos || 0);
    setQtdKit(item.qtdKit || 1);
    setChkIcms(item.chkIcms || false);
    setChkIss(item.chkIss || false);
    setChkRisco(item.chkRisco !== undefined ? item.chkRisco : true);
    setExclusivo(item.exclusivo || false);
    setMkpShopee(item.mkpShopee || false);
    setMkpMl(item.mkpMl || false);
    setChkFrete(item.chkFrete || false);
    setDescKit(item.descKit || 10);
    toast.success('Dados carregados! Clique em CALCULAR para atualizar.');
  };

  const addToHistorico = (resultado?: any) => {
    const novoItem = {
      id: Date.now(),
      data: new Date().toLocaleString('pt-BR'),
      cliente: nomeCliente || 'Cliente',
      peca: nomePeca || 'Peca',
      precoUnitario: resultado?.resUn || resUn,
      precoLote: resultado?.resKit || resKit,
      quantidade: qtdKit,
      custos: resCustoTotal,
      whatsapp: resZap,
      material,
      peso,
      precoKg,
      tImp,
      tPosHoras,
      tPosMinutos,
      chkIcms,
      chkIss,
      chkRisco,
      exclusivo,
      mkpShopee,
      mkpMl,
      chkFrete,
      descKit,
    };
    const novoHistorico = [novoItem, ...historico].slice(0, 200);
    setHistorico(novoHistorico);
    localStorage.setItem('calculadora_historico', JSON.stringify(novoHistorico));
  };

  const shareWhatsApp = () => {
    if (userType === 'guest') {
      toast.error('Função exclusiva para assinantes PRO! Adquira seu token.');
      return;
    }
    if (!resZap) {
      toast.error('Calcule primeiro!');
      return;
    }
    const texto = encodeURIComponent(resZap);
    window.open(`https://wa.me/?text=${texto}`, '_blank');
  };

  const downloadOrcamento = () => {
    const conteudo = `${resZap}\n\n---\n\nPreço Unitário:\n${resUn}\n\nPreço Total:\n${resKit}`;
    const blob = new Blob([conteudo], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orcamento.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Tela de Login
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen transition-colors duration-300 flex items-center justify-center ${
        isDarkMode
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
          : 'bg-gradient-to-br from-orange-50 to-orange-100'
      } p-4`}>
        <Card className={`w-full max-w-md ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Acesso Restrito
            </CardTitle>
            <CardDescription>Digite seu token de acesso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="token" className={isDarkMode ? 'text-white' : ''}>Token de Acesso</Label>
              <div className="relative">
                <Input
                  id="token"
                  type={showToken ? 'text' : 'password'}
                  placeholder="Digite seu token"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTokenLogin()}
                  className={`mt-1 pr-10 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button
              onClick={handleTokenLogin}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              Acessar
            </Button>
            <Button
              onClick={() => {
                setIsAuthenticated(true);
                setUserType('guest');
                localStorage.setItem('userType', 'guest');
                if (!localStorage.getItem('calculos_realizados')) {
                  localStorage.setItem('calculos_realizados', '0');
                }
                toast.success('Modo de teste ativado! Você tem 3 cálculos grátis.');
              }}
              variant="outline"
              className="w-full"
            >
              Teste Grátis
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-orange-50 to-orange-100'
    } p-4`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 flex justify-between items-center">
          <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-orange-900'}`}>Calculadora 3D PRO V3.0</h1>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : ''}
          >
            Sair
          </Button>
        </div>

        <Tabs defaultValue="calculadora" className={`w-full ${isDarkMode ? 'dark' : ''}`}>
          <div className="flex justify-center items-center gap-4 mb-8">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="calculadora">📊 Calcular</TabsTrigger>
              <TabsTrigger value="insumos">📦 Insumos</TabsTrigger>
              <TabsTrigger value="configuracoes">⚙️ Ajustes</TabsTrigger>
              <TabsTrigger value="historico">⏱️ Histórico</TabsTrigger>
            </TabsList>
            <Button
              onClick={() => setIsDarkMode(!isDarkMode)}
              variant="outline"
              size="icon"
              className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : ''}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </Button>
          </div>

          <TabsContent value="calculadora">
            {/* Grid Único Responsivo: 1 coluna mobile, 3 colunas desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6" id="cards-container">
              {/* Coluna 1: Dados da Peça */}
              <Card className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">📦 Dados da Peça</CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={savePecaPreferences}
                    title="Salvar estes valores como padrao"
                    className={isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : ''}
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="cliente" className={isDarkMode ? 'text-white' : ''}>Cliente</Label>
                      <Input
                        id="cliente"
                        placeholder="Nome"
                        value={nomeCliente}
                        onChange={(e) => setNomeCliente(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="peca" className={isDarkMode ? 'text-white' : ''}>Peça</Label>
                      <Input
                        id="peca"
                        placeholder="Descrição"
                        value={nomePeca}
                        onChange={(e) => setNomePeca(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="material" className={isDarkMode ? 'text-white' : ''}>Material</Label>
                      <Select value={material} onValueChange={setMaterial}>
                        <SelectTrigger id="material" className="mt-1 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PLA">PLA</SelectItem>
                          <SelectItem value="PETG">PETG</SelectItem>
                          <SelectItem value="ABS">ABS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="peso" className={isDarkMode ? 'text-white' : ''}>Peso (g)</Label>
                      <Input
                        id="peso"
                        type="number"
                        value={peso || ""}
                        onChange={(e) => setPeso(e.target.value ? parseFloat(e.target.value) : 0)}
                        className="mt-1 w-full"
                      />
                      {userType === 'pro' && materiais.length > 0 && (() => {
                        const materialAtivo = materiais.find(m => m.emUso);
                        if (materialAtivo && materialAtivo.pesoRestante < 100) {
                          return (
                            <div className="mt-2 p-2 bg-red-100 border border-red-400 rounded text-red-700 text-sm flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              Atencao: Estoque de {materialAtivo.nome} esta acabando!
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <div>
                      <Label htmlFor="preco-kg" className={isDarkMode ? 'text-white' : ''}>KG (R$)</Label>
                      <Input
                        id="preco-kg"
                        type="number"
                        step="0.01"
                        value={precoKg || ""}
                        onChange={(e) => setPrecoKg(e.target.value ? parseFloat(e.target.value) : 0)}
                        className="mt-1 w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="t-imp" className={isDarkMode ? 'text-white' : ''}>Impressão(h)</Label>
                      <TimeMaskInput
                        value={tImp.toString()}
                        onChange={(value) => {
                          let decimalTime = 0;
                          if (!value.includes(':')) {
                            decimalTime = parseFloat(value) || 0;
                          } else {
                            const parts = value.split(':');
                            const hours = parseFloat(parts[0]) || 0;
                            const minutes = parseFloat(parts[1]) || 0;
                            decimalTime = hours + minutes / 60;
                          }
                          setTImp(decimalTime);
                        }}
                        placeholder="00:00"
                        isDarkMode={isDarkMode}
                      />
                    </div>

                    <div>
                      <Label htmlFor="t-pos" className={isDarkMode ? 'text-white' : ''}>Refino(h)</Label>
                      <TimeMaskInput
                        value={(tPosHoras + tPosMinutos / 60).toString()}
                        onChange={(value) => {
                          let decimalTime = 0;
                          if (!value.includes(':')) {
                            decimalTime = parseFloat(value) || 0;
                          } else {
                            const parts = value.split(':');
                            const hours = parseFloat(parts[0]) || 0;
                            const minutes = parseFloat(parts[1]) || 0;
                            decimalTime = hours + minutes / 60;
                          }
                          setTPosHoras(Math.floor(decimalTime));
                          setTPosMinutos(Math.round((decimalTime % 1) * 60));
                        }}
                        placeholder="00:00"
                        isDarkMode={isDarkMode}
                      />
                    </div>

                    <div>
                      <Label htmlFor="qtd" className={isDarkMode ? 'text-white' : ''}>Quantidade</Label>
                      <Input
                        id="qtd"
                        type="number"
                        value={qtdKit || ""}
                        onChange={(e) => setQtdKit(e.target.value ? parseFloat(e.target.value) : 1)}
                        className="mt-1 w-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Coluna 2: Taxas e Impostos */}
              <Card className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">🛍 Taxas e Impostos</CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={saveConfig}
                    title="Salvar estes valores como padrao"
                    className={isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : ''}
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="icms"
                        checked={chkIcms}
                        onCheckedChange={(checked) => setChkIcms(checked as boolean)}
                      />
                      <Label htmlFor="icms" className="cursor-pointer text-sm">
                        ICMS (Estado)
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="iss"
                        checked={chkIss}
                        onCheckedChange={(checked) => setChkIss(checked as boolean)}
                      />
                      <Label htmlFor="iss" className="cursor-pointer text-sm">
                        ISS (5%)
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="risco"
                        checked={chkRisco}
                        onCheckedChange={(checked) => setChkRisco(checked as boolean)}
                      />
                      <Label htmlFor="risco" className="cursor-pointer text-sm">
                        10% Risco/Falha
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="exclusivo"
                        checked={exclusivo}
                        onCheckedChange={(checked) => setExclusivo(checked as boolean)}
                      />
                      <Label htmlFor="exclusivo" className="cursor-pointer text-sm">
                        💎 Modelagem Própria
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="shopee"
                        checked={mkpShopee}
                        onCheckedChange={(checked) => setMkpShopee(checked as boolean)}
                      />
                      <Label htmlFor="shopee" className="cursor-pointer text-sm">
                        Shopee (15%)
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="ml"
                        checked={mkpMl}
                        onCheckedChange={(checked) => setMkpMl(checked as boolean)}
                      />
                      <Label htmlFor="ml" className="cursor-pointer text-sm">
                        Mercado Livre (17%)
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 col-span-2">
                      <Checkbox
                        id="frete"
                        checked={chkFrete}
                        onCheckedChange={(checked) => setChkFrete(checked as boolean)}
                      />
                      <Label htmlFor="frete" className="cursor-pointer text-sm">
                        Incluir Frete
                      </Label>
                    </div>
                  </div>

                  {chkFrete && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <Label htmlFor="v-frete-modal">Valor Frete (R$)</Label>
                      <Input
                        id="v-frete-modal"
                        type="number"
                        step="0.01"
                        value={vFrete || ""}
                        onChange={(e) => setVFrete(e.target.value ? parseFloat(e.target.value) : 0)}
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <Label htmlFor="desc-kit">Desconto Kit (%): {descKit}%</Label>
                    <Slider
                      id="desc-kit"
                      min={0}
                      max={50}
                      step={1}
                      value={[descKit]}
                      onValueChange={(value) => setDescKit(value[0])}
                      className="mt-2"
                    />
                  </div>

                  {userType === 'pro' && materiais.length > 0 && (
                    <div className="flex items-center space-x-2 pt-4">
                      <Checkbox
                        id="abater"
                        checked={abaterDoEstoque}
                        onCheckedChange={(checked) => setAbaterDoEstoque(checked as boolean)}
                      />
                      <Label htmlFor="abater" className="cursor-pointer text-sm">
                        Abater do estoque
                      </Label>
                    </div>
                  )}
                  
                  {userType === 'guest' && (
                    <div className="flex items-center space-x-2 pt-4 opacity-50 cursor-not-allowed">
                      <Checkbox id="abater-guest" disabled />
                      <Label htmlFor="abater-guest" className="cursor-not-allowed text-sm text-gray-500">
                        Abater do estoque (Exclusivo PRO)
                      </Label>
                    </div>
                  )}

                  <Button
                    onClick={handleCalcular}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg font-bold rounded-lg mt-4"
                  >
                    CALCULAR
                  </Button>
                  
                  {userType === 'guest' && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800 font-semibold">
                        Você usou {calculosRealizados} de 3 cálculos diários gratuitos
                      </p>
                      {calculosRealizados >= 3 && (
                        <p className="text-xs text-red-600 mt-1">
                          Limite atingido! Insira um token para acesso ilimitado.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Coluna 3: Resultados */}
              <Card ref={resultadosRef} className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}>
                <CardHeader>
                  <CardTitle className="text-lg">💰 Resultados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {resUn ? (
                    <>
                      <div>
                        <Label className="text-sm text-gray-600">Preço Unitário</Label>
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-mono text-blue-900" style={{color: '#000000'}}>{resUnCompleto}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(resUnCompleto)}
                            className="mt-2 w-full" style={{color: '#ff6900'}}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar
                          </Button>
                        </div>
                      </div>

                      {qtdKit > 1 && (
                        <div>
                          <Label className="text-sm text-gray-600">Preço Total (Lote)</Label>
                          <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm font-mono text-green-900">{resKitCompleto}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(resKitCompleto)}
                              className="mt-2 w-full" style={{color: '#ff6900'}}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copiar
                            </Button>
                          </div>
                        </div>
                      )}

                      <div>
                        <Label className="text-sm text-gray-600">Custos Totais</Label>
                        <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-sm font-mono text-yellow-900">{resCustoTotal}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(resCustoTotal)}
                            className="mt-2 w-full" style={{color: '#ff6900'}}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm text-gray-600">WhatsApp</Label>
                        <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <p className="text-xs font-mono text-purple-900 whitespace-pre-wrap">
                            {resZap}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(resZap)}
                            className="mt-2 w-full" style={{color: '#ff6900'}}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={shareWhatsApp}
                          className="w-full bg-green-500 hover:bg-green-600 text-white"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          WhatsApp
                        </Button>
                        <Button
                          onClick={downloadOrcamento}
                          variant="outline"
                          className="w-full"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="text-4xl mb-3">📊</div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Preencha os dados e clique em CALCULAR para ver os resultados
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insumos">
            <Card className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}>
              <CardHeader>
                <CardTitle className={isDarkMode ? 'text-white' : ''}>📦 Gerenciar Insumos</CardTitle>
                <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>Cadastre e gerencie seus materiais de impressao</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Formulario de Novo Material */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-4">Adicionar Novo Material</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="material-nome" className={isDarkMode ? 'text-white' : ''}>Nome do Material</Label>
                      <Input
                        id="material-nome"
                        placeholder="Ex: PLA"
                        value={novoMaterial.nome}
                        onChange={(e) => setNovoMaterial({...novoMaterial, nome: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="material-marca" className={isDarkMode ? 'text-white' : ''}>Marca</Label>
                      <Input
                        id="material-marca"
                        placeholder="Ex: Bambu Lab"
                        value={novoMaterial.marca}
                        onChange={(e) => setNovoMaterial({...novoMaterial, marca: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="material-preco" className={isDarkMode ? 'text-white' : ''}>Preco Pago (R$)</Label>
                      <Input
                        id="material-preco"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={novoMaterial.precoPago || ''}
                        onChange={(e) => setNovoMaterial({...novoMaterial, precoPago: parseFloat(e.target.value) || 0})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="material-peso" className={isDarkMode ? 'text-white' : ''}>Peso Total (g)</Label>
                      <Input
                        id="material-peso"
                        type="number"
                        placeholder="1000"
                        value={novoMaterial.pesoTotal || ''}
                        onChange={(e) => setNovoMaterial({...novoMaterial, pesoTotal: parseFloat(e.target.value) || 0})}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSalvarMaterial}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
                  >
                    Salvar Material
                  </Button>
                </div>

                {/* Lista de Materiais */}
                <div>
                  <h3 className="font-semibold mb-4">Materiais Cadastrados</h3>
                  {materiais.length === 0 ? (
                    <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Nenhum material cadastrado ainda
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {materiais.map((mat) => {
                        const critico = mat.pesoRestante < 100;
                        return (
                          <div
                            key={mat.id}
                            className={`p-4 rounded-lg border ${
                              isDarkMode
                                ? 'bg-gray-700 border-gray-600'
                                : 'bg-gray-50 border-gray-200'
                            } ${critico ? 'border-red-500 border-2' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {mat.nome} - {mat.marca}
                                  {mat.emUso && <span className="ml-2 text-green-500 font-bold">✓ Em Uso</span>}
                                  {critico && <span className="ml-2 text-red-500 font-bold">⚠ Critico</span>}
                                </p>
                                <p className={`text-sm ${
                                  critico 
                                    ? 'text-red-500 font-bold' 
                                    : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  Peso: {mat.pesoRestante}g / {mat.pesoTotal}g | Preco: R$ {mat.precoPago.toFixed(2)}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {!mat.emUso && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAtivarMaterial(mat.id)}
                                    className={isDarkMode ? 'bg-gray-600 border-gray-500 text-white hover:bg-gray-500' : ''}
                                  >
                                    Ativar
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeletarMaterial(mat.id)}
                                  className={isDarkMode ? 'text-red-400 hover:bg-gray-600' : 'text-red-600'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuracoes">
            <Card className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}>
              <CardHeader>
                <CardTitle className={isDarkMode ? 'text-white' : ''}>⚙️ Configurações</CardTitle>
                <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>Defina os parâmetros padrão da sua operação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="maquina" className={isDarkMode ? 'text-white' : ''}>Máquina Padrão</Label>
                    <Select value={nomeMaquina} onValueChange={setNomeMaquina}>
                      <SelectTrigger id="maquina" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(maquinasBrasil).map(([nome]) => (
                          <SelectItem key={nome} value={nome}>
                            {nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="custo-maq" className={isDarkMode ? 'text-white' : ''}>Custo Máquina (R$/h)</Label>
                    <Input
                      id="custo-maq"
                      type="number"
                      step="0.01"
                      value={cMaq || ""}
                      onChange={(e) => setCMaq(e.target.value ? parseFloat(e.target.value) : 0)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="estado" className={isDarkMode ? 'text-white' : ''}>Estado</Label>
                    <Select value={estado} onValueChange={setEstado}>
                      <SelectTrigger id="estado" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(aliquotasIcms).map((uf) => (
                          <SelectItem key={uf} value={uf}>
                            {uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="v-hora" className={isDarkMode ? 'text-white' : ''}>Sua Hora (R$)</Label>
                    <Input
                      id="v-hora"
                      type="number"
                      step="0.01"
                      value={vHora || ""}
                      onChange={(e) => setVHora(e.target.value ? parseFloat(e.target.value) : 0)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="mult-excl" className={isDarkMode ? 'text-white' : ''}>Multiplicador Exclusivo</Label>
                    <Input
                      id="mult-excl"
                      type="number"
                      step="0.1"
                      value={multExcl || ""}
                      onChange={(e) => setMultExcl(e.target.value ? parseFloat(e.target.value) : 0)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button
                  onClick={saveConfig}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white mt-4"
                >
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico">
            <Card className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}>
              <CardHeader>
                <CardTitle className={isDarkMode ? 'text-white' : ''}>⚡️ Histórico de Orçamentos</CardTitle>
                <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>Todos os orçamentos calculados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Buscar por cliente ou peca..."
                  value={buscaHistorico}
                  onChange={(e) => setBuscaHistorico(e.target.value)}
                  className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
                {historico.length === 0 ? (
                  <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nenhum orçamento calculado ainda</p>
                ) : (
                  <div className="space-y-3">
                    {historico
                      .filter((item) =>
                        item.cliente.toLowerCase().includes(buscaHistorico.toLowerCase()) ||
                        item.peca.toLowerCase().includes(buscaHistorico.toLowerCase())
                      )
                      .map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-lg border ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        {/* Título: Cliente - Peça */}
                        <div className="flex justify-between items-start mb-3">
                          <p className={`font-semibold text-base ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {item.cliente} - {item.peca}
                          </p>
                        </div>

                        {/* Data + Botão Reorçar */}
                        <div className="flex justify-between items-center mb-3">
                          <p className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {item.data}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => reorcarItem(item)}
                            className={`text-xs ${isDarkMode ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-700'}`}
                            title="Reorçar este item"
                          >
                            Reorçar
                          </Button>
                        </div>

                        {/* Valores: Unitário + Lote (condicional) */}
                        <div className={`py-2 border-t border-b ${
                          isDarkMode ? 'border-gray-600' : 'border-gray-300'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">💰</span>
                            <span className={`font-semibold ${
                              isDarkMode ? 'text-orange-400' : 'text-orange-600'
                            }`}>
                              {item.precoUnitario}
                            </span>
                          </div>
                          {item.quantidade > 1 && (
                            <div className="flex items-center gap-2">
                              <span className="text-lg">📦</span>
                              <span className={`font-semibold ${
                                isDarkMode ? 'text-green-400' : 'text-green-600'
                              }`}>
                                {item.precoLote || 'R$ 0,00'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Rodapé: Tags técnicas + Botão Copiar */}
                        <div className="flex justify-between items-center mt-3">
                          <p className={`text-xs ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            {item.material} | {item.peso} | Qtd: {item.quantidade}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(item.whatsapp)}
                            className="p-1 h-auto"
                            title="Copiar para clipboard"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
