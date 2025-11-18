/**
 * Metrics collection and tracking
 * Simple in-memory implementation with extension points for external metrics systems
 */

import { logger } from './logger';

export enum MetricType {
  COUNTER = 'counter',
  HISTOGRAM = 'histogram',
  GAUGE = 'gauge',
}

interface MetricEntry {
  name: string;
  type: MetricType;
  value: number;
  labels?: Record<string, string>;
  timestamp: string;
}

interface CounterMetric {
  count: number;
  labels?: Record<string, string>;
}

interface HistogramMetric {
  values: number[];
  labels?: Record<string, string>;
}

interface GaugeMetric {
  value: number;
  labels?: Record<string, string>;
}

class Metrics {
  private counters: Map<string, CounterMetric> = new Map();
  private histograms: Map<string, HistogramMetric> = new Map();
  private gauges: Map<string, GaugeMetric> = new Map();
  private enabled: boolean = true;

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    if (!this.enabled) return;

    const key = this.getMetricKey(name, labels);
    const existing = this.counters.get(key);

    if (existing) {
      existing.count += value;
    } else {
      this.counters.set(key, { count: value, labels });
    }

    this.recordMetric({
      name,
      type: MetricType.COUNTER,
      value,
      labels,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Record a histogram value (for tracking distributions like duration, size, etc.)
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    if (!this.enabled) return;

    const key = this.getMetricKey(name, labels);
    const existing = this.histograms.get(key);

    if (existing) {
      existing.values.push(value);
      // Keep only last 1000 values to prevent memory issues
      if (existing.values.length > 1000) {
        existing.values.shift();
      }
    } else {
      this.histograms.set(key, { values: [value], labels });
    }

    this.recordMetric({
      name,
      type: MetricType.HISTOGRAM,
      value,
      labels,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Set a gauge value (for tracking current state like active sessions, queue size, etc.)
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    if (!this.enabled) return;

    const key = this.getMetricKey(name, labels);
    this.gauges.set(key, { value, labels });

    this.recordMetric({
      name,
      type: MetricType.GAUGE,
      value,
      labels,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get counter value
   */
  getCounter(name: string, labels?: Record<string, string>): number {
    const key = this.getMetricKey(name, labels);
    return this.counters.get(key)?.count || 0;
  }

  /**
   * Get histogram statistics
   */
  getHistogramStats(name: string, labels?: Record<string, string>): {
    count: number;
    min: number;
    max: number;
    mean: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const key = this.getMetricKey(name, labels);
    const histogram = this.histograms.get(key);

    if (!histogram || histogram.values.length === 0) {
      return null;
    }

    const sorted = [...histogram.values].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      count,
      min: sorted[0],
      max: sorted[count - 1],
      mean: sum / count,
      p50: sorted[Math.floor(count * 0.5)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)],
    };
  }

  /**
   * Get gauge value
   */
  getGauge(name: string, labels?: Record<string, string>): number | null {
    const key = this.getMetricKey(name, labels);
    return this.gauges.get(key)?.value ?? null;
  }

  /**
   * Get all metrics as a snapshot
   */
  getSnapshot(): {
    counters: Record<string, CounterMetric>;
    histograms: Record<string, { stats: ReturnType<typeof this.getHistogramStats> }>;
    gauges: Record<string, GaugeMetric>;
  } {
    const snapshot: {
      counters: Record<string, CounterMetric>;
      histograms: Record<string, { stats: ReturnType<typeof this.getHistogramStats> }>;
      gauges: Record<string, GaugeMetric>;
    } = {
      counters: {},
      histograms: {},
      gauges: {},
    };

    this.counters.forEach((value, key) => {
      snapshot.counters[key] = value;
    });

    this.histograms.forEach((value, key) => {
      snapshot.histograms[key] = { stats: this.getHistogramStats(value.labels?.name || key) };
    });

    this.gauges.forEach((value, key) => {
      snapshot.gauges[key] = value;
    });

    return snapshot;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters.clear();
    this.histograms.clear();
    this.gauges.clear();
    logger.info('Metrics reset');
  }

  /**
   * Enable/disable metrics collection
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    logger.info(`Metrics ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Generate a unique key for a metric with labels
   */
  private getMetricKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }

    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');

    return `${name}{${labelStr}}`;
  }

  /**
   * Record metric (extension point for external systems)
   */
  private recordMetric(entry: MetricEntry): void {
    // In development, log metrics
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Metric recorded', {
        metric: entry.name,
        type: entry.type,
        value: entry.value,
        labels: entry.labels,
      });
    }

    // Extension point: Send to external metrics system (Prometheus, DataDog, etc.)
    // metricsAdapter?.record(entry);
  }
}

// Export singleton instance
export const metrics = new Metrics();

// Export class for creating new instances
export { Metrics };

// Common metric helpers
export const MetricNames = {
  // Session metrics
  SESSION_STARTED: 'sessions.started',
  SESSION_ENDED: 'sessions.ended',
  SESSION_DURATION: 'sessions.duration',
  SESSION_MESSAGE_COUNT: 'sessions.messages',

  // Goal metrics
  GOAL_CREATED: 'goals.created',
  GOAL_COMPLETED: 'goals.completed',
  GOAL_PROGRESS_UPDATED: 'goals.progress_updated',

  // Reflection metrics
  REFLECTION_CREATED: 'reflections.created',

  // Template metrics
  TEMPLATE_USED: 'templates.used',

  // LLM metrics
  LLM_REQUEST: 'llm.requests',
  LLM_DURATION: 'llm.duration',
  LLM_TOKENS: 'llm.tokens',
  LLM_ERROR: 'llm.errors',

  // API metrics
  API_REQUEST: 'api.requests',
  API_ERROR: 'api.errors',
  API_DURATION: 'api.duration',

  // System metrics
  ACTIVE_SESSIONS: 'system.active_sessions',
  ACTIVE_MEMBERS: 'system.active_members',
} as const;
