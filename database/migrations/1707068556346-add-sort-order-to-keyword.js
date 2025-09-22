// Migration: Adds sort_order column to keyword table for custom ordering.

module.exports = {
   up: async (queryInterface, Sequelize) => {
      return queryInterface.sequelize.transaction(async (t) => {
         try {
            const keywordTableDefinition = await queryInterface.describeTable('keyword');
            if (keywordTableDefinition && !keywordTableDefinition.sort_order) {
               await queryInterface.addColumn(
                  'keyword',
                  'sort_order',
                  { type: Sequelize.DataTypes.INTEGER, allowNull: true },
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
            const keywordTableDefinition = await queryInterface.describeTable('keyword');
            if (keywordTableDefinition && keywordTableDefinition.sort_order) {
               await queryInterface.removeColumn('keyword', 'sort_order', { transaction: t });
            }
         } catch (error) {
            console.log('error :', error);
         }
      });
   },
};
