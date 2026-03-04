using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcessMap.Api.Application.DTOs;
using ProcessMap.Api.Domain.Entities;
using ProcessMap.Api.Application.DTOs;
using ProcessMap.Api.Infrastructure;

namespace ProcessMap.Api.Controllers;

[ApiController]
[Route("api/processes")]
public class ProcessesController : ControllerBase
{
    private readonly AppDbContext _db;
    public ProcessesController(AppDbContext db) => _db = db;

    // ✅ Cria processo/subprocesso (payload simples)
    // POST /api/processes
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ProcessRequest req)
    {
        if (req.AreaId == Guid.Empty)
            return BadRequest("AreaId é obrigatório.");

        if (string.IsNullOrWhiteSpace(req.Nome))
            return BadRequest("Nome é obrigatório.");

        // valida área
        var areaExists = await _db.Areas.AnyAsync(a => a.Id == req.AreaId);
        if (!areaExists)
            return BadRequest("Área não encontrada.");

        // valida pai (se existir)
        if (req.ParentId is Guid parentId)
        {
            var parent = await _db.ProcessNodes.AsNoTracking().FirstOrDefaultAsync(p => p.Id == parentId);
            if (parent == null)
                return BadRequest("ParentId inválido.");

            if (parent.AreaId != req.AreaId)
                return BadRequest("O processo pai deve ser da mesma área.");
        }

        // converte ints -> enums com fallback seguro
        var type = Enum.IsDefined(typeof(ProcessType), req.Type) ? (ProcessType)req.Type : ProcessType.Manual;
        var status = Enum.IsDefined(typeof(ProcessStatus), req.Status) ? (ProcessStatus)req.Status : ProcessStatus.Ativo;
        var importance = Enum.IsDefined(typeof(ProcessImportance), req.Importance) ? (ProcessImportance)req.Importance : ProcessImportance.Media;

        var node = new ProcessNode
        {
            AreaId = req.AreaId,
            ParentId = req.ParentId,
            Nome = req.Nome.Trim(),
            Descricao = req.Descricao?.Trim(),
            Type = type,
            Status = status,
            Importance = importance,
            Sistemas = (req.Sistemas ?? new List<string>())
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => new ProcessSystemTool { Nome = s.Trim() })
                .ToList()
        };

        _db.ProcessNodes.Add(node);
        await _db.SaveChangesAsync();

        return Ok(new { id = node.Id });
    }

    // ✅ Retorna a ÁRVORE real (com children) por área
    // GET /api/processes/tree/{areaId}
    [HttpGet("tree/{areaId:guid}")]
    public async Task<IActionResult> Tree(Guid areaId)
    {
        var nodes = await _db.ProcessNodes
            .Where(x => x.AreaId == areaId)
            .Include(x => x.Sistemas)
            .AsNoTracking()
            .ToListAsync();

        // DTO de retorno (não devolve entidades EF)
        var map = nodes.ToDictionary(n => n.Id, n => new TreeNodeDto
        {
            Id = n.Id,
            AreaId = n.AreaId,
            ParentId = n.ParentId,
            Nome = n.Nome,
            Descricao = n.Descricao,
            Type = n.Type,
            Status = n.Status,
            Importance = n.Importance,
            Sistemas = n.Sistemas.Select(s => s.Nome).ToList(),
            Children = new List<TreeNodeDto>()
        });

        // liga filhos
        foreach (var n in nodes)
        {
            if (n.ParentId is Guid pid && map.ContainsKey(pid))
                map[pid].Children.Add(map[n.Id]);
        }

        // raízes
        var roots = nodes
            .Where(n => n.ParentId == null)
            .Select(n => map[n.Id])
            .ToList();

        return Ok(roots);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProcessRequest req)
    {
        var node = await _db.ProcessNodes
            .Include(x => x.Sistemas)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (node == null) return NotFound();

        if (string.IsNullOrWhiteSpace(req.Nome))
            return BadRequest("Nome é obrigatório.");

        var type = Enum.IsDefined(typeof(ProcessType), req.Type) ? (ProcessType)req.Type : node.Type;
        var status = Enum.IsDefined(typeof(ProcessStatus), req.Status) ? (ProcessStatus)req.Status : node.Status;
        var importance = Enum.IsDefined(typeof(ProcessImportance), req.Importance) ? (ProcessImportance)req.Importance : node.Importance;

        node.Nome = req.Nome.Trim();
        node.Descricao = req.Descricao?.Trim();
        node.Type = type;
        node.Status = status;
        node.Importance = importance;

        // Atualiza ferramentas (simples: apaga e recria)
        _db.ProcessSystemTools.RemoveRange(node.Sistemas);
        node.Sistemas = (req.Sistemas ?? new())
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => new ProcessSystemTool { Nome = s.Trim() })
            .ToList();

        await _db.SaveChangesAsync();
        return Ok(new { node.Id });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        // bloqueia excluir se tiver filhos (mais seguro pro case)
        var hasChildren = await _db.ProcessNodes.AnyAsync(x => x.ParentId == id);
        if (hasChildren)
            return BadRequest("Não é possível excluir: existem subprocessos. Exclua os filhos primeiro.");

        var node = await _db.ProcessNodes.FirstOrDefaultAsync(x => x.Id == id);
        if (node == null) return NotFound();

        _db.ProcessNodes.Remove(node);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ✅ Opcional: lista plana (para debug)
    // GET /api/processes/flat/{areaId}
    [HttpGet("flat/{areaId:guid}")]
    public async Task<IActionResult> Flat(Guid areaId)
    {
        var list = await _db.ProcessNodes
            .Where(x => x.AreaId == areaId)
            .Select(x => new
            {
                x.Id,
                x.AreaId,
                x.ParentId,
                x.Nome,
                x.Type,
                x.Status,
                x.Importance
            })
            .AsNoTracking()
            .ToListAsync();

        return Ok(list);
    }


    // DTO interno do retorno da árvore
    public class TreeNodeDto
    {
        public Guid Id { get; set; }
        public Guid AreaId { get; set; }
        public Guid? ParentId { get; set; }
        public string Nome { get; set; } = default!;
        public string? Descricao { get; set; }
        public ProcessType Type { get; set; }
        public ProcessStatus Status { get; set; }
        public ProcessImportance Importance { get; set; }

        public List<string> Sistemas { get; set; } = new();
        public List<TreeNodeDto> Children { get; set; } = new();
    }

   
}