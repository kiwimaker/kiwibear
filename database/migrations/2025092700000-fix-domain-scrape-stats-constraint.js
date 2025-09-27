module.exports = {
   up: async (queryInterface, Sequelize) => {
      return queryInterface.sequelize.transaction(async (t) => {
         try {
            // Check if table exists
            const tableDefinition = await queryInterface.describeTable('domain_scrape_stats').catch(() => null);
            if (!tableDefinition) {
               console.log('domain_scrape_stats table does not exist');
               return;
            }

            // SQLite doesn't support DROP CONSTRAINT, so we need to recreate the table
            // First, backup existing data
            await queryInterface.sequelize.query(
               'CREATE TABLE domain_scrape_stats_backup AS SELECT * FROM domain_scrape_stats',
               { transaction: t }
            );

            // Drop the old table
            await queryInterface.dropTable('domain_scrape_stats', { transaction: t });

            // Create new table with correct constraint
            await queryInterface.createTable('domain_scrape_stats', {
               ID: {
                  type: Sequelize.DataTypes.INTEGER,
                  primaryKey: true,
                  allowNull: false,
                  autoIncrement: true,
               },
               domain: {
                  type: Sequelize.DataTypes.STRING,
                  allowNull: false,
               },
               date: {
                  type: Sequelize.DataTypes.DATEONLY,
                  allowNull: false,
               },
               count: {
                  type: Sequelize.DataTypes.INTEGER,
                  allowNull: false,
                  defaultValue: 0,
               },
               createdAt: {
                  type: Sequelize.DataTypes.DATE,
                  allowNull: false,
                  defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
               },
               updatedAt: {
                  type: Sequelize.DataTypes.DATE,
                  allowNull: false,
                  defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
               },
            }, { transaction: t });

            // Add composite unique index on domain and date
            await queryInterface.addIndex('domain_scrape_stats', ['domain', 'date'], {
               unique: true,
               name: 'domain_scrape_stats_domain_date_unique',
               transaction: t
            });

            // Restore data (only unique domain+date combinations)
            await queryInterface.sequelize.query(
               `INSERT INTO domain_scrape_stats (domain, date, count, createdAt, updatedAt)
                SELECT domain, date, MAX(count) as count, MIN(createdAt) as createdAt, MAX(updatedAt) as updatedAt
                FROM domain_scrape_stats_backup
                GROUP BY domain, date`,
               { transaction: t }
            );

            // Drop backup table
            await queryInterface.sequelize.query(
               'DROP TABLE domain_scrape_stats_backup',
               { transaction: t }
            );

            console.log('Successfully fixed domain_scrape_stats constraint');
         } catch (error) {
            console.log('Error fixing domain_scrape_stats constraint:', error);
            throw error;
         }
      });
   },

   down: async (queryInterface, Sequelize) => {
      // Reverting would recreate the incorrect constraint, so we'll leave it as-is
      console.log('Cannot revert to incorrect unique constraint');
      return Promise.resolve();
   },
};