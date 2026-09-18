using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AHE.DAL.Migrations
{
    /// <inheritdoc />
    public partial class RemovedAdditionalIdFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_materials_categories_CategoryId",
                table: "materials");

            migrationBuilder.DropTable(
                name: "model_textures");

            migrationBuilder.DropIndex(
                name: "IX_textures_TextureId",
                table: "textures");

            migrationBuilder.DropIndex(
                name: "IX_models_ModelId",
                table: "models");

            migrationBuilder.DropIndex(
                name: "IX_materials_MaterialId",
                table: "materials");

            migrationBuilder.DropIndex(
                name: "IX_categories_CategoryId",
                table: "categories");

            migrationBuilder.DropColumn(
                name: "TextureId",
                table: "textures");

            migrationBuilder.DropColumn(
                name: "ThumbnailPath",
                table: "textures");

            migrationBuilder.DropColumn(
                name: "ModelId",
                table: "models");

            migrationBuilder.DropColumn(
                name: "ModelThumbnailPath",
                table: "models");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "model_regions");

            migrationBuilder.DropColumn(
                name: "MaterialId",
                table: "materials");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "categories");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "models",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "model_variants",
                columns: table => new
                {
                    ModelId = table.Column<Guid>(type: "uuid", nullable: false),
                    TextureId = table.Column<Guid>(type: "uuid", nullable: false),
                    SkuNumber = table.Column<string>(type: "text", nullable: false),
                    ThumbnailPath = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_model_variants", x => new { x.ModelId, x.TextureId });
                    table.ForeignKey(
                        name: "FK_model_variants_models_ModelId",
                        column: x => x.ModelId,
                        principalTable: "models",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_model_variants_textures_TextureId",
                        column: x => x.TextureId,
                        principalTable: "textures",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_model_variants_TextureId",
                table: "model_variants",
                column: "TextureId");

            migrationBuilder.AddForeignKey(
                name: "FK_materials_categories_CategoryId",
                table: "materials",
                column: "CategoryId",
                principalTable: "categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_materials_categories_CategoryId",
                table: "materials");

            migrationBuilder.DropTable(
                name: "model_variants");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "models");

            migrationBuilder.AddColumn<string>(
                name: "TextureId",
                table: "textures",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ThumbnailPath",
                table: "textures",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ModelId",
                table: "models",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ModelThumbnailPath",
                table: "models",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "model_regions",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MaterialId",
                table: "materials",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CategoryId",
                table: "categories",
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
                name: "IX_textures_TextureId",
                table: "textures",
                column: "TextureId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_models_ModelId",
                table: "models",
                column: "ModelId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_materials_MaterialId",
                table: "materials",
                column: "MaterialId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_categories_CategoryId",
                table: "categories",
                column: "CategoryId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_model_textures_TextureId",
                table: "model_textures",
                column: "TextureId");

            migrationBuilder.AddForeignKey(
                name: "FK_materials_categories_CategoryId",
                table: "materials",
                column: "CategoryId",
                principalTable: "categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
