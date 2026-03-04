
using System.Text.Json.Serialization;

namespace ProcessMap.Api.Domain.Entities;

public enum ProcessType { Manual = 1, Sistemico = 2 }
public enum ProcessStatus { Ativo = 1, Inativo = 2 }
public enum ProcessImportance { Baixa = 1, Media = 2, Alta = 3 }

public class Area
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = default!;
    public ICollection<ProcessNode> Processos { get; set; } = new List<ProcessNode>();
}

public class ProcessNode
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid AreaId { get; set; }

    public Guid? ParentId { get; set; }
    public ICollection<ProcessNode> Children { get; set; } = new List<ProcessNode>();

    public Area? Area { get; set; }

    [JsonIgnore]
    public ProcessNode? Parent { get; set; }

    [JsonIgnore]
    public string Nome { get; set; } = default!;
    public string? Descricao { get; set; }

    public ProcessType Type { get; set; }
    public ProcessStatus Status { get; set; }
    public ProcessImportance Importance { get; set; }

    public ICollection<ProcessSystemTool> Sistemas { get; set; } = new List<ProcessSystemTool>();
}

public class ProcessSystemTool
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProcessNodeId { get; set; }
    [JsonIgnore] public ProcessNode? Process { get; set; }

    public string Nome { get; set; } = default!;
}
