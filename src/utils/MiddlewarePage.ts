/* eslint-disable max-classes-per-file */
import type Middleware from '../Middleware.js';
import { BaseError } from './errors.js';

interface MiddlewareRawPage<T = unknown> {
  data: T[];
  next: string | null;
  prev: string | null;
}

export function isMiddlewareRawPage(maybePage: unknown): maybePage is MiddlewareRawPage {
  const testPage = maybePage as MiddlewareRawPage;
  return (
    testPage?.data != null &&
    Array.isArray(testPage.data) &&
    'next' in testPage &&
    'prev' in testPage
  );
}

/**
 * @category exception
 */
export class MiddlewarePageMissed extends BaseError {
  constructor(isNext: boolean) {
    super(`There is no ${isNext ? 'next' : 'previous'} page`);
    this.name = 'MiddlewarePageMissed';
  }
}

/**
 * A wrapper around the middleware's page allowing to get the next/previous pages.
 */
export class MiddlewarePage<Item> {
  readonly data: Item[];

  readonly nextPath: null | string;

  readonly prevPath: null | string;

  readonly #middleware: Middleware;

  constructor(rawPage: MiddlewareRawPage<Item>, middleware: Middleware) {
    this.data = rawPage.data;
    this.nextPath = rawPage.next;
    this.prevPath = rawPage.prev;
    this.#middleware = middleware;
  }

  /**
   * Get the next page.
   * Check the presence of `nextPath` to not fall outside existing pages.
   * @throws MiddlewarePageMissed
   */
  async next(): Promise<MiddlewarePage<Item>> {
    if (this.nextPath == null) throw new MiddlewarePageMissed(true);
    return this.#middleware.requestByPath(this.nextPath);
  }

  /**
   * Get the previous page.
   * Check the presence of `prevPath` to not fall outside existing pages.
   * @throws MiddlewarePageMissed
   */
  async prev(): Promise<MiddlewarePage<Item>> {
    if (this.prevPath == null) throw new MiddlewarePageMissed(false);
    return this.#middleware.requestByPath(this.prevPath);
  }
}
