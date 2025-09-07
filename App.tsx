import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';

type Op = '+' | '-' | '×' | '÷';

export default function App() {
  const [display, setDisplay] = useState<string>('0');
  const [tokens, setTokens] = useState<Array<number | Op>>([]);
  const [lastInput, setLastInput] = useState<'digit' | 'operator' | 'equals'>('digit');
  const [hasDecimal, setHasDecimal] = useState<boolean>(false);

  const formattedDisplay = useMemo(() => {
    // Keep as-is if a trailing dot
    if (display.endsWith('.')) return display;
    // Format number with minimal processing
    const num = Number(display);
    if (!Number.isFinite(num)) return 'Errore';
    return display;
  }, [display]);

  function handleDigit(d: string) {
    if (lastInput === 'equals') {
      // start new calculation
      setTokens([]);
      setHasDecimal(false);
      setDisplay(d);
      setLastInput('digit');
      return;
    }
    setDisplay((prev) => {
      if (prev === '0') return d;
      return prev + d;
    });
    setLastInput('digit');
  }

  function handleDot() {
    if (lastInput === 'equals') {
      setTokens([]);
      setDisplay('0.');
      setHasDecimal(true);
      setLastInput('digit');
      return;
    }
    if (!hasDecimal) {
      setDisplay((prev) => (prev === '' ? '0.' : prev + '.'));
      setHasDecimal(true);
      setLastInput('digit');
    }
  }

  function handleOperator(op: Op) {
    setTokens((prev) => {
      const next = [...prev];
      if (lastInput === 'operator' && next.length > 0) {
        // Replace last operator
        next[next.length - 1] = op;
        return next;
      }
      // Push current number then operator
      const value = Number(display);
      if (Number.isFinite(value)) {
        next.push(value);
        next.push(op);
      }
      return next;
    });
    setDisplay('0');
    setHasDecimal(false);
    setLastInput('operator');
  }

  function evaluate(expr: Array<number | Op>): number | null {
    if (expr.length === 0) return Number(display);
    // If ends with operator, drop it
    const arr = [...expr];
    if (typeof arr[arr.length - 1] !== 'number') arr.pop();

    // First pass: handle × and ÷
    const pass1: Array<number | Op> = [];
    let i = 0;
    while (i < arr.length) {
      const token = arr[i];
      if (token === '×' || token === '÷') {
        const a = pass1.pop();
        const b = arr[i + 1];
        if (typeof a !== 'number' || typeof b !== 'number') return null;
        if (token === '÷' && b === 0) return null;
        const val = token === '×' ? a * b : a / b;
        pass1.push(val);
        i += 2;
        continue;
      }
      pass1.push(token as any);
      i += 1;
    }

    // Second pass: handle + and -
    let result: number | null = null;
    i = 0;
    while (i < pass1.length) {
      const token = pass1[i];
      if (typeof token === 'number') {
        if (result === null) result = token;
        else result = token; // should not hit
        i += 1;
        continue;
      }
      const op = token as Op;
      const b = pass1[i + 1];
      if (typeof b !== 'number' || result === null) return null;
      if (op === '+') result = result + b;
      else if (op === '-') result = result - b;
      i += 2;
    }
    return result ?? 0;
  }

  function handleEquals() {
    const expr = [...tokens];
    const current = Number(display);
    if (Number.isFinite(current)) expr.push(current);
    const val = evaluate(expr);
    if (val === null || !Number.isFinite(val)) {
      setDisplay('Errore');
      setTokens([]);
      setHasDecimal(false);
      setLastInput('equals');
      return;
    }
    // Keep up to 10 decimal digits, trim trailing zeros
    const text = String(parseFloat(Number(val.toFixed(10)).toString()));
    setDisplay(text);
    setTokens([]);
    setHasDecimal(text.includes('.'));
    setLastInput('equals');
  }

  function handleClear() {
    setDisplay('0');
    setTokens([]);
    setHasDecimal(false);
    setLastInput('digit');
  }

  function handleBackspace() {
    if (lastInput === 'equals') {
      // after equals, backspace behaves like clear last digit
    }
    setDisplay((prev) => {
      if (prev === '0') return '0';
      const next = prev.slice(0, -1);
      const result = next.length === 0 ? '0' : next;
      setHasDecimal(result.includes('.'));
      return result;
    });
    setLastInput('digit');
  }

  return (
    <View style={styles.container}>
      <View style={styles.displayContainer}>
        <Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit>
          {formattedDisplay}
        </Text>
      </View>

      <View style={styles.row}>
        <CalcButton label="C" onPress={handleClear} variant="accent" />
        <CalcButton label="⌫" onPress={handleBackspace} variant="accent" />
        <CalcButton label="÷" onPress={() => handleOperator('÷')} variant="operator" />
        <CalcButton label="×" onPress={() => handleOperator('×')} variant="operator" />
      </View>
      <View style={styles.row}>
        <CalcButton label="7" onPress={() => handleDigit('7')} />
        <CalcButton label="8" onPress={() => handleDigit('8')} />
        <CalcButton label="9" onPress={() => handleDigit('9')} />
        <CalcButton label="-" onPress={() => handleOperator('-')} variant="operator" />
      </View>
      <View style={styles.row}>
        <CalcButton label="4" onPress={() => handleDigit('4')} />
        <CalcButton label="5" onPress={() => handleDigit('5')} />
        <CalcButton label="6" onPress={() => handleDigit('6')} />
        <CalcButton label="+" onPress={() => handleOperator('+')} variant="operator" />
      </View>
      <View style={styles.row}>
        <CalcButton label="1" onPress={() => handleDigit('1')} />
        <CalcButton label="2" onPress={() => handleDigit('2')} />
        <CalcButton label="3" onPress={() => handleDigit('3')} />
        <CalcButton label="=" onPress={handleEquals} variant="equals" />
      </View>
      <View style={styles.row}>
        <CalcButton label="0" onPress={() => handleDigit('0')} span={2} />
        <CalcButton label="." onPress={handleDot} />
        <CalcButton label="=" onPress={handleEquals} variant="equals" />
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

type ButtonVariant = 'default' | 'operator' | 'equals' | 'accent';

function CalcButton({
  label,
  onPress,
  variant = 'default',
  span = 1,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  span?: 1 | 2;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        span === 2 && styles.keyDouble,
        variant === 'operator' && styles.keyOperator,
        variant === 'equals' && styles.keyEquals,
        variant === 'accent' && styles.keyAccent,
        pressed && styles.keyPressed,
      ]}
    >
      <Text style={styles.keyText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 48,
    paddingHorizontal: 12,
  },
  displayContainer: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    paddingBottom: 16,
    borderBottomColor: '#2a2a2a',
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  displayText: {
    color: '#ffffff',
    fontSize: 56,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  key: {
    flex: 1,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#1e1e1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyDouble: {
    flex: 2,
  },
  keyText: {
    color: '#f5f5f5',
    fontSize: 22,
    fontWeight: '600',
  },
  keyOperator: {
    backgroundColor: '#2b3a67',
  },
  keyEquals: {
    backgroundColor: '#4a7c59',
  },
  keyAccent: {
    backgroundColor: '#6b2d5c',
  },
  keyPressed: {
    opacity: 0.75,
  },
});
