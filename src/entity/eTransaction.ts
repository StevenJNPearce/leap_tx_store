import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class eTransaction {
  @PrimaryColumn({
    length: 64
  })
  hash: string;
  
  @Column({
    length: 42,
    nullable: true
  })
  from: string;

  @Column({
    length: 42,
    nullable: true
  })
  to: string;

  @Column()
  color: number;

  @Column()
  blockNumber: number;
}