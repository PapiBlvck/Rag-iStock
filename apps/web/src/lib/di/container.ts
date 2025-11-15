/**
 * Simple dependency injection container
 */
type Factory<T> = () => T;

class Container {
  private services = new Map<string, Factory<any>>();
  private instances = new Map<string, any>();

  /**
   * Register a service factory
   */
  register<T>(key: string, factory: Factory<T>, singleton: boolean = true): void {
    if (singleton) {
      this.services.set(key, () => {
        if (!this.instances.has(key)) {
          this.instances.set(key, factory());
        }
        return this.instances.get(key);
      });
    } else {
      this.services.set(key, factory);
    }
  }

  /**
   * Resolve a service instance
   */
  resolve<T>(key: string): T {
    const factory = this.services.get(key);
    if (!factory) {
      throw new Error(`Service "${key}" not found in container`);
    }
    return factory();
  }

  /**
   * Check if a service is registered
   */
  has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * Clear all registered services (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.instances.clear();
  }
}

// Export singleton instance
export const container = new Container();

// Export type for factory functions
export type { Factory };

