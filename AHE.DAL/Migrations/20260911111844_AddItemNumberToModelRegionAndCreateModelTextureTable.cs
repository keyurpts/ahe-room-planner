using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AHE.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddItemNumberToModelRegionAndCreateModelTextureTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_textures_categories_CategoryId",
                table: "textures");

            migrationBuilder.DropIndex(
                name: "IX_textures_CategoryId",
                table: "textures");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "textures");

            migrationBuilder.AddColumn<string>(
                name: "ItemNumber",
                table: "model_regions",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "model_textures",
                columns: table => new
                {
                    ModelId = table.Column<Guid>(type: "uuid", nullable: false),
                    TextureId = table.Column<Guid>(type: "uuid", nullable: false),
                    SkuNumber = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_model_textures", x => new { x.ModelId, x.TextureId });
                    table.ForeignKey(
                        name: "FK_model_textures_models_ModelId",
                        column: x => x.ModelId,
                        principalTable: "models",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_model_textures_textures_TextureId",
                        column: x => x.TextureId,
                        principalTable: "textures",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_model_regions_RegionId_ItemNumber",
                table: "model_regions",
                columns: new[] { "RegionId", "ItemNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_model_textures_TextureId",
                table: "model_textures",
                column: "TextureId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "model_textures");

            migrationBuilder.DropIndex(
                name: "IX_model_regions_RegionId_ItemNumber",
                table: "model_regions");

            migrationBuilder.DropColumn(
                name: "ItemNumber",
                table: "model_regions");

            migrationBuilder.AddColumn<Guid>(
                name: "CategoryId",
                table: "textures",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_textures_CategoryId",
                table: "textures",
                column: "CategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_textures_categories_CategoryId",
                table: "textures",
                column: "CategoryId",
                principalTable: "categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
