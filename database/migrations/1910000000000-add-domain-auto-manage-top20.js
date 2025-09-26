// Migration: Adds auto_manage_top20 flag to domain table for automatic Top 20 management.

module.exports = {
   up: async (queryInterface, Sequelize) => {
      return queryInterface.sequelize.transaction(async (t) => {
         try {
            const domainTableDefinition = await queryInterface.describeTable('domain');
            if (domainTableDefinition && !domainTableDefinition.auto_manage_top20) {
               await queryInterface.addColumn(
                  'domain',
                  'auto_manage_top20',
                  { type: Sequelize.DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
                  { transaction: t },
               );
            }
         } catch (error) {
            console.log('error :', error);
         }
      });
   },
   down: (queryInterface) => {
      return queryInterface.sequelize.transaction(async (t) => {
         try {
            const domainTableDefinition = await queryInterface.describeTable('domain');
            if (domainTableDefinition && domainTableDefinition.auto_manage_top20) {
               await queryInterface.removeColumn('domain', 'auto_manage_top20', { transaction: t });
            }
         } catch (error) {
            console.log('error :', error);
         }
      });
   },
};
