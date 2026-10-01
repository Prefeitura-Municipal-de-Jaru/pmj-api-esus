/**
 * API Fila de Espera das UBS (e-SUS APS PEC)
 * 
 * Propriedade: Prefeitura Municipal de Jaru - RO
 * Departamento: Departamento de Tecnologia da Informação (DTI)
 * Desenvolvedor: Daniel Beling
 * 
 * Licença: MIT (Obrigatório manter a atribuição e créditos originais)
 */

import { createApp } from './app.js';
import { env } from './config/env.js';
import { pool, checkDatabaseConnection } from './config/database.js';

async function bootstrap(): Promise<void> {
  const app = createApp();

  const server = app.listen(env.PORT, async () => {
    console.log(`[Server]: Servidor iniciado com sucesso na porta ${env.PORT} em modo ${env.NODE_ENV}`);
    try {
      const isConnected = await checkDatabaseConnection();
      if (isConnected) {
        console.log('[Database]: Conexao com a base de dados do e-SUS PEC estabelecida com sucesso.');
      } else {
        console.warn('[Database Warning]: Nao foi possivel confirmar a conexao com o banco de dados.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[Database Error]: Falha ao conectar na base do e-SUS PEC:', errorMessage);
    }
  });

  const handleShutdown = async (signal: string) => {
    console.log(`[Server]: Sinal ${signal} recebido. Encerrando servicos de forma graciosa...`);
    server.close(async () => {
      console.log('[Server]: Servidor HTTP encerrado.');
      try {
        await pool.end();
        console.log('[Database]: Pool de conexoes do banco encerrada.');
        process.exit(0);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('[Database Error]: Erro ao encerrar pool de conexoes:', errorMessage);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

bootstrap().catch((err: unknown) => {
  const errorMessage = err instanceof Error ? err.message : String(err);
  console.error('[Fatal Error]: Falha fatal na inicializacao do servidor:', errorMessage);
  process.exit(1);
});
