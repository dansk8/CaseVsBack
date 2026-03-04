using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcessMap.Api.Domain.Entities;
using ProcessMap.Api.Infrastructure;

namespace ProcessMap.Api.Controllers;

[ApiController]
[Route("api/areas")]
public class AreasController : ControllerBase
{
    private readonly AppDbContext _db;
    public AreasController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Get()
        => Ok(await _db.Areas.AsNoTracking().ToListAsync());

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Area area)
    {
        if (string.IsNullOrWhiteSpace(area.Nome))
            return BadRequest("Nome é obrigatório.");

        var a = new Area { Nome = area.Nome.Trim() };
        _db.Areas.Add(a);
        await _db.SaveChangesAsync();
        return Ok(a);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Area body)
    {
        var area = await _db.Areas.FirstOrDefaultAsync(x => x.Id == id);
        if (area == null) return NotFound();

        if (string.IsNullOrWhiteSpace(body.Nome))
            return BadRequest("Nome é obrigatório.");

        area.Nome = body.Nome.Trim();
        await _db.SaveChangesAsync();
        return Ok(area);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        // bloqueia se tiver processos (pra não quebrar o case)
        var hasProcesses = await _db.ProcessNodes.AnyAsync(p => p.AreaId == id);
        if (hasProcesses)
            return BadRequest("Não é possível excluir a área: existem processos associados.");

        var area = await _db.Areas.FirstOrDefaultAsync(x => x.Id == id);
        if (area == null) return NotFound();

        _db.Areas.Remove(area);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}