import { useEffect, useMemo, useState } from "react"
import axios from "axios"

const API_URL = "https://localhost:57242"

type TipoProcesso = "manual" | "sistemico"
type StatusProcesso = "ativo" | "inativo"

type Area = { id: string; nome: string }

type ProcessoNode = {
  id: string
  areaId: string
  parentId?: string | null
  nome: string
  descricao?: string | null
  type: number // 1 manual, 2 sistemico
  status: number // 1 ativo, 2 inativo
  importance: number // 1 baixa, 2 media, 3 alta
  sistemas: string[]
  children: ProcessoNode[]
}

const toTipo = (t: number): TipoProcesso => (t === 2 ? "sistemico" : "manual")
const toStatus = (s: number): StatusProcesso => (s === 2 ? "inativo" : "ativo")
const fromTipo = (t: TipoProcesso) => (t === "sistemico" ? 2 : 1)
const fromStatus = (s: StatusProcesso) => (s === "inativo" ? 2 : 1)

const iconTipo = (t: TipoProcesso | string) => (t === "sistemico" ? "⚙️" : "📘")
const colorTipo = (t: TipoProcesso | string) => (t === "sistemico" ? "#0f766e" : "#1d4ed8")

export default function App() {
  const [areas, setAreas] = useState<Area[]>([])
  const [selectedAreaId, setSelectedAreaId] = useState<string>("")
  const [tree, setTree] = useState<ProcessoNode[]>([])

  // forms area
  const [nomeArea, setNomeArea] = useState("")

  // criar processo raiz
  const [nomeProcesso, setNomeProcesso] = useState("")
  const [tipo, setTipo] = useState<TipoProcesso>("manual")

  // ui
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [addingChildOf, setAddingChildOf] = useState<string | null>(null)
  const [childName, setChildName] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // modal editar processo
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState("")
  const [editNome, setEditNome] = useState("")
  const [editTipo, setEditTipo] = useState<TipoProcesso>("manual")
  const [editStatus, setEditStatus] = useState<StatusProcesso>("ativo")
  const [editImportance, setEditImportance] = useState<number>(2)
  const [editSistemas, setEditSistemas] = useState<string>("")

  // modal editar area
  const [editAreaOpen, setEditAreaOpen] = useState(false)
  const [editAreaId, setEditAreaId] = useState("")
  const [editAreaNome, setEditAreaNome] = useState("")

  useEffect(() => {
    carregarDados()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const carregarDados = async () => {
    try {
      setError("")
      setLoading(true)

      const areasRes = await axios.get<Area[]>(`${API_URL}/api/areas`)
      setAreas(areasRes.data)

      const first = (areasRes.data?.[0]?.id as string) || ""
      const areaToUse = selectedAreaId || first
      setSelectedAreaId(areaToUse)

      if (areaToUse) {
        const treeRes = await axios.get<ProcessoNode[]>(`${API_URL}/api/processes/tree/${areaToUse}`)
        setTree(treeRes.data || [])
      } else {
        setTree([])
      }
    } catch (e: any) {
      setError(e?.message || "Erro ao carregar dados.")
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const expandAll = () => {
    const all = new Set<string>()
    const walk = (items: ProcessoNode[]) => {
      for (const p of items) {
        all.add(p.id)
        if (p.children?.length) walk(p.children)
      }
    }
    walk(filteredRoots)
    setExpanded(all)
  }

  const collapseAll = () => setExpanded(new Set())

  // ---------- ÁREA ----------
  const criarArea = async () => {
    const nome = nomeArea.trim()
    if (!nome) return
    try {
      setError("")
      setLoading(true)
      await axios.post(`${API_URL}/api/areas`, { nome })
      setNomeArea("")
      await carregarDados()
    } catch (e: any) {
      setError(e?.response?.data || e?.message || "Erro ao criar área.")
    } finally {
      setLoading(false)
    }
  }

  const abrirEditarArea = () => {
    const a = areas.find((x) => x.id === selectedAreaId)
    if (!a) return
    setEditAreaId(a.id)
    setEditAreaNome(a.nome)
    setEditAreaOpen(true)
  }

  const salvarEditarArea = async () => {
    const nome = editAreaNome.trim()
    if (!nome || !editAreaId) return
    try {
      setError("")
      setLoading(true)
      await axios.put(`${API_URL}/api/areas/${editAreaId}`, { nome })
      setEditAreaOpen(false)
      await carregarDados()
    } catch (e: any) {
      setError(e?.response?.data || e?.message || "Erro ao editar área.")
    } finally {
      setLoading(false)
    }
  }

  const deletarArea = async () => {
    if (!selectedAreaId) return
    const areaNome = areas.find((a) => a.id === selectedAreaId)?.nome || "essa área"
    const ok = window.confirm(`Tem certeza que deseja excluir "${areaNome}"?`)
    if (!ok) return

    try {
      setError("")
      setLoading(true)
      await axios.delete(`${API_URL}/api/areas/${selectedAreaId}`)
      setSelectedAreaId("")
      await carregarDados()
    } catch (e: any) {
      setError(e?.response?.data || e?.message || "Erro ao deletar área.")
    } finally {
      setLoading(false)
    }
  }

  // ---------- PROCESSO ----------
  const criarProcessoRaiz = async () => {
    const nome = nomeProcesso.trim()
    if (!nome || !selectedAreaId) return
    try {
      setError("")
      setLoading(true)
      await axios.post(`${API_URL}/api/processes`, {
        areaId: selectedAreaId,
        parentId: null,
        nome,
        descricao: null,
        type: fromTipo(tipo),
        status: 1,
        importance: 2,
        sistemas: [],
      })
      setNomeProcesso("")
      setTipo("manual")
      await carregarDados()
    } catch (e: any) {
      setError(e?.response?.data || e?.message || "Erro ao criar processo.")
    } finally {
      setLoading(false)
    }
  }

  const iniciarSubprocesso = (paiId: string) => {
    setAddingChildOf(paiId)
    setChildName("")
    setExpanded((prev) => new Set(prev).add(paiId))
  }

  const cancelarSubprocesso = () => {
    setAddingChildOf(null)
    setChildName("")
  }

  const salvarSubprocesso = async (paiId: string) => {
    const nome = childName.trim()
    if (!nome || !selectedAreaId) return
    try {
      setError("")
      setLoading(true)
      await axios.post(`${API_URL}/api/processes`, {
        areaId: selectedAreaId,
        parentId: paiId,
        nome,
        descricao: null,
        type: 1,
        status: 1,
        importance: 2,
        sistemas: [],
      })
      cancelarSubprocesso()
      await carregarDados()
    } catch (e: any) {
      setError(e?.response?.data || e?.message || "Erro ao criar subprocesso.")
    } finally {
      setLoading(false)
    }
  }

  const abrirEditarProcesso = (p: ProcessoNode) => {
    setEditId(p.id)
    setEditNome(p.nome)
    setEditTipo(toTipo(p.type))
    setEditStatus(toStatus(p.status))
    setEditImportance(p.importance ?? 2)
    setEditSistemas((p.sistemas || []).join(", "))
    setEditOpen(true)
  }

  const salvarEditarProcesso = async () => {
    const nome = editNome.trim()
    if (!nome || !editId) return
    try {
      setError("")
      setLoading(true)
      await axios.put(`${API_URL}/api/processes/${editId}`, {
        nome,
        descricao: null,
        type: fromTipo(editTipo),
        status: fromStatus(editStatus),
        importance: editImportance,
        sistemas: editSistemas
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      })
      setEditOpen(false)
      await carregarDados()
    } catch (e: any) {
      setError(e?.response?.data || e?.message || "Erro ao editar processo.")
    } finally {
      setLoading(false)
    }
  }

  const deletarProcesso = async (p: ProcessoNode) => {
    const ok = window.confirm(`Excluir "${p.nome}"?\n\nSe tiver filhos, o backend vai bloquear.`)
    if (!ok) return
    try {
      setError("")
      setLoading(true)
      await axios.delete(`${API_URL}/api/processes/${p.id}`)
      await carregarDados()
    } catch (e: any) {
      setError(e?.response?.data || e?.message || "Erro ao deletar processo.")
    } finally {
      setLoading(false)
    }
  }

  // filtro por busca
  const filteredRoots = useMemo(() => {
    const q = query.trim().toLowerCase()

    const filterTree = (nodes: ProcessoNode[]): ProcessoNode[] => {
      const out: ProcessoNode[] = []
      for (const n of nodes) {
        const children = n.children ? filterTree(n.children) : []
        const matches = !q || n.nome.toLowerCase().includes(q)
        if (matches || children.length > 0) out.push({ ...n, children })
      }
      return out
    }

    return filterTree(tree)
  }, [tree, query])

  const renderNode = (p: ProcessoNode, level = 0) => {
    const hasChildren = !!p.children?.length
    const isOpen = expanded.has(p.id)
    const tipoTxt = toTipo(p.type)
    const statusTxt = toStatus(p.status)

    return (
      <div
        key={p.id}
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 12,
          marginLeft: level ? 16 : 0,
          marginTop: 10,
          background: "#fff",
          boxShadow: "0 1px 0 rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => hasChildren && toggleExpanded(p.id)}
            disabled={!hasChildren}
            title={hasChildren ? (isOpen ? "Recolher" : "Expandir") : "Sem filhos"}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: hasChildren ? "#f9fafb" : "#f3f4f6",
              cursor: hasChildren ? "pointer" : "not-allowed",
            }}
          >
            {hasChildren ? (isOpen ? "▾" : "▸") : "•"}
          </button>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: colorTipo(tipoTxt), fontWeight: 900 }}>
                {iconTipo(tipoTxt)} {p.nome}
              </span>

              <span
                style={{
                  fontSize: 12,
                  padding: "2px 8px",
                  borderRadius: 999,
                  border: "1px solid #e5e7eb",
                  background: statusTxt === "ativo" ? "#ecfdf5" : "#fef2f2",
                }}
              >
                {statusTxt}
              </span>

              <span
                style={{
                  fontSize: 12,
                  padding: "2px 8px",
                  borderRadius: 999,
                  border: "1px solid #e5e7eb",
                  background: p.importance === 3 ? "#fff1f2" : p.importance === 2 ? "#fffbeb" : "#eff6ff",
                }}
              >
                Imp {p.importance}
              </span>
            </div>

            {!!p.sistemas?.length && (
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                Ferramentas: <b>{p.sistemas.join(", ")}</b>
              </div>
            )}
          </div>

          <button
            onClick={() => iniciarSubprocesso(p.id)}
            style={{
              border: "1px solid #e5e7eb",
              background: "#111827",
              color: "#fff",
              borderRadius: 10,
              padding: "8px 10px",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            + Subprocesso
          </button>

          <button
            onClick={() => abrirEditarProcesso(p)}
            style={{
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
              borderRadius: 10,
              padding: "8px 10px",
              cursor: "pointer",
              fontWeight: 900,
            }}
            title="Editar"
          >
            ✏️
          </button>

          <button
            onClick={() => deletarProcesso(p)}
            style={{
              border: "1px solid #fecaca",
              background: "#fff",
              color: "#b91c1c",
              borderRadius: 10,
              padding: "8px 10px",
              cursor: "pointer",
              fontWeight: 900,
            }}
            title="Excluir"
          >
            🗑️
          </button>
        </div>

        {addingChildOf === p.id && (
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <input
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="Nome do subprocesso"
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                outline: "none",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") salvarSubprocesso(p.id)
                if (e.key === "Escape") cancelarSubprocesso()
              }}
            />
            <button
              onClick={() => salvarSubprocesso(p.id)}
              style={{
                border: "1px solid #e5e7eb",
                background: "#16a34a",
                color: "#fff",
                borderRadius: 10,
                padding: "10px 12px",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              Salvar
            </button>
            <button
              onClick={cancelarSubprocesso}
              style={{
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
                borderRadius: 10,
                padding: "10px 12px",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              Cancelar
            </button>
          </div>
        )}

        {hasChildren && isOpen && (
          <div style={{ marginTop: 8 }}>
            {p.children.map((sub) => renderNode(sub, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "Inter, Arial, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26 }}>Mapeador de Processos</h1>
            <div style={{ color: "#6b7280", marginTop: 6 }}>
              Áreas → Processos → Subprocessos (árvore infinita) • Editar/Excluir • Ferramentas
            </div>
          </div>

          <button
            onClick={carregarDados}
            disabled={loading}
            style={{
              border: "1px solid #e5e7eb",
              background: "#fff",
              borderRadius: 12,
              padding: "10px 12px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 900,
            }}
          >
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </header>

        {error && (
          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 12,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#991b1b",
              fontWeight: 900,
            }}
          >
            {String(error)}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 16, marginTop: 18 }}>
          {/* Sidebar */}
          <aside
            style={{
              border: "1px solid #e5e7eb",
              background: "#fff",
              borderRadius: 16,
              padding: 16,
              height: "fit-content",
              boxShadow: "0 1px 0 rgba(0,0,0,0.03)",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16 }}>Áreas</h2>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Selecionar área</div>
              <select
                value={selectedAreaId}
                onChange={(e) => {
                  const id = e.target.value
                  setSelectedAreaId(id)
                  setExpanded(new Set())
                  setAddingChildOf(null)
                  setChildName("")
                  carregarDados()
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  fontWeight: 900,
                }}
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
                {!areas.length && <option value="">Nenhuma área</option>}
              </select>

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  onClick={abrirEditarArea}
                  disabled={!selectedAreaId}
                  style={{
                    flex: 1,
                    border: "1px solid #e5e7eb",
                    background: "#f9fafb",
                    borderRadius: 12,
                    padding: "10px 12px",
                    cursor: !selectedAreaId ? "not-allowed" : "pointer",
                    fontWeight: 900,
                  }}
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={deletarArea}
                  disabled={!selectedAreaId}
                  style={{
                    flex: 1,
                    border: "1px solid #fecaca",
                    background: "#fff",
                    color: "#b91c1c",
                    borderRadius: 12,
                    padding: "10px 12px",
                    cursor: !selectedAreaId ? "not-allowed" : "pointer",
                    fontWeight: 900,
                  }}
                >
                  🗑️ Excluir
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <input
                placeholder="Nova área"
                value={nomeArea}
                onChange={(e) => setNomeArea(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && criarArea()}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  outline: "none",
                }}
              />
              <button
                onClick={criarArea}
                disabled={loading || !nomeArea.trim()}
                style={{
                  border: "1px solid #e5e7eb",
                  background: "#111827",
                  color: "#fff",
                  borderRadius: 10,
                  padding: "10px 12px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: 900,
                }}
              >
                Criar
              </button>
            </div>

            <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "16px 0" }} />

            <h3 style={{ margin: 0, fontSize: 14 }}>Novo Processo (raiz)</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
              <input
                placeholder="Nome do processo"
                value={nomeProcesso}
                onChange={(e) => setNomeProcesso(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && criarProcessoRaiz()}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  outline: "none",
                }}
              />

              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoProcesso)}
                style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}
              >
                <option value="manual">Manual</option>
                <option value="sistemico">Sistêmico</option>
              </select>

              <button
                onClick={criarProcessoRaiz}
                disabled={loading || !nomeProcesso.trim() || !selectedAreaId}
                style={{
                  border: "1px solid #e5e7eb",
                  background: "#2563eb",
                  color: "#fff",
                  borderRadius: 12,
                  padding: "10px 12px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: 900,
                }}
              >
                Criar Processo
              </button>
            </div>
          </aside>

          {/* Main */}
          <main
            style={{
              border: "1px solid #e5e7eb",
              background: "#fff",
              borderRadius: 16,
              padding: 16,
              boxShadow: "0 1px 0 rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18 }}>Cadeia de Processos</h2>
                <div style={{ color: "#6b7280", marginTop: 6, fontSize: 13 }}>
                  Área: <b>{areas.find((a) => a.id === selectedAreaId)?.nome || "—"}</b>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  placeholder="Buscar..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    outline: "none",
                    width: 260,
                  }}
                />

                <button
                  onClick={expandAll}
                  style={{
                    border: "1px solid #e5e7eb",
                    background: "#f9fafb",
                    borderRadius: 12,
                    padding: "10px 12px",
                    cursor: "pointer",
                    fontWeight: 900,
                  }}
                >
                  Expandir
                </button>
                <button
                  onClick={collapseAll}
                  style={{
                    border: "1px solid #e5e7eb",
                    background: "#f9fafb",
                    borderRadius: 12,
                    padding: "10px 12px",
                    cursor: "pointer",
                    fontWeight: 900,
                  }}
                >
                  Recolher
                </button>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              {!filteredRoots.length ? (
                <div style={{ color: "#6b7280", padding: 14 }}>Nenhum processo encontrado.</div>
              ) : (
                filteredRoots.map((p) => renderNode(p))
              )}
            </div>
          </main>
        </div>
      </div>

      {/* MODAL EDITAR PROCESSO */}
      {editOpen && (
        <div
          onClick={() => setEditOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 560,
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              padding: 16,
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Editar Processo</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                placeholder="Nome"
                style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}
              />

              <select
                value={editTipo}
                onChange={(e) => setEditTipo(e.target.value as TipoProcesso)}
                style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}
              >
                <option value="manual">Manual</option>
                <option value="sistemico">Sistêmico</option>
              </select>

              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as StatusProcesso)}
                style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>

              <select
                value={editImportance}
                onChange={(e) => setEditImportance(Number(e.target.value))}
                style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}
              >
                <option value={1}>Importância: Baixa</option>
                <option value={2}>Importância: Média</option>
                <option value={3}>Importância: Alta</option>
              </select>

              <input
                value={editSistemas}
                onChange={(e) => setEditSistemas(e.target.value)}
                placeholder="Ferramentas (separe por vírgula). Ex: Trello, Notion"
                style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
              <button
                onClick={() => setEditOpen(false)}
                style={{ border: "1px solid #e5e7eb", background: "#f9fafb", borderRadius: 12, padding: "10px 12px" }}
              >
                Cancelar
              </button>
              <button
                onClick={salvarEditarProcesso}
                disabled={loading || !editNome.trim()}
                style={{
                  border: "1px solid #e5e7eb",
                  background: "#2563eb",
                  color: "#fff",
                  borderRadius: 12,
                  padding: "10px 12px",
                  fontWeight: 900,
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR ÁREA */}
      {editAreaOpen && (
        <div
          onClick={() => setEditAreaOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 520,
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              padding: 16,
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Editar Área</h3>

            <input
              value={editAreaNome}
              onChange={(e) => setEditAreaNome(e.target.value)}
              placeholder="Nome da área"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}
            />

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
              <button
                onClick={() => setEditAreaOpen(false)}
                style={{ border: "1px solid #e5e7eb", background: "#f9fafb", borderRadius: 12, padding: "10px 12px" }}
              >
                Cancelar
              </button>
              <button
                onClick={salvarEditarArea}
                disabled={loading || !editAreaNome.trim()}
                style={{
                  border: "1px solid #e5e7eb",
                  background: "#111827",
                  color: "#fff",
                  borderRadius: 12,
                  padding: "10px 12px",
                  fontWeight: 900,
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}