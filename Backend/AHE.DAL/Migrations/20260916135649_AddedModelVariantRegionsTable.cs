using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AHE.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddedModelVariantRegionsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "model_regions");

            migrationBuilder.AddColumn<Guid>(
                name: "Id",
                table: "model_variants",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "model_variant_regions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ModelId = table.Column<Guid>(type: "uuid", nullable: false),
                    TextureId = table.Column<Guid>(type: "uuid", nullable: false),
                    RegionId = table.Column<Guid>(type: "uuid", nullable: false),
                    ItemNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_model_variant_regions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_model_variant_regions_model_variants_ModelId_TextureId",
                        columns: x => new { x.ModelId, x.TextureId },
                        principalTable: "model_variants",
                        principalColumns: new[] { "ModelId", "TextureId" },
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_model_variant_regions_models_ModelId",
                        column: x => x.ModelId,
                        principalTable: "models",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_model_variant_regions_regions_RegionId",
                        column: x => x.RegionId,
                        principalTable: "regions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_model_variant_regions_ModelId_TextureId_RegionId",
                table: "model_variant_regions",
                columns: new[] { "ModelId", "TextureId", "RegionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_model_variant_regions_RegionId_ItemNumber",
                table: "model_variant_regions",
                columns: new[] { "RegionId", "ItemNumber" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "model_variant_regions");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "model_variants");

            migrationBuilder.CreateTable(
                name: "model_regions",
                columns: table => new
                {
                    ModelId = table.Column<Guid>(type: "uuid", nullable: false),
                    RegionId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    ItemNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_model_regions", x => new { x.ModelId, x.RegionId });
                    table.ForeignKey(
                        name: "FK_model_regions_models_ModelId",
                        column: x => x.ModelId,
                        principalTable: "models",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_model_regions_regions_RegionId",
                        column: x => x.RegionId,
                        principalTable: "regions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_model_regions_RegionId",
                table: "model_regions",
                column: "RegionId");

            migrationBuilder.CreateIndex(
                name: "IX_model_regions_RegionId_ItemNumber",
                table: "model_regions",
                columns: new[] { "RegionId", "ItemNumber" },
                unique: true);
        }
    }
}
