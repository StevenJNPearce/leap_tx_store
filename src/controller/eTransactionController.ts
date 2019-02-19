import { getRepository } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { eTransaction } from '../entity/eTransaction';

export class eTransactionController {

  private repository = getRepository(eTransaction);

  async from(request: Request, response: Response, next: NextFunction) {
    return this.repository.createQueryBuilder('tx')
      .where('tx.from = :from', { from: request.params.from.toLowerCase() })
      .skip(request.params.offset)
      .take(request.params.limit)
      .getMany();
  }

  async to(request: Request, response: Response, next: NextFunction) {
    return this.repository.createQueryBuilder('tx')
      .where('tx.to = :to', { to: request.params.to.toLowerCase() })
      .skip(request.params.offset)
      .take(request.params.limit)
      .getMany();
  }

  async color(request: Request, response: Response, next: NextFunction) {
    return this.repository.createQueryBuilder('tx')
      .where('tx.color = :color', { color: request.params.color })
      .skip(request.params.offset)
      .take(request.params.limit)
      .getMany();
  }
}