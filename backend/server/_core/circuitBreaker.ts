/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures when external services are down
 */

import { logger } from "./logger";

export enum CircuitState {
  CLOSED = "CLOSED",     // Normal operation
  OPEN = "OPEN",         // Failing, reject requests immediately
  HALF_OPEN = "HALF_OPEN" // Testing if service recovered
}

interface CircuitBreakerOptions {
  name: string;
  failureThreshold?: number;    // Number of failures before opening
  successThreshold?: number;    // Successes needed to close from half-open
  timeout?: number;             // Time in ms before trying again (half-open)
}

interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  nextAttemptTime: number | null;
}

const circuits = new Map<string, CircuitBreakerState>();

function getOrCreateCircuit(name: string): CircuitBreakerState {
  if (!circuits.has(name)) {
    circuits.set(name, {
      state: CircuitState.CLOSED,
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      nextAttemptTime: null,
    });
  }
  return circuits.get(name)!;
}

export class CircuitBreaker {
  private name: string;
  private failureThreshold: number;
  private successThreshold: number;
  private timeout: number;

  constructor(options: CircuitBreakerOptions) {
    this.name = options.name;
    this.failureThreshold = options.failureThreshold ?? 5;
    this.successThreshold = options.successThreshold ?? 2;
    this.timeout = options.timeout ?? 30000; // 30 seconds default
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const circuit = getOrCreateCircuit(this.name);

    // Check if circuit is OPEN
    if (circuit.state === CircuitState.OPEN) {
      if (Date.now() >= (circuit.nextAttemptTime ?? 0)) {
        // Transition to HALF_OPEN
        circuit.state = CircuitState.HALF_OPEN;
        circuit.successes = 0;
        logger.info(`Circuit ${this.name} transitioning to HALF_OPEN`);
      } else {
        throw new Error(`Circuit ${this.name} is OPEN. Service unavailable.`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess(circuit);
      return result;
    } catch (error) {
      this.onFailure(circuit);
      throw error;
    }
  }

  private onSuccess(circuit: CircuitBreakerState): void {
    if (circuit.state === CircuitState.HALF_OPEN) {
      circuit.successes++;
      if (circuit.successes >= this.successThreshold) {
        circuit.state = CircuitState.CLOSED;
        circuit.failures = 0;
        circuit.successes = 0;
        logger.info(`Circuit ${this.name} CLOSED - service recovered`);
      }
    } else if (circuit.state === CircuitState.CLOSED) {
      // Reset failure count on success
      circuit.failures = 0;
    }
  }

  private onFailure(circuit: CircuitBreakerState): void {
    circuit.failures++;
    circuit.lastFailureTime = Date.now();

    if (circuit.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open goes back to open
      circuit.state = CircuitState.OPEN;
      circuit.nextAttemptTime = Date.now() + this.timeout;
      logger.warn(`Circuit ${this.name} OPEN - service still failing`);
    } else if (circuit.failures >= this.failureThreshold) {
      circuit.state = CircuitState.OPEN;
      circuit.nextAttemptTime = Date.now() + this.timeout;
      logger.warn(`Circuit ${this.name} OPEN - threshold reached (${circuit.failures} failures)`);
    }
  }

  getState(): CircuitState {
    return getOrCreateCircuit(this.name).state;
  }

  getStats(): { state: CircuitState; failures: number; successes: number } {
    const circuit = getOrCreateCircuit(this.name);
    return {
      state: circuit.state,
      failures: circuit.failures,
      successes: circuit.successes,
    };
  }

  // Manual reset for admin/testing
  reset(): void {
    const circuit = getOrCreateCircuit(this.name);
    circuit.state = CircuitState.CLOSED;
    circuit.failures = 0;
    circuit.successes = 0;
    circuit.lastFailureTime = null;
    circuit.nextAttemptTime = null;
    logger.info(`Circuit ${this.name} manually reset`);
  }
}

// Pre-configured circuit breakers for external services
export const stripeCircuit = new CircuitBreaker({
  name: "stripe",
  failureThreshold: 5,
  timeout: 60000, // 1 minute
});

export const supabaseCircuit = new CircuitBreaker({
  name: "supabase",
  failureThreshold: 5,
  timeout: 30000,
});

export const emailCircuit = new CircuitBreaker({
  name: "email",
  failureThreshold: 3,
  timeout: 120000, // 2 minutes - email services can be slow to recover
});
