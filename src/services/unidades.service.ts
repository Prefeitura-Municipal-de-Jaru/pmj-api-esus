import { UnidadesRepository } from '../repositories/unidades.repository.js';
import { UnidadeSaude } from '../types/unidade.js';

export class UnidadesService {
  constructor(private readonly repository = new UnidadesRepository()) {}

  async getUnidades(): Promise<UnidadeSaude[]> {
    return this.repository.findAll();
  }
}
