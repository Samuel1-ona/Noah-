import { ethers, JsonRpcProvider, Wallet } from 'ethers';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * RelayerService — singleton funded wallet that signs and broadcasts
 * all on-chain transactions on behalf of users (gasless flow).
 *
 * Nonce management uses a serialised promise lock to prevent collisions
 * under concurrent requests.
 */
export class RelayerService {
  private wallet: Wallet;
  private provider: JsonRpcProvider;
  private nonceLock: Promise<void> = Promise.resolve();

  constructor() {
    this.provider = new JsonRpcProvider(config.rpcUrl);
    // Private key is loaded once at startup and never logged
    this.wallet = new Wallet(config.relayerPrivateKey, this.provider);
    logger.info(`[Relayer] Wallet loaded`, { address: this.wallet.address });
  }

  get address(): string {
    return this.wallet.address;
  }

  get signer(): Wallet {
    return this.wallet;
  }

  /** Returns current ETH balance of the relayer wallet in ETH (not wei). */
  async getBalanceEth(): Promise<string> {
    const wei = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(wei);
  }

  /** Warns if relayer balance drops below the configured minimum. */
  async checkBalance(): Promise<void> {
    const balEth = parseFloat(await this.getBalanceEth());
    if (balEth < config.relayerMinBalanceEth) {
      logger.warn(`[Relayer] Low balance warning`, {
        balance: `${balEth} ETH`,
        minimum: `${config.relayerMinBalanceEth} ETH`,
      });
    }
  }

  /**
   * Send a transaction, serialising nonce acquisition to avoid race conditions
   * under concurrent load. Applies a 20 % gas buffer.
   */
  async sendTransaction(
    txRequest: ethers.TransactionRequest
  ): Promise<ethers.TransactionResponse> {
    let resolve!: () => void;
    const prev = this.nonceLock;
    this.nonceLock = new Promise((r) => (resolve = r));

    await prev; // wait for any in-flight tx to acquire its nonce first

    try {
      const nonce = await this.provider.getTransactionCount(
        this.wallet.address,
        'pending'
      );
      const gas = await this.provider.estimateGas({
        ...txRequest,
        from: this.wallet.address,
      });
      const gasLimit = (gas * 120n) / 100n; // 20 % buffer

      logger.debug(`[Relayer] Sending transaction`, { nonce, gasLimit: gasLimit.toString() });

      const tx = await this.wallet.sendTransaction({ ...txRequest, nonce, gasLimit });

      logger.info(`[Relayer] Transaction broadcast`, { hash: tx.hash, nonce });
      return tx;
    } finally {
      resolve();
    }
  }

  getProvider(): JsonRpcProvider {
    return this.provider;
  }
}

// Singleton — imported by all route modules
export const relayer = new RelayerService();
