import { describe, expect, it } from 'vitest';
import { formatCurrency, maskCurrency, parseMoney } from './currency';

// ── formatCurrency ────────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats an integer value in BRL', () => {
    const result = formatCurrency(1000);
    expect(result).toContain('R$');
    expect(result).toContain('1.000');
  });

  it('formats decimal values correctly', () => {
    expect(formatCurrency(1234.56)).toContain('1.234,56');
  });

  it('formats zero as R$ 0,00', () => {
    expect(formatCurrency(0)).toContain('0,00');
  });

  it('formats large values', () => {
    const result = formatCurrency(1_000_000);
    expect(result).toContain('1.000.000');
  });

  it('formats negative values', () => {
    expect(formatCurrency(-500)).toContain('-');
    expect(formatCurrency(-500)).toContain('500');
  });
});

// ── parseMoney ────────────────────────────────────────────────────────────────

describe('parseMoney', () => {
  it('returns 0 for empty string', () => {
    expect(parseMoney('')).toBe(0);
  });

  it('parses Brazilian decimal format (1.234,56)', () => {
    expect(parseMoney('1.234,56')).toBe(1234.56);
  });

  it('parses integer string', () => {
    expect(parseMoney('3500')).toBe(3500);
  });

  it('strips currency symbol R$', () => {
    expect(parseMoney('R$ 1.000,00')).toBe(1000);
  });

  it('parses value with spaces', () => {
    expect(parseMoney('  500,00  ')).toBe(500);
  });

  it('handles decimal-only input', () => {
    expect(parseMoney(',50')).toBe(0.5);
  });

  it('parses value with thousand separator only', () => {
    expect(parseMoney('1.000')).toBe(1000);
  });
});

// ── maskCurrency ──────────────────────────────────────────────────────────────

describe('maskCurrency', () => {
  it('returns empty string for empty input', () => {
    expect(maskCurrency('')).toBe('');
  });

  it('formats 1 as 0,01', () => {
    expect(maskCurrency('1')).toBe('0,01');
  });

  it('formats 100 as 1,00', () => {
    expect(maskCurrency('100')).toBe('1,00');
  });

  it('formats 350000 as 3.500,00', () => {
    expect(maskCurrency('350000')).toBe('3.500,00');
  });

  it('ignores non-digit characters', () => {
    expect(maskCurrency('abc')).toBe('');
  });

  it('strips letters and formats digits only', () => {
    expect(maskCurrency('R$123')).toBe('1,23');
  });

  it('handles existing formatted input (strips non-digits)', () => {
    // '1.234,56' → digits '123456' → cents 1234.56 → '1.234,56'
    expect(maskCurrency('1.234,56')).toBe('1.234,56');
  });
});
