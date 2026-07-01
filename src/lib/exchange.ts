const EXCHANGE_API = 'https://api.exchangerate-api.com/v4/latest/USD';

export async function fetchExchangeRate(): Promise<number> {
  try {
    const res = await fetch(EXCHANGE_API);
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    return data.rates?.INR ?? 84;
  } catch {
    return 84; // fallback
  }
}
