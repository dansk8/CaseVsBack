namespace ProcessMap.Api.Application.DTOs;

public class ProcessRequest
{
    public Guid AreaId { get; set; }
    public Guid? ParentId { get; set; }
    public string Nome { get; set; } = default!;
    public string? Descricao { get; set; }

    public int Type { get; set; } = 1;
    public int Status { get; set; } = 1;
    public int Importance { get; set; } = 1;

    public List<string>? Sistemas { get; set; }
}
public class UpdateProcessRequest
{
    public string Nome { get; set; } = default!;
    public string? Descricao { get; set; }
    public int Type { get; set; } = 1;
    public int Status { get; set; } = 1;
    public int Importance { get; set; } = 2;
    public List<string>? Sistemas { get; set; }
}