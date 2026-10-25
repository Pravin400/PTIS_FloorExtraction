import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock next-intl hooks
vi.mock('next-intl', () => ({
  useTranslations: () => ((key: string) => {
    if (key === 'goHome') return 'Go Home';
    if (key === 'tryAgain') return 'Try Again';
    if (key === 'title') return 'Error Title';
    if (key === 'description') return 'Error Description';
    if (key === 'errorId') return 'Error ID: {id}';
    return key;
  }),
  useLocale: () => 'en',
}));

import { ErrorPage } from '../../../components/common/ErrorPage';

describe('ErrorPage', () => {
  const error = new Error('Test error message');
  const reset = vi.fn();
  let consoleSpy: MockInstance;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders translated title and description fallback when message is empty', () => {
    const emptyError = new Error('');
    render(
      <ErrorPage error={emptyError} reset={reset} translationNamespace="common.error" />
    );
    // These keys should be present in the translation mock or config
    expect(screen.getByText(/title/i)).toBeInTheDocument();
    expect(screen.getByText(/description/i)).toBeInTheDocument();
  });

  it('renders error message when provided', () => {
    render(
      <ErrorPage error={error} reset={reset} translationNamespace="common.error" />
    );
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('renders fallback description when error message contains react.dev/errors url', () => {
    const reactUrlError = new Error('An error occurred in the Server Component, rendered at https://react.dev/errors/441');
    render(
      <ErrorPage error={reactUrlError} reset={reset} translationNamespace="common.error" />
    );
    expect(screen.getByText('Error Description')).toBeInTheDocument();
    expect(screen.queryByText(/react\.dev/i)).not.toBeInTheDocument();
  });

  it('renders fallback description when error message contains network or timeout failure', () => {
    const fetchError = new Error('TypeError: fetch failed');
    render(
      <ErrorPage error={fetchError} reset={reset} translationNamespace="common.error" />
    );
    expect(screen.getByText('Error Description')).toBeInTheDocument();
  });

  it('calls reset when Try Again is clicked', () => {
    render(
      <ErrorPage error={error} reset={reset} translationNamespace="common.error" />
    );
    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(tryAgainButton);
    expect(reset).toHaveBeenCalled();
  });
});
