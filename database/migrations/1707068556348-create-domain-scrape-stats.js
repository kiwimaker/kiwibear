module.exports = {
   up: async (queryInterface, Sequelize) => {
      return queryInterface.sequelize.transaction(async (t) => {
         try {
            const tableDefinition = await queryInterface.describeTable('domain_scrape_stats').catch(() => null);
            if (!tableDefinition) {
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
                     defaultValue: Sequelize.fn('datetime', 'now'),
                  },
                  updatedAt: {
                     type: Sequelize.DataTypes.DATE,
                     allowNull: false,
                     defaultValue: Sequelize.fn('datetime', 'now'),
                  },
               }, { transaction: t });
               await queryInterface.addIndex('domain_scrape_stats', ['domain', 'date'], { unique: true, transaction: t });
            }
         } catch (error) {
            console.log('error :', error);
         }
      });
   },
   down: async (queryInterface) => {
      return queryInterface.sequelize.transaction(async (t) => {
         try {
            await queryInterface.dropTable('domain_scrape_stats', { transaction: t });
         } catch (error) {
            console.log('error :', error);
         }
      });
   },
};
