// Migration: Adds competitors column to domain table for storing competitor domains list.

module.exports = {
   up: async (queryInterface, Sequelize) => {
      return queryInterface.sequelize.transaction(async (t) => {
         try {
            const domainTableDefinition = await queryInterface.describeTable('domain');
            if (domainTableDefinition && !domainTableDefinition.competitors) {
               await queryInterface.addColumn(
                  'domain',
                  'competitors',
                  { type: Sequelize.DataTypes.STRING, allowNull: true, defaultValue: JSON.stringify([]) },
                  { transaction: t },
               );
            }
         } catch (error) {
            console.log('error :', error);
         }
      });
   },
   down: async (queryInterface) => {
      return queryInterface.sequelize.transaction(async (t) => {
         try {
            const domainTableDefinition = await queryInterface.describeTable('domain');
            if (domainTableDefinition && domainTableDefinition.competitors) {
               await queryInterface.removeColumn('domain', 'competitors', { transaction: t });
            }
         } catch (error) {
            console.log('error :', error);
         }
      });
   },
};
