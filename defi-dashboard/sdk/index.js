export const SUPPORTED_CHAINS = [
  { id: 'ethereum',  name: 'Ethereum',  symbol: 'ETH',  encoding: 'ABI',      color: '#627eea', live: true  },
  { id: 'solana',    name: 'Solana',    symbol: 'SOL',  encoding: 'Borsh',    color: '#9945ff', live: true  },
  { id: 'cosmos',    name: 'Cosmos',    symbol: 'ATOM', encoding: 'Protobuf', color: '#6f7bf7', live: true  },
  { id: 'aptos',     name: 'Aptos',     symbol: 'APT',  encoding: 'BCS',      color: '#00d4aa', live: true  },
  { id: 'bitcoin',   name: 'Bitcoin',   symbol: 'BTC',  encoding: 'UTXO',     color: '#f7931a', live: false },
  { id: 'sui',       name: 'Sui',       symbol: 'SUI',  encoding: 'BCS',      color: '#4da2ff', live: false },
  { id: 'polkadot',  name: 'Polkadot',  symbol: 'DOT',  encoding: 'SCALE',    color: '#e6007a', live: false },
  { id: 'starknet',  name: 'StarkNet',  symbol: 'STRK', encoding: 'Cairo',    color: '#ff6b35', live: false },
]

export async function decode(chain, txHash) {
  const params = new URLSearchParams({ chain, hash: txHash })
  const res = await fetch(`http://localhost:3000/api/decode?${params}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export function shortAddress(addr, chars = 6) {
  if (!addr || addr.length <= chars * 2) return addr
  return addr.slice(0, chars) + '…' + addr.slice(-4)
}

export function formatAmount(amount, decimals = 18, symbol = '') {
  if (!amount || amount === '0') return symbol ? '0 ' + symbol : '0'
  try {
    const raw = BigInt(amount)
    const div = BigInt(10 ** Math.min(decimals, 18))
    const whole = raw / div
    const frac = (raw % div).toString().padStart(decimals, '0').slice(0, 4).replace(/0+$/, '')
    const fmt = whole.toLocaleString() + (frac ? '.' + frac : '')
    return symbol ? fmt + ' ' + symbol : fmt
  } catch {
    return symbol ? amount + ' ' + symbol : String(amount)
  }
}

export default { decode, shortAddress, formatAmount, SUPPORTED_CHAINS }
