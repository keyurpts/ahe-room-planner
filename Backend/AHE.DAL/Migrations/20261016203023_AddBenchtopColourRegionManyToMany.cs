using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AHE.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddBenchtopColourRegionManyToMany : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BenchtopColours_regions_RegionId",
                table: "BenchtopColours");

            migrationBuilder.DropIndex(
                name: "IX_BenchtopColours_RegionId",
                table: "BenchtopColours");

            migrationBuilder.DropColumn(
                name: "RegionId",
                table: "BenchtopColours");

            migrationBuilder.CreateTable(
                name: "benchtop_colour_regions",
                columns: table => new
                {
                    BenchtopColourId = table.Column<Guid>(type: "uuid", nullable: false),
                    RegionId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_benchtop_colour_regions", x => new { x.BenchtopColourId, x.RegionId });
                    table.ForeignKey(
                        name: "FK_benchtop_colour_regions_BenchtopColours_BenchtopColourId",
                        column: x => x.BenchtopColourId,
                        principalTable: "BenchtopColours",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_benchtop_colour_regions_regions_RegionId",
                        column: x => x.RegionId,
                        principalTable: "regions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_benchtop_colour_regions_RegionId",
                table: "benchtop_colour_regions",
                column: "RegionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "benchtop_colour_regions");

            migrationBuilder.AddColumn<Guid>(
                name: "RegionId",
                table: "BenchtopColours",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_BenchtopColours_RegionId",
                table: "BenchtopColours",
                column: "RegionId");

            migrationBuilder.AddForeignKey(
                name: "FK_BenchtopColours_regions_RegionId",
                table: "BenchtopColours",
                column: "RegionId",
                principalTable: "regions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
