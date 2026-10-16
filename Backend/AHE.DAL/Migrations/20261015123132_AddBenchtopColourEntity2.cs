using System;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AHE.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddBenchtopColourEntity2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "RegionId",
                table: "textures",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "BenchtopColours",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BenchtopColourName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    AssetPath = table.Column<string>(type: "text", nullable: true),
                    BenchtopColourMetadata = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RegionId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BenchtopColours", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BenchtopColours_regions_RegionId",
                        column: x => x.RegionId,
                        principalTable: "regions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_textures_RegionId",
                table: "textures",
                column: "RegionId");

            migrationBuilder.CreateIndex(
                name: "IX_BenchtopColours_RegionId",
                table: "BenchtopColours",
                column: "RegionId");

            migrationBuilder.AddForeignKey(
                name: "FK_textures_regions_RegionId",
                table: "textures",
                column: "RegionId",
                principalTable: "regions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_textures_regions_RegionId",
                table: "textures");

            migrationBuilder.DropTable(
                name: "BenchtopColours");

            migrationBuilder.DropIndex(
                name: "IX_textures_RegionId",
                table: "textures");

            migrationBuilder.DropColumn(
                name: "RegionId",
                table: "textures");
        }
    }
}
