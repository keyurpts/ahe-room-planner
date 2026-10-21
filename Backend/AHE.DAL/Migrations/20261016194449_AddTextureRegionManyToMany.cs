using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AHE.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddTextureRegionManyToMany : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "MasterCategoryId",
                table: "categories",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "texture_regions",
                columns: table => new
                {
                    TextureId = table.Column<Guid>(type: "uuid", nullable: false),
                    RegionId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_texture_regions", x => new { x.TextureId, x.RegionId });
                    table.ForeignKey(
                        name: "FK_texture_regions_regions_RegionId",
                        column: x => x.RegionId,
                        principalTable: "regions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_texture_regions_textures_TextureId",
                        column: x => x.TextureId,
                        principalTable: "textures",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_texture_regions_RegionId",
                table: "texture_regions",
                column: "RegionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "texture_regions");
        }
    }
}
