import {
   Table,
   Model,
   Column,
   DataType,
   PrimaryKey,
   AutoIncrement,
   AllowNull,
} from 'sequelize-typescript';

@Table({
  timestamps: true,
  tableName: 'domain_scrape_logs',
})
class DomainScrapeLog extends Model {
   @PrimaryKey
   @AutoIncrement
   @Column({ type: DataType.INTEGER })
   ID!: number;

   @AllowNull(false)
   @Column({ type: DataType.STRING })
   domain!: string;

   @AllowNull(true)
   @Column({ type: DataType.STRING })
   keyword!: string | null;

   @AllowNull(false)
   @Column({ type: DataType.STRING })
   status!: string;

   @AllowNull(false)
   @Column({ type: DataType.INTEGER, defaultValue: 1 })
   requests!: number;

   @AllowNull(false)
   @Column({ type: DataType.STRING, defaultValue: '' })
   message!: string;

   @AllowNull(true)
   @Column({ type: DataType.TEXT })
   details!: string | null;
}

export default DomainScrapeLog;
