import { type MigrationInterface, type QueryRunner, Table, TableForeignKey } from "typeorm"

export class CreateCoreTables1698098400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Users table
        await queryRunner.createTable(new Table({
            name: "users",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "email",
                    type: "varchar",
                    length: "255",
                    isUnique: true
                },
                {
                    name: "password",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "role",
                    type: "enum",
                    enum: ["admin", "voter"]
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                },
                {
                    name: "updated_at",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                }
            ]
        }), true);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("users");
    }
}