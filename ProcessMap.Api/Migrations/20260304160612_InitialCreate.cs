using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProcessMap.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Areas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Areas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProcessNodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AreaId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParentId = table.Column<Guid>(type: "uuid", nullable: true),
                    Nome = table.Column<string>(type: "text", nullable: false),
                    Descricao = table.Column<string>(type: "text", nullable: true),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Importance = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessNodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcessNodes_Areas_AreaId",
                        column: x => x.AreaId,
                        principalTable: "Areas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProcessNodes_ProcessNodes_ParentId",
                        column: x => x.ParentId,
                        principalTable: "ProcessNodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProcessSystemTools",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProcessNodeId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessSystemTools", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcessSystemTools_ProcessNodes_ProcessNodeId",
                        column: x => x.ProcessNodeId,
                        principalTable: "ProcessNodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProcessNodes_AreaId",
                table: "ProcessNodes",
                column: "AreaId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessNodes_ParentId",
                table: "ProcessNodes",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessSystemTools_ProcessNodeId",
                table: "ProcessSystemTools",
                column: "ProcessNodeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProcessSystemTools");

            migrationBuilder.DropTable(
                name: "ProcessNodes");

            migrationBuilder.DropTable(
                name: "Areas");
        }
    }
}
