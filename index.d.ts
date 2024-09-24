interface EthereumProvider {
  isMetaMask?: boolean // 标识是否为 MetaMask 提供商
  request: (args: { method: string; params?: any[] }) => Promise<any> // 通用的请求方法
  on: (event: string, handler: (...args: any[]) => void) => void // 事件监听器
  removeListener: (event: string, handler: (...args: any[]) => void) => void // 事件移除
}

interface Window {
  ethereum: EthereumProvider // 使得 window.ethereum 可选
}
