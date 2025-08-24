import React, { useEffect, useMemo, useState } from "react";

// FinanceApp Pro — Gestor Completo de Despesas (v0.1)
// - Mantém a base do MVP (MEI/Simples, KPIs, plano de distribuição)
// - Adiciona listas dinâmicas de Despesas Operacionais e Custos Diretos
// - Tabela com percentuais, sumarização por tipo (Fixa/Variável) e por grupo (Operacional x Direto)
// - Persistência simples em localStorage
// - Exportação CSV das despesas
// Aviso: ferramenta educacional. Consulte seu contador para enquadramento e obrigações.

export default function FinanceAppPro() {
  type Regime = "MEI" | "Simples";
  type TipoDespesa = "Fixa" | "Variável";

  type Despesa = {
    id: string;
    nome: string;
    valor: number; // R$/mês
    tipo: TipoDespesa; // Fixa ou Variável
    categoria?: string; // opcional (ex.: Software, Aluguel, Energia)
  };

  type CustoDireto = {
    id: string;
    nome: string;
    valor: number; // R$/mês (média do período)
  };

  const [regime, setRegime] = useState<Regime>("MEI");
  const [faturamentoMensal, setFaturamentoMensal] = useState(15000);
  const [proLabore, setProLabore] = useState(2500);

  // Impostos
  const [aliquotaEfetiva, setAliquotaEfetiva] = useState(6); // Simples (% receita)
  const [meiDasFixo, setMeiDasFixo] = useState(75); // MEI (R$)
  const [outrosImpostos, setOutrosImpostos] = useState(0);

  const [despesas, setDespesas] = useState<Despesa[]>([{
    id: cryptoRandom(), nome: "Adobe CC", valor: 224.9, tipo: "Fixa", categoria: "Software"
  }, {
    id: cryptoRandom(), nome: "Internet", valor: 120, tipo: "Fixa", categoria: "Infra"
  }, {
    id: cryptoRandom(), nome: "Aluguel sala", valor: 1200, tipo: "Fixa", categoria: "Aluguel"
  }]);

  const [custosDiretos, setCustosDiretos] = useState<CustoDireto[]>([{
    id: cryptoRandom(), nome: "Banco de música (job)", valor: 60
  }, {
    id: cryptoRandom(), nome: "Freela edição (job)", valor: 800
  }]);

  // Persistência simples
  useEffect(() => {
    const saved = localStorage.getItem("financeapp_pro_state");
    if (saved) {
      try {
        const obj = JSON.parse(saved);
        setRegime(obj.regime ?? "MEI");
        setFaturamentoMensal(obj.faturamentoMensal ?? 15000);
        setProLabore(obj.proLabore ?? 2500);
        setAliquotaEfetiva(obj.aliquotaEfetiva ?? 6);
        setMeiDasFixo(obj.meiDasFixo ?? 75);
        setOutrosImpostos(obj.outrosImpostos ?? 0);
        setDespesas(obj.despesas ?? []);
        setCustosDiretos(obj.custosDiretos ?? []);
      } catch (e) { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    const snapshot = {
      regime, faturamentoMensal, proLabore,
      aliquotaEfetiva, meiDasFixo, outrosImpostos,
      despesas, custosDiretos,
    };
    localStorage.setItem("financeapp_pro_state", JSON.stringify(snapshot));
  }, [regime, faturamentoMensal, proLabore, aliquotaEfetiva, meiDasFixo, outrosImpostos, despesas, custosDiretos]);

  const custosDiretosTotal = useMemo(() => sum(custosDiretos.map(c => c.valor)), [custosDiretos]);
  const despesasFixas = useMemo(() => sum(despesas.filter(d => d.tipo === "Fixa").map(d => d.valor)), [despesas]);
  const despesasVariaveis = useMemo(() => sum(despesas.filter(d => d.tipo === "Variável").map(d => d.valor)), [despesas]);
  const despesasOperacionaisTotal = despesasFixas + despesasVariaveis;

  const impostosCalculados = useMemo(() => {
    if (regime === "MEI") return meiDasFixo + outrosImpostos;
    return (faturamentoMensal * (aliquotaEfetiva / 100)) + outrosImpostos;
  }, [regime, faturamentoMensal, aliquotaEfetiva, meiDasFixo, outrosImpostos]);

  const receita = faturamentoMensal;
  const lucroBruto = receita - custosDiretosTotal; // após custos diretos
  const resultadoOperacional = lucroBruto - despesasOperacionaisTotal - proLabore - impostosCalculados;

  const margemBruta = receita > 0 ? (lucroBruto / receita) * 100 : 0;
  const margemOperacional = receita > 0 ? (resultadoOperacional / receita) * 100 : 0;

  const pctDespesasFixasSobreReceita = receita > 0 ? (despesasFixas / receita) * 100 : 0;
  const pctDespesasVariaveisSobreReceita = receita > 0 ? (despesasVariaveis / receita) * 100 : 0;
  const pctCustosDiretosSobreReceita = receita > 0 ? (custosDiretosTotal / receita) * 100 : 0;

  // Distribuição de lucros (configurável)
  const [pctReserva, setPctReserva] = useState(10);
  const [pctImpostosFuturos, setPctImpostosFuturos] = useState(5);
  const [pctReinvest, setPctReinvest] = useState(10);
  const [pctDistrib, setPctDistrib] = useState(20);

  const lucroPositivo = Math.max(0, resultadoOperacional);
  const vReserva = (lucroPositivo * pctReserva) / 100;
  const vImpostosFuturos = (lucroPositivo * pctImpostosFuturos) / 100;
  const vReinvest = (lucroPositivo * pctReinvest) / 100;
  const vDistrib = (lucroPositivo * pctDistrib) / 100;
  const vNaoAlocado = Math.max(0, lucroPositivo - (vReserva + vImpostosFuturos + vReinvest + vDistrib));

  const pontoDeEquilibrioReceita = useMemo(() => {
    const custoPerc = receita > 0 ? custosDiretosTotal / receita : 0.5;
    const despesasFixasTot = despesasOperacionaisTotal + proLabore + impostosCalculados;
    const margemContrib = 1 - custoPerc;
    return margemContrib > 0 ? despesasFixasTot / margemContrib : 0;
  }, [receita, custosDiretosTotal, despesasOperacionaisTotal, proLabore, impostosCalculados]);

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">FinanceApp Pro — Gestor Completo de Despesas</h1>
          <p className="text-slate-600 text-sm md:text-base mt-2">Cadastre suas despesas operacionais e custos diretos por item, visualize percentuais, simule impostos (MEI/Simples) e veja KPIs de saúde do negócio.</p>
        </header>

        {/* Configurações & Receita */}
        <section className="grid md:grid-cols-3 gap-4">
          <Card>
            <Label>Regime</Label>
            <select className="w-full rounded-xl border-slate-300" value={regime} onChange={(e) => setRegime(e.target.value as Regime)}>
              <option value="MEI">MEI</option>
              <option value="Simples">Simples Nacional</option>
            </select>
            <p className="text-xs text-slate-500 mt-2">Impostos calculados conforme escolha.</p>
          </Card>

          <Card>
            <Label>Faturamento mensal (R$)</Label>
            <input type="number" className="w-full rounded-xl border-slate-300" value={faturamentoMensal} onChange={(e)=>setFaturamentoMensal(Number(e.target.value))} min={0} />
            <Label className="mt-3">Pró‑labore (R$)</Label>
            <input type="number" className="w-full rounded-xl border-slate-300" value={proLabore} onChange={(e)=>setProLabore(Number(e.target.value))} min={0} />
          </Card>

          <Card>
            {regime === "Simples" ? (
              <div>
                <Label>Alíquota efetiva Simples (%)</Label>
                <input type="number" className="w-full rounded-xl border-slate-300" value={aliquotaEfetiva} onChange={(e)=>setAliquotaEfetiva(Number(e.target.value))} min={0} max={35} />
                <p className="text-xs text-slate-500 mt-2">Use sua alíquota real (faixa + fator R). Se não souber, comece com 6–15%.</p>
              </div>
            ) : (
              <div>
                <Label>DAS MEI fixo (R$)</Label>
                <input type="number" className="w-full rounded-xl border-slate-300" value={meiDasFixo} onChange={(e)=>setMeiDasFixo(Number(e.target.value))} min={0} />
                <p className="text-xs text-slate-500 mt-2">Valor mensal aproximado do boleto DAS.</p>
              </div>
            )}

            <Label className="mt-3">Outros impostos/Taxas (R$)</Label>
            <input type="number" className="w-full rounded-xl border-slate-300" value={outrosImpostos} onChange={(e)=>setOutrosImpostos(Number(e.target.value))} min={0} />

            <div className="mt-3 p-3 bg-slate-100 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500">Impostos calculados</div>
                <div className="text-xl font-semibold">R$ {format(impostosCalculados)}</div>
              </div>
              <div className="text-xs text-slate-500">/ mês</div>
            </div>
          </Card>
        </section>

        {/* KPIs */}
        <section className="grid md:grid-cols-5 gap-4">
          <KPI label="Receita" value={`R$ ${format(receita)}`} hint="Faturamento bruto mensal" />
          <KPI label="Custos diretos" value={`R$ ${format(custosDiretosTotal)}`} hint={`${pctCustosDiretosSobreReceita.toFixed(1)}% da receita`} />
          <KPI label="Despesas operacionais" value={`R$ ${format(despesasOperacionaisTotal)}`} hint={`${(pctDespesasFixasSobreReceita + pctDespesasVariaveisSobreReceita).toFixed(1)}% da receita`} />
          <KPI label="Margem bruta" value={`${margemBruta.toFixed(1)}%`} hint="(Receita − Custos diretos)/Receita" />
          <KPI label="Margem operacional" value={`${margemOperacional.toFixed(1)}%`} hint="Depois de despesas, pró‑labore e impostos" />
        </section>

        {/* Tabelas de itens */}
        <section className="grid md:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Despesas Operacionais</h2>
              <AddExpense onAdd={(d)=>setDespesas(prev=>[...prev, d])} />
            </div>
            <TableHeader cols={["Nome", "Tipo", "Categoria", "Valor", "% Receita", ""]} />
            {despesas.length === 0 && <Empty>Sem despesas cadastradas.</Empty>}
            <div className="divide-y">
              {despesas.map(d => (
                <Row key={d.id}>
                  <Cell>{d.nome}</Cell>
                  <Cell>{d.tipo}</Cell>
                  <Cell>{d.categoria || "—"}</Cell>
                  <Cell className="text-right">R$ {format(d.valor)}</Cell>
                  <Cell className="text-right">{pct(receita, d.valor)}%</Cell>
                  <Cell className="text-right">
                    <button className="text-xs text-slate-600 underline mr-2" onClick={()=>editDespesa(d, setDespesas)}>editar</button>
                    <button className="text-xs text-rose-600 underline" onClick={()=>setDespesas(prev=>prev.filter(x=>x.id!==d.id))}>remover</button>
                  </Cell>
                </Row>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <BadgeStat label="Fixas" value={`R$ ${format(despesasFixas)}`} hint={`${pct(receita, despesasFixas)}% da receita`} />
              <BadgeStat label="Variáveis" value={`R$ ${format(despesasVariaveis)}`} hint={`${pct(receita, despesasVariaveis)}% da receita`} />
              <BadgeStat label="Total" value={`R$ ${format(despesasOperacionaisTotal)}`} hint={`${pct(receita, despesasOperacionaisTotal)}% da receita`} />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm" onClick={()=>exportarDespesasCSV(despesas)}>Exportar CSV</button>
              <span className="text-xs text-slate-500">Baixa um .csv com suas despesas (nome;tipo;categoria;valor)</span>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Custos Diretos (média mensal)</h2>
              <AddCusto onAdd={(c)=>setCustosDiretos(prev=>[...prev, c])} />
            </div>
            <TableHeader cols={["Nome", "Valor", "% Receita", ""]} />
            {custosDiretos.length === 0 && <Empty>Sem custos cadastrados.</Empty>}
            <div className="divide-y">
              {custosDiretos.map(c => (
                <Row key={c.id}>
                  <Cell>{c.nome}</Cell>
                  <Cell className="text-right">R$ {format(c.valor)}</Cell>
                  <Cell className="text-right">{pct(receita, c.valor)}%</Cell>
                  <Cell className="text-right">
                    <button className="text-xs text-slate-600 underline mr-2" onClick={()=>editCusto(c, setCustosDiretos)}>editar</button>
                    <button className="text-xs text-rose-600 underline" onClick={()=>setCustosDiretos(prev=>prev.filter(x=>x.id!==c.id))}>remover</button>
                  </Cell>
                </Row>
              ))}
            </div>
            <div className="mt-3">
              <BadgeStat label="Total custos diretos" value={`R$ ${format(custosDiretosTotal)}`} hint={`${pct(receita, custosDiretosTotal)}% da receita`} />
            </div>
          </Card>
        </section>

        {/* Resultado e distribuição */}
        <section className="grid md:grid-cols-2 gap-4">
          <Card>
            <h2 className="text-lg font-semibold mb-2">Resultado</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Line label="Receita" value={`R$ ${format(receita)}`} />
              <Line label="Custos diretos" value={`R$ ${format(custosDiretosTotal)}`} />
              <Line label="Lucro bruto" value={`R$ ${format(lucroBruto)}`} />
              <Line label="Despesas operacionais" value={`R$ ${format(despesasOperacionaisTotal)}`} />
              <Line label="Pró‑labore" value={`R$ ${format(proLabore)}`} />
              <Line label="Impostos" value={`R$ ${format(impostosCalculados)}`} />
              <div className="col-span-2 border-t pt-2 mt-1" />
              <Line strong label="Resultado operacional" value={`R$ ${format(resultadoOperacional)}`} />
            </div>
            <div className="mt-3 text-xs text-slate-500">Ponto de equilíbrio estimado: <b>R$ {format(Math.round(pontoDeEquilibrioReceita))}</b> de receita/mês.</div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Distribuição do lucro (se houver)</h2>
              <span className="text-xs text-slate-500">ajuste as metas (%)</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <Percent label="Reserva" value={pctReserva} onChange={setPctReserva} />
              <Percent label="Impostos futuros" value={pctImpostosFuturos} onChange={setPctImpostosFuturos} />
              <Percent label="Reinvestimento" value={pctReinvest} onChange={setPctReinvest} />
              <Percent label="Distribuição" value={pctDistrib} onChange={setPctDistrib} />
            </div>
            <div className="grid grid-cols-4 gap-3 mt-3">
              <Money label="Reserva" value={vReserva} />
              <Money label="Imp. futuros" value={vImpostosFuturos} />
              <Money label="Reinvest" value={vReinvest} />
              <Money label="Distribuir" value={vDistrib} />
            </div>
            <div className="mt-2 text-xs text-slate-500">Não alocado: <b>R$ {format(vNaoAlocado)}</b></div>
            {lucroPositivo <= 0 && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-sm">Sem lucro positivo no cenário atual. Reveja preços, custos e despesas.</div>
            )}
          </Card>
        </section>

        <footer className="text-xs text-slate-500">
          *Ferramenta educacional. Consulte seu contador para enquadramento e obrigações. — v0.1
        </footer>
      </div>
    </div>
  );
}

// Components
function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl shadow p-4">{children}</div>;
}
function Label({ children, className="" }: { children: React.ReactNode; className?: string }) {
  return <label className={`block text-xs uppercase tracking-wider text-slate-500 mb-1 ${className}`}>{children}</label>;
}
function KPI({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}
function TableHeader({ cols }: { cols: string[] }) {
  return (
    <div className="grid grid-cols-12 text-xs text-slate-500 uppercase tracking-wider px-2 py-1">
      {cols.map((c, i) => (
        <div key={i} className={colClass(i, cols.length)}>{c}</div>
      ))}
    </div>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-12 items-center px-2 py-2">{children}</div>;
}
function Cell({ children, className="" }: { children: React.ReactNode; className?: string }) {
  return <div className={`col-span-2 ${className}`}>{children}</div>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-slate-500 p-3">{children}</div>;
}
function BadgeStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
      {hint && <div className="text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
function Line({ label, value, strong=false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${strong ? "font-semibold" : ""}`}>
      <span className="text-slate-600">{label}</span>
      <span>{value}</span>
    </div>
  );
}
function Percent({ label, value, onChange }: { label: string; value: number; onChange: (n:number)=>void }) {
  return (
    <div>
      <Label>{label}</Label>
      <input type="number" className="w-full rounded-xl border-slate-300" value={value} onChange={(e)=>onChange(Number(e.target.value))} min={0} max={100} />
      <div className="text-xs text-slate-500 mt-1">%</div>
    </div>
  );
}
function Money({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-lg font-semibold">R$ {format(Math.round(value))}</div>
    </div>
  );
}

// Add/Edit Modals (inline simples)
function AddExpense({ onAdd }: { onAdd: (d: any)=>void }) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState<number>(0);
  const [tipo, setTipo] = useState<"Fixa"|"Variável">("Fixa");
  const [categoria, setCategoria] = useState("");

  function submit() {
    if (!nome || valor <= 0) return;
    onAdd({ id: cryptoRandom(), nome, valor, tipo, categoria: categoria || undefined });
    setOpen(false); setNome(""); setValor(0); setTipo("Fixa"); setCategoria("");
  }

  if (!open) return <button className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm" onClick={()=>setOpen(true)}>Adicionar</button>;
  return (
    <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
      <div className="grid md:grid-cols-4 gap-2 items-end">
        <div>
          <Label>Nome</Label>
          <input className="w-full rounded-xl border-slate-300" value={nome} onChange={(e)=>setNome(e.target.value)} placeholder="Ex.: Adobe, Aluguel" />
        </div>
        <div>
          <Label>Valor (R$)</Label>
          <input type="number" className="w-full rounded-xl border-slate-300" value={valor} onChange={(e)=>setValor(Number(e.target.value))} min={0} />
        </div>
        <div>
          <Label>Tipo</Label>
          <select className="w-full rounded-xl border-slate-300" value={tipo} onChange={(e)=>setTipo(e.target.value as any)}>
            <option value="Fixa">Fixa</option>
            <option value="Variável">Variável</option>
          </select>
        </div>
        <div>
          <Label>Categoria</Label>
          <input className="w-full rounded-xl border-slate-300" value={categoria} onChange={(e)=>setCategoria(e.target.value)} placeholder="Opcional" />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm" onClick={submit}>Salvar</button>
        <button className="px-3 py-2 rounded-xl bg-slate-200 text-slate-800 text-sm" onClick={()=>setOpen(false)}>Cancelar</button>
      </div>
    </div>
  );
}

function AddCusto({ onAdd }: { onAdd: (c: any)=>void }) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState<number>(0);
  function submit() {
    if (!nome || valor <= 0) return;
    onAdd({ id: cryptoRandom(), nome, valor });
    setOpen(false); setNome(""); setValor(0);
  }
  if (!open) return <button className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm" onClick={()=>setOpen(true)}>Adicionar</button>;
  return (
    <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
      <div className="grid md:grid-cols-3 gap-2 items-end">
        <div>
          <Label>Nome</Label>
          <input className="w-full rounded-xl border-slate-300" value={nome} onChange={(e)=>setNome(e.target.value)} placeholder="Ex.: Freela, Música" />
        </div>
        <div>
          <Label>Valor (R$)</Label>
          <input type="number" className="w-full rounded-xl border-slate-300" value={valor} onChange={(e)=>setValor(Number(e.target.value))} min={0} />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm" onClick={submit}>Salvar</button>
        <button className="px-3 py-2 rounded-xl bg-slate-200 text-slate-800 text-sm" onClick={()=>setOpen(false)}>Cancelar</button>
      </div>
    </div>
  );
}

// helpers UI
function colClass(i: number, len: number) {
  // 6 cols -> (2,2,2,2,2,2) ; 4 cols -> (6,2,2,2) custom mapping below for our headers
  const maps: Record<number, string> = {
    6: "grid-cols-12",
    4: "grid-cols-12",
  };
  // Using fixed 12 columns; width per col decided by index
  return [
    "col-span-4", // Nome
    "col-span-2", // Tipo / Valor
    "col-span-2", // Categoria / %
    "col-span-2 text-right", // Valor / ações
    "col-span-1 text-right", // % Receita
    "col-span-1 text-right", // ações
  ][i] || "col-span-2";
}

// utils
function sum(nums: number[]) { return nums.reduce((a,b)=>a+b,0); }
function format(n: number) { return n.toLocaleString(); }
function pct(base: number, v: number) { return base > 0 ? (v/base*100).toFixed(1) : "0.0"; }
function cryptoRandom() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function editDespesa(d: any, setDespesas: React.Dispatch<React.SetStateAction<any[]>>) {
  const nome = prompt("Nome da despesa:", d.nome);
  if (nome === null) return;
  const valorStr = prompt("Valor (R$):", String(d.valor));
  if (valorStr === null) return;
  const valor = Number(valorStr);
  const tipo = prompt("Tipo (Fixa/Variável):", d.tipo) as "Fixa"|"Variável";
  const categoria = prompt("Categoria (opcional):", d.categoria ?? "");
  if (!nome || !(valor>0) || (tipo !== "Fixa" && tipo !== "Variável")) return;
  setDespesas(prev => prev.map(x => x.id === d.id ? { ...x, nome, valor, tipo, categoria: categoria || undefined } : x));
}
function editCusto(c: any, setCustos: React.Dispatch<React.SetStateAction<any[]>>) {
  const nome = prompt("Nome do custo direto:", c.nome);
  if (nome === null) return;
  const valorStr = prompt("Valor (R$):", String(c.valor));
  if (valorStr === null) return;
  const valor = Number(valorStr);
  if (!nome || !(valor>0)) return;
  setCustos(prev => prev.map(x => x.id === c.id ? { ...x, nome, valor } : x));
}

function exportarDespesasCSV(despesas: any[]) {
  const header = ["nome","tipo","categoria","valor"];
  const rows = despesas.map(d => [d.nome, d.tipo, d.categoria ?? "", String(d.valor).replace(".", ",")]);
  const csv = [header, ...rows].map(r => r.map(v => typeof v === 'number' ? String(v).replace('.', ',') : `${v}`).join(';')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'despesas.csv'; a.click(); URL.revokeObjectURL(url);
}
