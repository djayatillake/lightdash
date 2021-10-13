import { Knex } from 'knex';

const dashboardsTableName = 'dashboards';
const dashboardVersionsTableName = 'dashboard_versions';
const dashboardTilesTableName = 'dashboard_tiles';
const dashboardTileTypesTableName = 'dashboard_tile_types';
const dashboardTileChartTableName = 'dashboard_tile_charts';

export async function up(knex: Knex): Promise<void> {
    if (!(await knex.schema.hasTable(dashboardsTableName))) {
        await knex.schema.createTable(dashboardsTableName, (tableBuilder) => {
            tableBuilder.specificType(
                'dashboard_id',
                'INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY',
            );
            tableBuilder
                .integer('space_id')
                .references('space_id')
                .inTable('spaces')
                .notNullable()
                .onDelete('CASCADE');
            tableBuilder.text('name').notNullable();
            tableBuilder.text('description').notNullable();
            tableBuilder
                .timestamp('created_at', { useTz: false })
                .notNullable();
            tableBuilder
                .uuid('dashboard_uuid')
                .notNullable()
                .defaultTo(knex.raw('uuid_generate_v4()'));
        });
    }
    if (!(await knex.schema.hasTable(dashboardVersionsTableName))) {
        await knex.schema.createTable(
            dashboardVersionsTableName,
            (tableBuilder) => {
                tableBuilder.specificType(
                    'dashboard_version_id',
                    'INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY',
                );
                tableBuilder
                    .integer('dashboard_id')
                    .notNullable()
                    .references('dashboard_id')
                    .inTable(dashboardsTableName)
                    .onDelete('CASCADE');
                tableBuilder
                    .timestamp('created_at', { useTz: false })
                    .notNullable();
            },
        );
    }
    if (!(await knex.schema.hasTable(dashboardTileTypesTableName))) {
        await knex.schema.createTable(
            dashboardTileTypesTableName,
            (tableBuilder) => {
                tableBuilder.text('dashboard_tile_type').primary();
            },
        );
        await knex(dashboardTileTypesTableName).insert([
            { dashboard_tile_type: 'saved_chart' },
        ]);
    }
    if (!(await knex.schema.hasTable(dashboardTilesTableName))) {
        await knex.schema.createTable(
            dashboardTilesTableName,
            (tableBuilder) => {
                tableBuilder
                    .integer('dashboard_version_id')
                    .notNullable()
                    .references('dashboard_version_id')
                    .inTable('dashboard_versions')
                    .onDelete('CASCADE');
                tableBuilder.specificType(
                    'rank',
                    'INTEGER NOT NULL CHECK(rank > 0)',
                );
                tableBuilder.primary(['dashboard_version_id', 'rank']);
                tableBuilder
                    .text('type')
                    .notNullable()
                    .references('dashboard_tile_type')
                    .inTable(dashboardTileTypesTableName)
                    .onDelete('RESTRICT');
                tableBuilder.float('x_offset').notNullable();
                tableBuilder.float('y_offset').notNullable();
                tableBuilder.float('height').notNullable();
                tableBuilder.float('width').notNullable();
            },
        );
    }
    if (!(await knex.schema.hasTable(dashboardTileChartTableName))) {
        await knex.schema.createTable(
            dashboardTileChartTableName,
            (tableBuilder) => {
                tableBuilder.integer('dashboard_version_id').notNullable();
                tableBuilder.integer('rank').notNullable();
                tableBuilder.primary(['dashboard_version_id', 'rank']);
                tableBuilder
                    .foreign(['dashboard_version_id', 'rank'])
                    .references(['dashboard_version_id', 'rank'])
                    .inTable(dashboardTilesTableName)
                    .onDelete('CASCADE');
                tableBuilder
                    .integer('saved_chart_id')
                    .nullable()
                    .references('saved_query_id')
                    .inTable('saved_queries')
                    .onDelete('SET NULL');
            },
        );
    }
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists(dashboardTileChartTableName);
    await knex.schema.dropTableIfExists(dashboardTilesTableName);
    await knex.schema.dropTableIfExists(dashboardTileTypesTableName);
    await knex.schema.dropTableIfExists(dashboardVersionsTableName);
    await knex.schema.dropTableIfExists(dashboardsTableName);
}