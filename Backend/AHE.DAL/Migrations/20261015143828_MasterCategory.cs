using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AHE.DAL.Migrations
{
    /// <inheritdoc />
    public partial class MasterCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add as nullable so we can safely handle existing rows
            migrationBuilder.AddColumn<Guid>(
                name: "MasterCategoryId",
                table: "categories",
                type: "uuid",
                nullable: true,
                defaultValue: null);

            migrationBuilder.CreateTable(
                name: "MasterCategories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MasterCategoryName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MasterCategories", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_categories_MasterCategoryId",
                table: "categories",
                column: "MasterCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_MasterCategories_MasterCategoryName",
                table: "MasterCategories",
                column: "MasterCategoryName",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_categories_MasterCategories_MasterCategoryId",
                table: "categories",
                column: "MasterCategoryId",
                principalTable: "MasterCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_categories_MasterCategories_MasterCategoryId",
                table: "categories");

            migrationBuilder.DropTable(
                name: "MasterCategories");

            migrationBuilder.DropIndex(
                name: "IX_categories_MasterCategoryId",
                table: "categories");

            migrationBuilder.DropColumn(
                name: "MasterCategoryId",
                table: "categories");
        }
    }
}
