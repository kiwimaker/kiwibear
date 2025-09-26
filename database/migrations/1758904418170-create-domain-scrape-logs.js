module.exports = {
   up: async (queryInterface, Sequelize) => {
      return queryInterface.sequelize.transaction(async (t) => {
         try {
            const tableDefinition = await queryInterface.describeTable('domain_scrape_logs').catch(() => null);
            if (!tableDefinition) {
               await queryInterface.createTable('domain_scrape_logs', {
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
                  keyword: {
                     type: Sequelize.DataTypes.STRING,
                     allowNull: true,
                  },
                  status: {
                     type: Sequelize.DataTypes.STRING,
                     allowNull: false,
                     defaultValue: 'success',
                  },
                  requests: {
                     type: Sequelize.DataTypes.INTEGER,
                     allowNull: false,
                     defaultValue: 1,
                  },
                  message: {
                     type: Sequelize.DataTypes.STRING,
                     allowNull: false,
                     defaultValue: '',
                  },
                  details: {
                     type: Sequelize.DataTypes.TEXT,
                     allowNull: true,
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
               await queryInterface.addIndex('domain_scrape_logs', ['domain', 'createdAt'], { transaction: t });
               await queryInterface.addIndex('domain_scrape_logs', ['createdAt'], { transaction: t });
            }
         } catch (error) {
            console.log('error :', error);
         }
      });
   },
   down: async (queryInterface) => {
      return queryInterface.sequelize.transaction(async (t) => {
         try {
            await queryInterface.dropTable('domain_scrape_logs', { transaction: t });
         } catch (error) {
            console.log('error :', error);
         }
      });
   },
};
