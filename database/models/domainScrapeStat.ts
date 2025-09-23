import {
   Table,
   Model,
   Column,
   DataType,
   PrimaryKey,
   AutoIncrement,
   AllowNull,
   Unique,
} from 'sequelize-typescript';

@Table({
  timestamps: true,
  tableName: 'domain_scrape_stats',
})
class DomainScrapeStat extends Model {
   @PrimaryKey
   @AutoIncrement
   @Column({ type: DataType.INTEGER })
   ID!: number;

   @AllowNull(false)
   @Column({ type: DataType.STRING })
   domain!: string;

   @AllowNull(false)
   @Unique('domain_day')
   @Column({ type: DataType.DATEONLY })
   date!: string;

   @AllowNull(false)
   @Column({ type: DataType.INTEGER, defaultValue: 0 })
   count!: number;
}

export default DomainScrapeStat;
